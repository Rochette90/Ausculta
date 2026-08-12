begin;

-- Phase 2 enriches the existing learning catalog without dropping data or
-- weakening the server-only mutation model used for XP and quiz results.

alter table public.specialties add column if not exists icon text;
alter table public.specialties add column if not exists color text;
alter table public.specialties add column if not exists order_index integer not null default 0;
update public.specialties set order_index = position where order_index = 0 and position <> 0;

create or replace function public.sync_specialty_phase2_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(new.order_index, 0) <> 0 and coalesce(new.position, 0) = 0 then
      new.position := new.order_index;
    else
      new.order_index := new.position;
    end if;
  elsif new.order_index is distinct from old.order_index then
    new.position := new.order_index;
  elsif new.position is distinct from old.position then
    new.order_index := new.position;
  end if;
  return new;
end;
$$;

drop trigger if exists specialties_sync_phase2_columns on public.specialties;
create trigger specialties_sync_phase2_columns before insert or update on public.specialties
for each row execute function public.sync_specialty_phase2_columns();

alter table public.pathologies add column if not exists definition text;
alter table public.pathologies add column if not exists pathophysiology text;
alter table public.pathologies add column if not exists symptoms text;
alter table public.pathologies add column if not exists risk_factors text;
alter table public.pathologies add column if not exists complementary_exams text;
alter table public.pathologies add column if not exists differential_diagnosis text;
alter table public.pathologies add column if not exists treatments text;
alter table public.pathologies add column if not exists complications text;
alter table public.pathologies add column if not exists monitoring text;
alter table public.pathologies add column if not exists difficulty text not null default 'moyen';
alter table public.pathologies add column if not exists is_published boolean not null default false;
alter table public.pathologies drop constraint if exists pathologies_difficulty_check;
alter table public.pathologies add constraint pathologies_difficulty_check
  check (difficulty in ('facile', 'moyen', 'difficile'));
update public.pathologies set
  definition = coalesce(definition, summary),
  is_published = (status = 'published');
create unique index if not exists idx_pathologies_specialty_slug
  on public.pathologies(specialty_id, slug);

create or replace function public.sync_pathology_phase2_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.definition := coalesce(new.definition, new.summary);
    if new.is_published then
      new.status := 'published';
    else
      new.is_published := new.status = 'published';
    end if;
  elsif new.is_published is distinct from old.is_published then
    new.status := case when new.is_published then 'published' else 'draft' end;
  elsif new.status is distinct from old.status then
    new.is_published := new.status = 'published';
  end if;
  if new.is_published and new.published_at is null then new.published_at := now(); end if;
  return new;
end;
$$;

drop trigger if exists pathologies_sync_phase2_columns on public.pathologies;
create trigger pathologies_sync_phase2_columns before insert or update on public.pathologies
for each row execute function public.sync_pathology_phase2_columns();

alter table public.questions add column if not exists question_text text;
alter table public.questions add column if not exists xp_reward integer not null default 10;
alter table public.questions add column if not exists is_published boolean not null default false;
alter table public.questions drop constraint if exists questions_difficulty_check;
update public.questions set
  question_text = coalesce(question_text, prompt),
  is_published = (status = 'published'),
  difficulty = case difficulty
    when 'easy' then 'facile'
    when 'medium' then 'moyen'
    when 'hard' then 'difficile'
    else difficulty
  end;
alter table public.questions alter column question_text set not null;
alter table public.questions alter column slug drop not null;
alter table public.questions alter column difficulty set default 'moyen';
alter table public.questions add constraint questions_difficulty_check
  check (difficulty in ('facile', 'moyen', 'difficile'));
alter table public.questions drop constraint if exists questions_xp_reward_check;
alter table public.questions add constraint questions_xp_reward_check
  check (xp_reward between 0 and 100);

create or replace function public.sync_question_phase2_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.question_text := coalesce(nullif(new.question_text, ''), new.prompt);
    new.prompt := coalesce(nullif(new.prompt, ''), new.question_text);
    if new.is_published then
      new.status := 'published';
    else
      new.is_published := new.status = 'published';
    end if;
  else
    if new.question_text is distinct from old.question_text then
      new.prompt := new.question_text;
    elsif new.prompt is distinct from old.prompt then
      new.question_text := new.prompt;
    end if;
    if new.is_published is distinct from old.is_published then
      new.status := case when new.is_published then 'published' else 'draft' end;
    elsif new.status is distinct from old.status then
      new.is_published := new.status = 'published';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists questions_sync_phase2_columns on public.questions;
