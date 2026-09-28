alter table public.profiles
  add column if not exists university text,
  add column if not exists study_year text,
  add column if not exists exam_date date,
  add column if not exists learning_priority text,
  add column if not exists priority_specialty_ids uuid[] not null default '{}'::uuid[],
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_skipped_at timestamptz;

alter table public.profiles drop constraint if exists profiles_university_check;
alter table public.profiles add constraint profiles_university_check check (
  university is null or university in ('lausanne', 'geneve', 'fribourg', 'berne', 'bale', 'zurich', 'autre')
);

alter table public.profiles drop constraint if exists profiles_study_year_check;
alter table public.profiles add constraint profiles_study_year_check check (
  study_year is null or study_year in ('b1', 'b2', 'b3', 'm1', 'm2', 'm3', 'autre')
);

alter table public.profiles drop constraint if exists profiles_learning_priority_check;
alter table public.profiles add constraint profiles_learning_priority_check check (
  learning_priority is null or learning_priority in ('fiches', 'qcm', 'cas_cliniques', 'seances')
);

alter table public.profiles drop constraint if exists profiles_priority_specialties_check;
alter table public.profiles add constraint profiles_priority_specialties_check check (
  cardinality(priority_specialty_ids) <= 3
  and array_position(priority_specialty_ids, null) is null
);
