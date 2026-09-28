begin;

create table if not exists public.study_session_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_slug text not null check (session_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  step_id text not null check (step_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  completed_at timestamptz not null default now(),
  primary key(user_id, session_slug, step_id)
);

create index if not exists idx_study_session_progress_user_completed
  on public.study_session_progress(user_id, completed_at desc);

alter table public.study_session_progress enable row level security;
drop policy if exists "study_session_progress_read_own" on public.study_session_progress;
create policy "study_session_progress_read_own"
  on public.study_session_progress for select to authenticated
  using (user_id = auth.uid());

revoke all on public.study_session_progress from anon, authenticated;
grant select on public.study_session_progress to authenticated;

commit;
