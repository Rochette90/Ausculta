alter table public.profiles add column xp integer not null default 0 check (xp >= 0);
alter table public.profiles add column level integer not null default 1 check (level >= 1);
alter table public.profiles add column streak integer not null default 0 check (streak >= 0);
alter table public.profiles add column last_activity_on date;

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.pathologies (
  id uuid primary key default gen_random_uuid(),
  specialty_id uuid not null references public.specialties(id) on delete restrict,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  content text,
  criticality text not null default 'important' check (criticality in ('standard', 'important', 'urgent')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  version integer not null default 1 check (version > 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_pathologies_specialty_status on public.pathologies(specialty_id, status);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  specialty_id uuid references public.specialties(id) on delete set null,
  pathology_id uuid references public.pathologies(id) on delete set null,
  prompt text not null,
  explanation text not null default '',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_questions_specialty_status on public.questions(specialty_id, status);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  position integer not null default 0,
  unique(question_id, position)
);
create unique index idx_question_options_one_correct on public.question_options(question_id) where is_correct;

create table public.clinical_cases (
  id uuid primary key default gen_random_uuid(),
  specialty_id uuid references public.specialties(id) on delete set null,
  slug text not null unique,
  title text not null,
  patient jsonb not null default '{}'::jsonb,
  scenario jsonb not null default '{}'::jsonb,
  evaluation_grid jsonb not null default '[]'::jsonb,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_clinical_cases_specialty_status on public.clinical_cases(specialty_id, status);

create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_type text not null check (resource_type in ('pathology', 'quiz', 'clinical_case', 'training')),
  resource_id text not null,
  status text not null default 'started' check (status in ('started', 'completed', 'mastered')),
  best_score integer not null default 0 check (best_score between 0 and 100),
  attempts integer not null default 1 check (attempts > 0),
  first_started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, resource_type, resource_id)
);
create index idx_user_progress_user_activity on public.user_progress(user_id, last_activity_at desc);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  specialty_id uuid references public.specialties(id) on delete set null,
  quiz_key text not null,
  score integer not null check (score >= 0),
  max_score integer not null check (max_score > 0),
  answers jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now()
);
create index idx_quiz_attempts_user_completed on public.quiz_attempts(user_id, completed_at desc);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key(user_id, badge_id)
);
create index idx_user_badges_awarded on public.user_badges(user_id, awarded_at desc);

create trigger pathologies_set_updated_at before update on public.pathologies
for each row execute function public.set_updated_at();
create trigger questions_set_updated_at before update on public.questions
for each row execute function public.set_updated_at();
create trigger clinical_cases_set_updated_at before update on public.clinical_cases
for each row execute function public.set_updated_at();

alter table public.specialties enable row level security;
alter table public.pathologies enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.clinical_cases enable row level security;
alter table public.user_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "specialties_read" on public.specialties for select to anon, authenticated using (true);
create policy "pathologies_read_published" on public.pathologies for select to anon, authenticated using (status = 'published');
create policy "questions_read_published" on public.questions for select to authenticated using (status = 'published');
create policy "question_options_read_published" on public.question_options for select to authenticated
using (exists(select 1 from public.questions where questions.id = question_id and questions.status = 'published'));
create policy "clinical_cases_read_published" on public.clinical_cases for select to authenticated using (status = 'published');
create policy "user_progress_read_own" on public.user_progress for select to authenticated using (user_id = auth.uid());
create policy "quiz_attempts_read_own" on public.quiz_attempts for select to authenticated using (user_id = auth.uid());
create policy "badges_read" on public.badges for select to authenticated using (true);
create policy "user_badges_read_own" on public.user_badges for select to authenticated using (user_id = auth.uid());

revoke all on public.specialties, public.pathologies, public.questions, public.question_options,
  public.clinical_cases, public.user_progress, public.quiz_attempts, public.badges, public.user_badges
from anon, authenticated;
grant select on public.specialties, public.pathologies to anon, authenticated;
grant select on public.questions, public.question_options, public.clinical_cases,
  public.user_progress, public.quiz_attempts, public.badges, public.user_badges to authenticated;

insert into public.specialties(slug, name, position) values
  ('cardiologie', 'Cardiologie', 1),
  ('neurologie', 'Neurologie', 2),
  ('infectiologie', 'Infectiologie', 3),
  ('pneumologie', 'Pneumologie', 4),
  ('gastro-enterologie', 'Gastro-entérologie', 5),
  ('endocrinologie', 'Endocrinologie', 6)
on conflict(slug) do update set name = excluded.name, position = excluded.position;

insert into public.badges(slug, name, description, icon, criteria) values
  ('premier-pas', 'Premier pas', 'Terminer une première activité.', '✦', '{"activities": 1}'),
  ('premier-cas', 'Premier cas clinique', 'Terminer une première station ECOS.', '◉', '{"clinical_cases": 1}'),
  ('serie-7', 'Série de 7 jours', 'S’entraîner sept jours consécutifs.', '🔥', '{"streak": 7}')
on conflict(slug) do update set name = excluded.name, description = excluded.description,
  icon = excluded.icon, criteria = excluded.criteria;

