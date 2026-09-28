begin;

-- Immutable, server-graded attempts. No client-supplied score or XP write.
create table public.anatomy_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null,
  module_slug text not null check (module_slug in ('neuroanatomie', 'coeur-mediastin', 'poumons-plevre', 'abdomen-digestif', 'rein-voies-urinaires', 'nerfs-membres')),
  mode text not null check (mode in ('recall', 'clinical')),
  score integer not null,
  total integer not null check (total between 1 and 50),
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  created_at timestamptz not null default now(),
  primary key (user_id, attempt_id),
  check (score between 0 and total)
);
create index anatomy_attempts_user_recent on public.anatomy_attempts(user_id, created_at desc);
alter table public.anatomy_attempts enable row level security;
revoke all on public.anatomy_attempts from anon, authenticated;
grant select on public.anatomy_attempts to authenticated;
grant all on public.anatomy_attempts to service_role;
create policy anatomy_attempts_select_own on public.anatomy_attempts
  for select to authenticated using (user_id = (select auth.uid()));

commit;
