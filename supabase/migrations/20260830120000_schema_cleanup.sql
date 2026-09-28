begin;

-- ---------------------------------------------------------------------------
-- 1. Infrastructure de sessions de quiz jamais consommée par l'application.
--    `user_question_stats` et son trigger de synchronisation sont conservés :
--    ils accumulent des données réelles pour la future révision des erreurs.
-- ---------------------------------------------------------------------------
drop function if exists public.answer_quiz_session_question;
drop function if exists public.start_quiz_session;
drop table if exists public.quiz_session_answers;
drop table if exists public.quiz_session_questions;
drop table if exists public.quiz_sessions;

-- ---------------------------------------------------------------------------
-- 2. Les policies de lecture basculent sur `is_published`, la colonne que
--    l'application utilise, avant la suppression des colonnes `status` legacy.
-- ---------------------------------------------------------------------------
drop policy "pathologies_read_published" on public.pathologies;
create policy "pathologies_read_published" on public.pathologies
  for select to anon, authenticated using (is_published = true);

drop policy "questions_read_published" on public.questions;
create policy "questions_read_published" on public.questions
  for select to authenticated using (is_published = true);

drop policy "question_options_read_published" on public.question_options;
create policy "question_options_read_published" on public.question_options
  for select to authenticated
  using (exists(
    select 1 from public.questions
    where questions.id = question_id and questions.is_published = true
  ));