create trigger questions_sync_phase2_columns before insert or update on public.questions
for each row execute function public.sync_question_phase2_columns();

alter table public.question_options add column if not exists option_text text;
alter table public.question_options add column if not exists order_index integer not null default 0;
update public.question_options set option_text = coalesce(option_text, label), order_index = position;
alter table public.question_options alter column option_text set not null;

create or replace function public.sync_question_option_phase2_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.option_text := coalesce(nullif(new.option_text, ''), new.label);
    new.label := coalesce(nullif(new.label, ''), new.option_text);
    if coalesce(new.order_index, 0) <> 0 and coalesce(new.position, 0) = 0 then
      new.position := new.order_index;
    else
      new.order_index := new.position;
    end if;
  else
    if new.option_text is distinct from old.option_text then
      new.label := new.option_text;
    elsif new.label is distinct from old.label then
      new.option_text := new.label;
    end if;
    if new.order_index is distinct from old.order_index then
      new.position := new.order_index;
    elsif new.position is distinct from old.position then
      new.order_index := new.position;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists question_options_sync_phase2_columns on public.question_options;
create trigger question_options_sync_phase2_columns before insert or update on public.question_options
for each row execute function public.sync_question_option_phase2_columns();

alter table public.user_progress add column if not exists pathology_id uuid
  references public.pathologies(id) on delete cascade;
alter table public.user_progress add column if not exists question_id uuid
  references public.questions(id) on delete cascade;
alter table public.user_progress add column if not exists is_completed boolean not null default false;
alter table public.user_progress add column if not exists is_correct boolean;
alter table public.user_progress add column if not exists xp_earned integer not null default 0;
alter table public.user_progress alter column resource_type drop not null;
alter table public.user_progress alter column resource_id drop not null;
alter table public.user_progress drop constraint if exists user_progress_target_check;
alter table public.user_progress add constraint user_progress_target_check
  check (num_nonnulls(pathology_id, question_id) <= 1);
alter table public.user_progress drop constraint if exists user_progress_xp_earned_check;
alter table public.user_progress add constraint user_progress_xp_earned_check
  check (xp_earned between 0 and 300);
create unique index if not exists idx_user_progress_user_pathology_unique
  on public.user_progress(user_id, pathology_id) where pathology_id is not null;
create unique index if not exists idx_user_progress_user_question_unique
  on public.user_progress(user_id, question_id) where question_id is not null;

alter table public.quiz_attempts add column if not exists question_id uuid
  references public.questions(id) on delete cascade;
alter table public.quiz_attempts add column if not exists selected_option_id uuid
  references public.question_options(id) on delete set null;
alter table public.quiz_attempts add column if not exists is_correct boolean;
alter table public.quiz_attempts add column if not exists xp_earned integer not null default 0;
alter table public.quiz_attempts alter column quiz_key drop not null;
alter table public.quiz_attempts alter column score drop not null;
alter table public.quiz_attempts alter column max_score drop not null;
alter table public.quiz_attempts drop constraint if exists quiz_attempts_shape_check;
alter table public.quiz_attempts add constraint quiz_attempts_shape_check check (
  (question_id is not null and is_correct is not null)
  or (quiz_key is not null and score is not null and max_score is not null)
);
alter table public.quiz_attempts drop constraint if exists quiz_attempts_xp_earned_check;
alter table public.quiz_attempts add constraint quiz_attempts_xp_earned_check
  check (xp_earned between 0 and 300);
create index if not exists idx_quiz_attempts_question on public.quiz_attempts(question_id);

create table if not exists public.daily_quizzes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  quiz_date date not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_daily_quizzes_date on public.daily_quizzes(quiz_date);
alter table public.daily_quizzes enable row level security;
drop policy if exists "daily_quizzes_read" on public.daily_quizzes;
create policy "daily_quizzes_read" on public.daily_quizzes
  for select to anon, authenticated using (true);
revoke all on public.daily_quizzes from anon, authenticated;
grant select on public.daily_quizzes to anon, authenticated;

-- Progress and attempts remain read-only to clients. Their writes continue to
-- pass through validated server-side functions so XP cannot be self-awarded.

commit;
