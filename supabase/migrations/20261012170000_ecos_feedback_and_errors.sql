begin;

-- ---------------------------------------------------------------------------
-- Avant la phase de test (ADR-016) :
--  1. ecos_feedback : l'avis de l'étudiant à la fin d'une station (note,
--     catégorie, commentaire), rattaché à la session donc au transcript.
--  2. app_errors : journal minimal des erreurs serveur et client, lisible
--     dans l'administration, sans service d'observabilité externe.
--  3. admin_ecos_station_stats : agrégats par station pour l'administration.
-- Aucune de ces tables n'est lisible par anon/authenticated : tout passe par
-- service_role et des RPC security definer.
-- ---------------------------------------------------------------------------

create table if not exists public.ecos_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null unique references public.ecos_sessions(id) on delete cascade,
  station_slug text not null,
  rating smallint not null check (rating between 1 and 5),
  category text not null check (category in ('patient', 'grille', 'debriefing', 'technique', 'autre')),
  comment text not null default '' check (char_length(comment) <= 2000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ecos_feedback_status_created on public.ecos_feedback(status, created_at desc);
create index if not exists idx_ecos_feedback_station on public.ecos_feedback(station_slug, created_at desc);

drop trigger if exists ecos_feedback_set_updated_at on public.ecos_feedback;
create trigger ecos_feedback_set_updated_at
before update on public.ecos_feedback
for each row execute function public.set_updated_at();

create table if not exists public.app_errors (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('server', 'client')),
  path text not null check (char_length(path) <= 300),
  message text not null check (char_length(message) between 1 and 1000),
  digest text check (char_length(digest) <= 100),
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_errors_created on public.app_errors(created_at desc);

alter table public.ecos_feedback enable row level security;
alter table public.app_errors enable row level security;
revoke all on public.ecos_feedback, public.app_errors from anon, authenticated;

-- L'avis ne porte que sur une session terminée de l'auteur ; un second envoi
-- remplace le premier (une station = un avis).
create or replace function public.submit_ecos_feedback(
  p_user_id uuid,
  p_session_id uuid,
  p_rating integer,
  p_category text,
  p_comment text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
  v_id uuid;
begin
  if p_rating is null or p_rating not between 1 and 5
    or p_category not in ('patient', 'grille', 'debriefing', 'technique', 'autre')
    or char_length(coalesce(p_comment, '')) > 2000 then
    raise exception 'invalid feedback payload';
  end if;
  select station_slug into v_slug from public.ecos_sessions
  where id = p_session_id and user_id = p_user_id and status = 'completed';
  if v_slug is null then
    raise exception 'session not found';
  end if;
  insert into public.ecos_feedback (user_id, session_id, station_slug, rating, category, comment)
  values (p_user_id, p_session_id, v_slug, p_rating, p_category, coalesce(p_comment, ''))
  on conflict (session_id) do update
    set rating = excluded.rating, category = excluded.category, comment = excluded.comment, status = 'open'
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_set_ecos_feedback_status(
  p_admin_user_id uuid,
  p_id uuid,
  p_status text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = p_admin_user_id and role = 'admin') then
    raise exception 'admin access required';
  end if;
  if p_status not in ('open', 'resolved') then
    raise exception 'invalid feedback status';
  end if;
  update public.ecos_feedback set status = p_status where id = p_id;
  if not found then
    raise exception 'feedback not found';
  end if;
end;
$$;

-- Les messages sont tronqués plutôt que refusés : une erreur trop longue doit
-- quand même laisser une trace.
create or replace function public.log_app_error(
  p_source text,
  p_path text,
  p_message text,
  p_digest text,
  p_user_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_source not in ('server', 'client') or coalesce(p_message, '') = '' then
    raise exception 'invalid error payload';
  end if;
  insert into public.app_errors (source, path, message, digest, user_id)
  values (p_source, left(coalesce(p_path, ''), 300), left(p_message, 1000), left(p_digest, 100),
    case when exists (select 1 from public.profiles where id = p_user_id) then p_user_id end);
  -- Rétention : 30 jours suffisent pour une phase de test.
  delete from public.app_errors where created_at < now() - interval '30 days';
end;
$$;

-- Une session encore « active » trois heures après son début ne sera jamais
-- terminée (la durée maximale d'entraînement est de 3 h) : elle compte comme abandonnée.
create or replace function public.admin_ecos_station_stats(
  p_admin_user_id uuid,
  p_since timestamptz
) returns table (
  station_slug text,
  started bigint,
  completed bigint,
  abandoned bigint,
  players bigint,
  average_percent numeric,
  feedback_count bigint,
  average_rating numeric
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = p_admin_user_id and role = 'admin') then
    raise exception 'admin access required';
  end if;
  return query
  with sessions as (
    select s.station_slug,
      count(*) as started,
      count(*) filter (where s.status = 'completed') as completed,
      count(*) filter (where s.status = 'abandoned' or (s.status = 'active' and s.started_at < now() - interval '3 hours')) as abandoned,
      count(distinct s.user_id) as players,
      round(avg(100.0 * s.score / nullif(s.max_score, 0)) filter (where s.status = 'completed'), 1) as average_percent
    from public.ecos_sessions s
    where s.started_at >= p_since
    group by s.station_slug
  ), feedback as (
    select f.station_slug, count(*) as feedback_count, round(avg(f.rating), 1) as average_rating
    from public.ecos_feedback f
    where f.created_at >= p_since
    group by f.station_slug
  )
  select coalesce(s.station_slug, f.station_slug), coalesce(s.started, 0), coalesce(s.completed, 0),
    coalesce(s.abandoned, 0), coalesce(s.players, 0), s.average_percent,
    coalesce(f.feedback_count, 0), f.average_rating
  from sessions s
  full join feedback f on f.station_slug = s.station_slug;
end;
$$;

revoke all on function public.submit_ecos_feedback(uuid, uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_ecos_feedback_status(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.log_app_error(text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_ecos_station_stats(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.submit_ecos_feedback(uuid, uuid, integer, text, text) to service_role;
grant execute on function public.admin_set_ecos_feedback_status(uuid, uuid, text) to service_role;
grant execute on function public.log_app_error(text, text, text, text, uuid) to service_role;
grant execute on function public.admin_ecos_station_stats(uuid, timestamptz) to service_role;

commit;
