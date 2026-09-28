begin;

-- ---------------------------------------------------------------------------
-- Le formulaire de contact ne faisait qu'ouvrir un brouillon `mailto:` :
-- si l'étudiant n'envoyait pas cet e-mail, le message était perdu et
-- Le produit n'en gardait aucune trace. Cette table capture chaque envoi
-- côté serveur, en plus du brouillon `mailto:` conservé comme repli.
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  topic text not null check (char_length(topic) between 1 and 120),
  message text not null check (char_length(message) between 5 and 4000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_status_created
  on public.contact_messages(status, created_at desc);

alter table public.contact_messages enable row level security;
-- Aucune policy : ni anon ni authenticated ne peuvent lire ou écrire
-- directement. Toute écriture passe par `create_contact_message`
-- (service_role), toute lecture par le client admin côté serveur.
revoke all on public.contact_messages from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Rate limiting anonyme : les visiteurs du formulaire de contact n'ont pas
-- de profil, donc `check_rate_limit` (clé sur `profiles.id`) ne s'applique
-- pas. On limite ici par un hash d'IP fourni par l'API route.
-- ---------------------------------------------------------------------------
create table if not exists public.anonymous_rate_limit_buckets (
  bucket_key text not null,
  scope text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  expires_at timestamptz not null,
  primary key(bucket_key, scope, window_started_at)
);
create index if not exists idx_anonymous_rate_limit_expires
  on public.anonymous_rate_limit_buckets(expires_at);

alter table public.anonymous_rate_limit_buckets enable row level security;
revoke all on public.anonymous_rate_limit_buckets from public, anon, authenticated;

create or replace function public.check_anonymous_rate_limit(
  p_bucket_key text,
  p_scope text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if char_length(p_bucket_key) not between 1 and 200 or p_limit < 1
    or p_window_seconds < 1 or char_length(p_scope) > 80 then
    raise exception 'invalid rate limit parameters';
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.anonymous_rate_limit_buckets(bucket_key, scope, window_started_at, request_count, expires_at)
  values (p_bucket_key, p_scope, v_window, 1, v_window + make_interval(secs => p_window_seconds))
  on conflict(bucket_key, scope, window_started_at)
  do update set request_count = public.anonymous_rate_limit_buckets.request_count + 1
  returning request_count into v_count;
  delete from public.anonymous_rate_limit_buckets where expires_at < now() - interval '1 minute';
  return v_count <= p_limit;
end;
$$;

revoke all on function public.check_anonymous_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_anonymous_rate_limit(text, text, integer, integer)
  to service_role;

create or replace function public.create_contact_message(
  p_name text,
  p_email text,
  p_topic text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if char_length(trim(p_name)) < 1 or char_length(trim(p_name)) > 200
    or char_length(trim(p_email)) < 3 or char_length(trim(p_email)) > 320
    or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    or char_length(trim(p_topic)) < 1 or char_length(trim(p_topic)) > 120
    or char_length(trim(p_message)) < 5 or char_length(trim(p_message)) > 4000 then
    raise exception 'invalid contact message payload';
  end if;

  insert into public.contact_messages(name, email, topic, message)
  values (trim(p_name), trim(p_email), trim(p_topic), trim(p_message))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_contact_message(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_contact_message(text, text, text, text)
  to service_role;

commit;
