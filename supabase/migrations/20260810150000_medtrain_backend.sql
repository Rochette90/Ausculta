create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id text not null,
  price_id text,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_subscriptions_user_status on public.subscriptions(user_id, status);

create table public.ecos_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  station_slug text not null,
  station_version integer not null default 1 check (station_version > 0),
  mode text not null default 'training' check (mode in ('training', 'exam')),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  score integer check (score between 0 and 100),
  max_score integer check (max_score between 1 and 100),
  transcript jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index idx_ecos_sessions_user_started on public.ecos_sessions(user_id, started_at desc);

create table public.ecos_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ecos_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  role text not null check (role in ('patient', 'student', 'system')),
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique(session_id, sequence)
);
create index idx_ecos_messages_user_session on public.ecos_messages(user_id, session_id);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null unique references public.ecos_sessions(id) on delete cascade,
  amount integer not null check (amount between 0 and 300),
  created_at timestamptz not null default now()
);
create index idx_xp_events_user_created on public.xp_events(user_id, created_at desc);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null,
  activity_id text not null,
  score integer not null default 0 check (score between 0 and 100),
  xp integer not null check (xp between 0 and 250),
  completed_on date not null,
  created_at timestamptz not null default now(),
  unique(user_id, activity_type, activity_id, completed_on)
);
create index idx_activity_events_user_date on public.activity_events(user_id, completed_on desc);

create table public.rate_limit_buckets (
  user_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  expires_at timestamptz not null,
  primary key(user_id, scope, window_started_at)
);
create index idx_rate_limit_buckets_expires on public.rate_limit_buckets(expires_at);

create table public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ecos_sessions enable row level security;
alter table public.ecos_messages enable row level security;
alter table public.xp_events enable row level security;
alter table public.activity_events enable row level security;
alter table public.rate_limit_buckets enable row level security;
alter table public.stripe_webhook_events enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using (user_id = auth.uid());
create policy "ecos_sessions_select_own" on public.ecos_sessions for select to authenticated using (user_id = auth.uid());
create policy "ecos_messages_select_own" on public.ecos_messages for select to authenticated using (user_id = auth.uid());
create policy "xp_events_select_own" on public.xp_events for select to authenticated using (user_id = auth.uid());
create policy "activity_events_select_own" on public.activity_events for select to authenticated using (user_id = auth.uid());

revoke all on public.profiles, public.subscriptions, public.ecos_sessions, public.ecos_messages,
  public.xp_events, public.activity_events, public.rate_limit_buckets, public.stripe_webhook_events
  from anon, authenticated;
grant select on public.profiles, public.subscriptions, public.ecos_sessions, public.ecos_messages,
  public.xp_events, public.activity_events to authenticated;