update public.profiles p set
  xp = coalesce((select sum(amount) from public.xp_events where user_id = p.id), 0) +
    coalesce((select sum(xp) from public.activity_events where user_id = p.id), 0),
  level = floor((coalesce((select sum(amount) from public.xp_events where user_id = p.id), 0) +
    coalesce((select sum(xp) from public.activity_events where user_id = p.id), 0)) / 250.0)::integer + 1;

create or replace function public.award_automatic_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_streak integer;
begin
  select streak into v_streak from public.profiles where id = p_user_id;
  if exists(select 1 from public.activity_events where user_id = p_user_id)
    or exists(select 1 from public.xp_events where user_id = p_user_id) then
    insert into public.user_badges(user_id, badge_id)
    select p_user_id, id from public.badges where slug = 'premier-pas' on conflict do nothing;
  end if;
  if exists(select 1 from public.xp_events where user_id = p_user_id) then
    insert into public.user_badges(user_id, badge_id)
    select p_user_id, id from public.badges where slug = 'premier-cas' on conflict do nothing;
  end if;
  if v_streak >= 7 then
    insert into public.user_badges(user_id, badge_id)
    select p_user_id, id from public.badges where slug = 'serie-7' on conflict do nothing;
  end if;
end;
$$;

create or replace function public.record_activity(
  p_user_id uuid,
  p_activity_type text,
  p_activity_id text,
  p_score integer,
  p_xp integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_today date := (now() at time zone 'Europe/Zurich')::date;
  v_resource_type text;
begin
  insert into public.activity_events(user_id, activity_type, activity_id, score, xp, completed_on)
  values (p_user_id, p_activity_type, p_activity_id, p_score, p_xp, v_today)
  on conflict(user_id, activity_type, activity_id, completed_on) do nothing
  returning id into v_id;
  if v_id is null then return; end if;

  update public.profiles set
    xp = public.profiles.xp + p_xp,
    level = floor((public.profiles.xp + p_xp) / 250.0)::integer + 1,
    streak = case when last_activity_on = v_today then streak
      when last_activity_on = v_today - 1 then streak + 1 else 1 end,
    last_activity_on = v_today
  where id = p_user_id;

  v_resource_type := case p_activity_type when 'fiche' then 'pathology'
    when 'quiz' then 'quiz' when 'rci' then 'training' else 'training' end;
  insert into public.user_progress(user_id, resource_type, resource_id, status, best_score, completed_at)
  values (p_user_id, v_resource_type, p_activity_id, 'completed', p_score, now())
  on conflict(user_id, resource_type, resource_id) do update set
    status = 'completed', best_score = greatest(public.user_progress.best_score, excluded.best_score),
    attempts = public.user_progress.attempts + 1, last_activity_at = now(),
    completed_at = coalesce(public.user_progress.completed_at, now());

  if p_activity_type = 'quiz' then
    insert into public.quiz_attempts(user_id, quiz_key, score, max_score)
    values (p_user_id, p_activity_id, p_score, 100);
  end if;
  perform public.award_automatic_badges(p_user_id);
end;
$$;

create or replace function public.complete_ecos_session(
  p_user_id uuid,
  p_session_id uuid,
  p_score integer,
  p_max_score integer,
  p_xp integer,
  p_transcript jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_xp_id uuid;
  v_slug text;
  v_today date := (now() at time zone 'Europe/Zurich')::date;
begin
  if p_score < 0 or p_score > p_max_score or p_max_score < 1 or p_max_score > 100 or p_xp not between 0 and 300 then
    raise exception 'invalid score';
  end if;
  select station_slug into v_slug from public.ecos_sessions where id = p_session_id and user_id = p_user_id for update;
  if not found then raise exception 'session not found'; end if;
  update public.ecos_sessions set status = 'completed', score = p_score, max_score = p_max_score,
    transcript = p_transcript, completed_at = coalesce(completed_at, now())
  where id = p_session_id and user_id = p_user_id and status = 'active';
  insert into public.xp_events(user_id, session_id, amount) values (p_user_id, p_session_id, p_xp)
  on conflict(session_id) do nothing returning id into v_xp_id;
  if v_xp_id is null then return; end if;

  update public.profiles set
    xp = public.profiles.xp + p_xp,
    level = floor((public.profiles.xp + p_xp) / 250.0)::integer + 1,
    streak = case when last_activity_on = v_today then streak
      when last_activity_on = v_today - 1 then streak + 1 else 1 end,
    last_activity_on = v_today
  where id = p_user_id;
  insert into public.user_progress(user_id, resource_type, resource_id, status, best_score, completed_at)
  values (p_user_id, 'clinical_case', v_slug, 'completed', round(p_score * 100.0 / p_max_score), now())
  on conflict(user_id, resource_type, resource_id) do update set
    status = 'completed', best_score = greatest(public.user_progress.best_score, excluded.best_score),
    attempts = public.user_progress.attempts + 1, last_activity_at = now(),
    completed_at = coalesce(public.user_progress.completed_at, now());
  perform public.award_automatic_badges(p_user_id);
end;
$$;

revoke all on function public.award_automatic_badges(uuid) from public, anon, authenticated;
grant execute on function public.award_automatic_badges(uuid) to service_role;