-- ---------------------------------------------------------------------------
-- 3. `admin_upsert_question` sans les colonnes dupliquées
--    (`prompt`, `status`, `label`, `position`).
-- ---------------------------------------------------------------------------
create or replace function public.admin_upsert_question(
  p_admin_user_id uuid,
  p_question_id uuid,
  p_specialty_id uuid,
  p_pathology_id uuid,
  p_question_text text,
  p_clinical_vignette text,
  p_learning_objective text,
  p_explanation text,
  p_difficulty text,
  p_xp_reward integer,
  p_question_type text,
  p_review_status text,
  p_is_published boolean,
  p_exam_domain text,
  p_source_title text,
  p_source_url text,
  p_source_year integer,
  p_estimated_seconds integer,
  p_topic_ids uuid[],
  p_options jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question_id uuid;
  v_version integer;
  v_option jsonb;
  v_option_count integer;
  v_correct_count integer;
  v_publish boolean := p_is_published and p_review_status = 'approved';
  v_old_snapshot jsonb;
begin
  if not exists(select 1 from public.profiles where id = p_admin_user_id and role = 'admin') then
    raise exception 'admin access required';
  end if;
  if not exists(select 1 from public.specialties where id = p_specialty_id) then
    raise exception 'specialty not found';
  end if;
  if p_pathology_id is not null and not exists(
    select 1 from public.pathologies where id = p_pathology_id and specialty_id = p_specialty_id
  ) then raise exception 'pathology specialty mismatch'; end if;

  if jsonb_typeof(coalesce(p_options, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid options payload';
  end if;
  v_option_count := jsonb_array_length(coalesce(p_options, '[]'::jsonb));
  select count(*) into v_correct_count
  from jsonb_array_elements(coalesce(p_options, '[]'::jsonb)) option_row
  where coalesce((option_row->>'isCorrect')::boolean, false);

  if char_length(trim(p_question_text)) not between 10 and 5000
    or char_length(coalesce(p_explanation, '')) > 10000
    or p_difficulty not in ('facile', 'moyen', 'difficile')
    or p_xp_reward not between 0 and 100
    or p_question_type not in ('single_best_answer', 'multiple_choice', 'long_menu')
    or p_review_status not in ('draft', 'in_review', 'approved', 'rejected')
    or p_estimated_seconds not between 15 and 900
    or (p_source_year is not null and p_source_year not between 1900 and 2100)
    or v_option_count not between 2 and 12
    or (p_question_type = 'single_best_answer' and v_correct_count <> 1)
    or v_correct_count < 1 then
    raise exception 'invalid question payload';
  end if;
  if v_publish and (char_length(trim(coalesce(p_explanation, ''))) < 20
    or char_length(trim(coalesce(p_source_title, ''))) < 3) then
    raise exception 'published question requires explanation and source';
  end if;
  if v_publish and p_question_type <> 'single_best_answer' then
    raise exception 'question type not yet publishable';
  end if;
  if exists(
    select 1 from jsonb_array_elements(p_options) option_row
    where char_length(trim(coalesce(option_row->>'text', ''))) not between 1 and 2000
  ) then raise exception 'invalid option payload'; end if;

  if p_question_id is null then
    insert into public.questions(
      specialty_id, pathology_id, question_text, clinical_vignette,
      learning_objective, explanation, difficulty, xp_reward, question_type,
      review_status, is_published, exam_domain, source_title,
      source_url, source_year, estimated_seconds, version, created_by,
      reviewed_by, reviewed_at, published_at
    ) values (
      p_specialty_id, p_pathology_id, trim(p_question_text),
      nullif(trim(p_clinical_vignette), ''), nullif(trim(p_learning_objective), ''),
      nullif(trim(p_explanation), ''), p_difficulty, p_xp_reward, p_question_type,
      p_review_status, v_publish,
      nullif(trim(p_exam_domain), ''), nullif(trim(p_source_title), ''),
      nullif(trim(p_source_url), ''), p_source_year, p_estimated_seconds, 1,
      p_admin_user_id, case when p_review_status = 'approved' then p_admin_user_id else null end,
      case when p_review_status = 'approved' then now() else null end,
      case when v_publish then now() else null end
    ) returning id, version into v_question_id, v_version;
  else
    select jsonb_build_object(
      'question_text', q.question_text, 'explanation', q.explanation,
      'difficulty', q.difficulty, 'review_status', q.review_status,
      'is_published', q.is_published,
      'options', (select coalesce(jsonb_agg(jsonb_build_object(
        'text', qo.option_text, 'isCorrect', qo.is_correct,
        'orderIndex', qo.order_index, 'explanation', qo.explanation
      ) order by qo.order_index), '[]'::jsonb) from public.question_options qo where qo.question_id = q.id)
    ) into v_old_snapshot
    from public.questions q where q.id = p_question_id for update;
    if not found then raise exception 'question not found'; end if;

    update public.questions set
      specialty_id = p_specialty_id, pathology_id = p_pathology_id,
      question_text = trim(p_question_text),
      clinical_vignette = nullif(trim(p_clinical_vignette), ''),
      learning_objective = nullif(trim(p_learning_objective), ''),
      explanation = nullif(trim(p_explanation), ''), difficulty = p_difficulty,
      xp_reward = p_xp_reward, question_type = p_question_type,
      review_status = p_review_status, is_published = v_publish,
      exam_domain = nullif(trim(p_exam_domain), ''), source_title = nullif(trim(p_source_title), ''),
      source_url = nullif(trim(p_source_url), ''), source_year = p_source_year,
      estimated_seconds = p_estimated_seconds, version = version + 1,
      reviewed_by = case when p_review_status = 'approved' then p_admin_user_id else null end,
      reviewed_at = case when p_review_status = 'approved' then now() else null end,
      published_at = case when v_publish then coalesce(published_at, now()) else null end
    where id = p_question_id returning id, version into v_question_id, v_version;

    insert into public.question_revisions(question_id, version, changed_by, change_type, snapshot)
    values (v_question_id, v_version - 1, p_admin_user_id, 'updated', v_old_snapshot)
    on conflict(question_id, version) do nothing;
    delete from public.question_options where question_id = v_question_id;
  end if;

  for v_option in select value from jsonb_array_elements(p_options) loop
    insert into public.question_options(
      question_id, option_text, is_correct, order_index, explanation
    ) values (
      v_question_id, trim(v_option->>'text'),
      coalesce((v_option->>'isCorrect')::boolean, false),
      coalesce((v_option->>'orderIndex')::integer, 0),
      nullif(trim(coalesce(v_option->>'explanation', '')), '')
    );
  end loop;

  delete from public.question_topic_links where question_id = v_question_id;
  insert into public.question_topic_links(question_id, topic_id)
  select v_question_id, topic_id
  from unnest(coalesce(p_topic_ids, array[]::uuid[])) topic_id
  where exists(select 1 from public.question_topics qt where qt.id = topic_id and (qt.specialty_id is null or qt.specialty_id = p_specialty_id))
  on conflict do nothing;

  if p_question_id is null then
    insert into public.question_revisions(question_id, version, changed_by, change_type, snapshot)
    values (v_question_id, 1, p_admin_user_id, 'created', jsonb_build_object('question_text', trim(p_question_text)))
    on conflict do nothing;
  end if;
  return v_question_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Les signalements vérifient désormais le texte sélectionné dans le
--    document Markdown unifié (`content`) et le résumé, plus dans les
--    anciennes colonnes de sections.
-- ---------------------------------------------------------------------------
create or replace function public.create_pathology_report(
  p_user_id uuid,
  p_pathology_id uuid,
  p_section_key text,
  p_selected_text text,
  p_context_before text,
  p_context_after text,
  p_comment text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source text;
  v_report_id uuid;
  v_selected_normalized text;
  v_source_normalized text;
begin
  if p_user_id is null or p_pathology_id is null
    or char_length(trim(p_selected_text)) not between 1 and 2000
    or char_length(trim(p_comment)) not between 5 and 2000
    or coalesce(char_length(p_context_before), 0) > 500
    or coalesce(char_length(p_context_after), 0) > 500 then
    raise exception 'invalid report payload';
  end if;

  perform 1 from public.profiles where id = p_user_id;
  if not found then raise exception 'profile not found'; end if;

  select concat_ws(' ', p.summary, p.content) into v_source
  from public.pathologies p
  where p.id = p_pathology_id and p.is_published = true;
  if not found or coalesce(trim(v_source), '') = '' then
    raise exception 'report section not found';
  end if;

  v_selected_normalized := regexp_replace(trim(p_selected_text), '\s+', ' ', 'g');
  v_source_normalized := regexp_replace(v_source, '\s+', ' ', 'g');
  if position(v_selected_normalized in v_source_normalized) = 0 then
    raise exception 'selected text not found in section';
  end if;

  insert into public.pathology_reports(
    user_id, pathology_id, section_key, selected_text,
    context_before, context_after, comment
  ) values (
    p_user_id, p_pathology_id, p_section_key, trim(p_selected_text),
    nullif(p_context_before, ''), nullif(p_context_after, ''), trim(p_comment)
  ) returning id into v_report_id;

  return v_report_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4bis. La création admin d'une fiche adopte le document Markdown unifié
--       (résumé + contenu), comme l'édition depuis 20260812153000.
-- ---------------------------------------------------------------------------
drop function if exists public.admin_create_pathology;

create function public.admin_create_pathology(
  p_admin_user_id uuid,
  p_specialty_id uuid,
  p_title text,
  p_slug text,
  p_summary text,
  p_content text,
  p_difficulty text,
  p_is_published boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pathology_id uuid;
  v_slug text := lower(trim(p_slug));
begin
  if not exists (
    select 1 from public.profiles
    where id = p_admin_user_id and role = 'admin'
  ) then raise exception 'admin access required'; end if;

  if not exists (
    select 1 from public.specialties where id = p_specialty_id
  ) then raise exception 'specialty not found'; end if;

  if char_length(trim(p_title)) not between 3 and 200
    or char_length(v_slug) not between 3 and 180
    or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or p_difficulty not in ('facile', 'moyen', 'difficile')
    or char_length(trim(coalesce(p_summary, ''))) not between 10 and 2000
    or char_length(trim(coalesce(p_content, ''))) not between 1 and 100000 then
    raise exception 'invalid pathology payload';
  end if;

  insert into public.pathologies (
    specialty_id, title, slug, summary, content, difficulty, is_published, published_at
  ) values (
    p_specialty_id,
    trim(p_title),
    v_slug,
    trim(p_summary),
    trim(p_content),
    p_difficulty,
    p_is_published,
    case when p_is_published then now() else null end
  ) returning id into v_pathology_id;

  return v_pathology_id;
exception
  when unique_violation then
    raise exception 'pathology slug already exists';
end;
$$;

revoke all on function public.admin_create_pathology(uuid, uuid, text, text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.admin_create_pathology(uuid, uuid, text, text, text, text, text, boolean)
  to service_role;

-- ---------------------------------------------------------------------------
-- 5. Fin des triggers de double-écriture, remplacés par un trigger minimal
--    qui ne gère plus que `published_at`.
-- ---------------------------------------------------------------------------
drop trigger if exists pathologies_sync_phase2_columns on public.pathologies;
drop trigger if exists questions_sync_phase2_columns on public.questions;
drop trigger if exists question_options_sync_phase2_columns on public.question_options;
drop trigger if exists specialties_sync_phase2_columns on public.specialties;
drop trigger if exists profiles_sync_activity_dates on public.profiles;
drop function if exists public.sync_pathology_phase2_columns();
drop function if exists public.sync_question_phase2_columns();
drop function if exists public.sync_question_option_phase2_columns();
drop function if exists public.sync_specialty_phase2_columns();
drop function if exists public.sync_profile_activity_dates();

create or replace function public.set_pathology_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger pathologies_set_published_at
before insert or update on public.pathologies
for each row execute function public.set_pathology_published_at();

-- ---------------------------------------------------------------------------
-- 6. Suppression des colonnes dupliquées et des colonnes de sections rendues
--    obsolètes par le document Markdown unifié `content`.
-- ---------------------------------------------------------------------------
alter table public.pathologies
  drop column if exists status,
  drop column if exists definition,
  drop column if exists pathophysiology,
  drop column if exists symptoms,
  drop column if exists risk_factors,
  drop column if exists complementary_exams,
  drop column if exists differential_diagnosis,
  drop column if exists treatments,
  drop column if exists complications,
  drop column if exists monitoring;

alter table public.questions
  drop column if exists prompt,
  drop column if exists status;

alter table public.question_options
  drop column if exists label,
  drop column if exists position;

alter table public.specialties
  drop column if exists position;

alter table public.profiles
  drop column if exists last_activity_on;

create index if not exists idx_pathologies_specialty_published
  on public.pathologies(specialty_id, is_published);
create index if not exists idx_questions_specialty_published
  on public.questions(specialty_id, is_published);

-- ---------------------------------------------------------------------------
-- 7. Le catalogue éditorial distingue `frequent` : la contrainte accepte la
--    même palette que `content/pathologies/index.json` (le seed ne dégrade
--    plus `frequent` en `important`).
-- ---------------------------------------------------------------------------
alter table public.pathologies drop constraint if exists pathologies_criticality_check;
alter table public.pathologies add constraint pathologies_criticality_check
  check (criticality in ('standard', 'frequent', 'important', 'urgent'));

commit;