grant update(full_name, avatar_url, updated_at) on public.profiles to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict(id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles(id, email, full_name, avatar_url)
select id, coalesce(email, ''), nullif(raw_user_meta_data ->> 'full_name', ''),
  nullif(raw_user_meta_data ->> 'avatar_url', '')
from auth.users
on conflict(id) do nothing;

create or replace function public.check_rate_limit(
  p_user_id uuid,
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
  if p_limit < 1 or p_window_seconds < 1 or char_length(p_scope) > 80 then
    raise exception 'invalid rate limit parameters';
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limit_buckets(user_id, scope, window_started_at, request_count, expires_at)
  values (p_user_id, p_scope, v_window, 1, v_window + make_interval(secs => p_window_seconds))
  on conflict(user_id, scope, window_started_at)
  do update set request_count = public.rate_limit_buckets.request_count + 1
  returning request_count into v_count;
  delete from public.rate_limit_buckets where expires_at < now() - interval '1 minute';
  return v_count <= p_limit;
end;
$$;

create or replace function public.create_ecos_session(
  p_user_id uuid,
  p_station_slug text,
  p_initial_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid := gen_random_uuid();
begin
  if char_length(p_station_slug) not between 1 and 100 or char_length(p_initial_message) not between 1 and 2000 then
    raise exception 'invalid session payload';
  end if;
  insert into public.ecos_sessions(id, user_id, station_slug) values (v_session_id, p_user_id, p_station_slug);
  insert into public.ecos_messages(session_id, user_id, sequence, role, content)
  values (v_session_id, p_user_id, 0, 'patient', p_initial_message);
  return v_session_id;
end;
$$;

create or replace function public.append_ecos_message(
  p_user_id uuid,
  p_session_id uuid,
  p_role text,
  p_content text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sequence integer;
begin
  if p_role not in ('patient', 'student', 'system') or char_length(p_content) not between 1 and 2000 then
    raise exception 'invalid message';
  end if;
  perform 1 from public.ecos_sessions where id = p_session_id and user_id = p_user_id and status = 'active' for update;
  if not found then raise exception 'session unavailable'; end if;
  select coalesce(max(sequence), -1) + 1 into v_sequence from public.ecos_messages where session_id = p_session_id;
  insert into public.ecos_messages(session_id, user_id, sequence, role, content)
  values (p_session_id, p_user_id, v_sequence, p_role, p_content);
  return v_sequence;
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
begin
  if p_score < 0 or p_score > p_max_score or p_max_score < 1 or p_max_score > 100 or p_xp not between 0 and 300 then
    raise exception 'invalid score';
  end if;
  perform 1 from public.ecos_sessions where id = p_session_id and user_id = p_user_id for update;
  if not found then raise exception 'session not found'; end if;
  update public.ecos_sessions set status = 'completed', score = p_score, max_score = p_max_score,
    transcript = p_transcript, completed_at = coalesce(completed_at, now())
  where id = p_session_id and user_id = p_user_id and status = 'active';
  insert into public.xp_events(user_id, session_id, amount)
  values (p_user_id, p_session_id, p_xp) on conflict(session_id) do nothing;
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
language sql
security definer
set search_path = ''
as $$
  insert into public.activity_events(user_id, activity_type, activity_id, score, xp, completed_on)
  values (p_user_id, p_activity_type, p_activity_id, p_score, p_xp, (now() at time zone 'Europe/Zurich')::date)
  on conflict(user_id, activity_type, activity_id, completed_on) do nothing;
$$;

create or replace function public.get_user_progress(p_user_id uuid)
returns table(total_xp bigint, completed_activities bigint, average_score numeric, streak bigint)
language sql
security definer
set search_path = ''
stable
as $$
  with totals as (
    select
      coalesce((select sum(amount) from public.xp_events where user_id = p_user_id), 0) +
        coalesce((select sum(xp) from public.activity_events where user_id = p_user_id), 0) as xp,
      (select count(*) from public.xp_events where user_id = p_user_id) +
        (select count(*) from public.activity_events where user_id = p_user_id) as completed,
      coalesce((select avg(score) from public.activity_events where user_id = p_user_id), 0) as avg_score
  ), active_days as (
    select distinct completed_on from public.activity_events where user_id = p_user_id
  ), anchor_day as (
    select case when exists(select 1 from active_days where completed_on = (now() at time zone 'Europe/Zurich')::date)
      then (now() at time zone 'Europe/Zurich')::date
      else (now() at time zone 'Europe/Zurich')::date - 1 end as day
  ), streak_value as (
    select coalesce(min(i) filter (where active_days.completed_on is null), 400)::bigint as value
    from anchor_day cross join generate_series(0, 399) as i
    left join active_days on active_days.completed_on = anchor_day.day - i
  )
  select totals.xp::bigint, totals.completed::bigint, totals.avg_score, streak_value.value
  from totals cross join streak_value;
$$;

revoke all on function public.check_rate_limit(uuid, text, integer, integer),
  public.create_ecos_session(uuid, text, text),
  public.append_ecos_message(uuid, uuid, text, text),
  public.complete_ecos_session(uuid, uuid, integer, integer, integer, jsonb),
  public.record_activity(uuid, text, text, integer, integer),
  public.get_user_progress(uuid)
from public, anon, authenticated;
grant execute on function public.check_rate_limit(uuid, text, integer, integer),
  public.create_ecos_session(uuid, text, text),
  public.append_ecos_message(uuid, uuid, text, text),
  public.complete_ecos_session(uuid, uuid, integer, integer, integer, jsonb),
  public.record_activity(uuid, text, text, integer, integer),
  public.get_user_progress(uuid)
to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict(id) do update set public = false, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "avatars_select_own" on storage.objects for select to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

alter publication supabase_realtime add table public.ecos_messages;
