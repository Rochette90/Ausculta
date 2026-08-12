begin;

-- Editorial metadata: existing questions remain usable and are backfilled as
-- approved when they are already published.
alter table public.questions add column if not exists question_type text not null default 'single_best_answer';
alter table public.questions add column if not exists review_status text not null default 'draft';
alter table public.questions add column if not exists clinical_vignette text;
alter table public.questions add column if not exists learning_objective text;
alter table public.questions add column if not exists exam_domain text;
alter table public.questions add column if not exists source_title text;
alter table public.questions add column if not exists source_url text;
alter table public.questions add column if not exists source_year integer;
alter table public.questions add column if not exists estimated_seconds integer not null default 90;
alter table public.questions add column if not exists version integer not null default 1;
alter table public.questions add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.questions add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.questions add column if not exists reviewed_at timestamptz;
alter table public.questions add column if not exists published_at timestamptz;

alter table public.questions drop constraint if exists questions_question_type_check;
alter table public.questions add constraint questions_question_type_check
  check (question_type in ('single_best_answer', 'multiple_choice', 'long_menu'));
alter table public.questions drop constraint if exists questions_review_status_check;
alter table public.questions add constraint questions_review_status_check
  check (review_status in ('draft', 'in_review', 'approved', 'rejected'));
alter table public.questions drop constraint if exists questions_estimated_seconds_check;
alter table public.questions add constraint questions_estimated_seconds_check
  check (estimated_seconds between 15 and 900);
alter table public.questions drop constraint if exists questions_source_year_check;
alter table public.questions add constraint questions_source_year_check
  check (source_year is null or source_year between 1900 and 2100);
alter table public.questions drop constraint if exists questions_version_check;
alter table public.questions add constraint questions_version_check check (version > 0);

update public.questions set
  review_status = case when is_published then 'approved' else review_status end,
  published_at = case when is_published then coalesce(published_at, updated_at, created_at) else published_at end;

alter table public.question_options add column if not exists explanation text;
drop index if exists public.idx_question_options_one_correct;
create index if not exists idx_question_options_correct
  on public.question_options(question_id, is_correct);

create table if not exists public.question_topics (
  id uuid primary key default gen_random_uuid(),
  specialty_id uuid references public.specialties(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique(specialty_id, slug)
);
create index if not exists idx_question_topics_specialty on public.question_topics(specialty_id, order_index);

create table if not exists public.question_topic_links (
  question_id uuid not null references public.questions(id) on delete cascade,
  topic_id uuid not null references public.question_topics(id) on delete cascade,
  primary key(question_id, topic_id)
);
create index if not exists idx_question_topic_links_topic on public.question_topic_links(topic_id, question_id);

create table if not exists public.question_revisions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  version integer not null,
  changed_by uuid references public.profiles(id) on delete set null,
  change_type text not null check (change_type in ('created', 'updated', 'reviewed', 'published', 'archived')),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique(question_id, version)
);
create index if not exists idx_question_revisions_question on public.question_revisions(question_id, version desc);

-- Per-user mastery is updated for every legacy or session-based attempt.
create table if not exists public.user_question_stats (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  consecutive_correct integer not null default 0 check (consecutive_correct >= 0),
  mastery_score integer not null default 0 check (mastery_score between 0 and 100),
  needs_review boolean not null default false,
  first_answered_at timestamptz,
  last_answered_at timestamptz,
  last_correct_at timestamptz,
  next_review_at timestamptz,
  primary key(user_id, question_id)
);
create index if not exists idx_user_question_stats_review
  on public.user_question_stats(user_id, needs_review, next_review_at);

create or replace function public.sync_user_question_stats_from_attempt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.question_id is null or new.is_correct is null then return new; end if;

  insert into public.user_question_stats(
    user_id, question_id, attempt_count, correct_count, incorrect_count,
    consecutive_correct, mastery_score, needs_review, first_answered_at,
    last_answered_at, last_correct_at, next_review_at
  ) values (
    new.user_id, new.question_id, 1,
    case when new.is_correct then 1 else 0 end,
    case when new.is_correct then 0 else 1 end,
    case when new.is_correct then 1 else 0 end,
    case when new.is_correct then 100 else 0 end,
    not new.is_correct,
    new.completed_at, new.completed_at,
    case when new.is_correct then new.completed_at else null end,
    new.completed_at + case when new.is_correct then interval '3 days' else interval '1 day' end
  )
  on conflict(user_id, question_id) do update set
    attempt_count = public.user_question_stats.attempt_count + 1,
    correct_count = public.user_question_stats.correct_count + case when new.is_correct then 1 else 0 end,
    incorrect_count = public.user_question_stats.incorrect_count + case when new.is_correct then 0 else 1 end,
    consecutive_correct = case when new.is_correct then public.user_question_stats.consecutive_correct + 1 else 0 end,
    mastery_score = round(
      ((public.user_question_stats.correct_count + case when new.is_correct then 1 else 0 end)::numeric
      / (public.user_question_stats.attempt_count + 1)) * 100
    )::integer,
    needs_review = case
      when not new.is_correct then true
      when public.user_question_stats.consecutive_correct + 1 >= 2 then false
      else public.user_question_stats.needs_review
    end,
    last_answered_at = new.completed_at,
    last_correct_at = case when new.is_correct then new.completed_at else public.user_question_stats.last_correct_at end,
    next_review_at = new.completed_at + case
      when not new.is_correct then interval '1 day'
      when public.user_question_stats.consecutive_correct + 1 >= 2 then interval '14 days'
      else interval '3 days'
    end;
  return new;
end;
$$;

drop trigger if exists quiz_attempts_sync_user_question_stats on public.quiz_attempts;
create trigger quiz_attempts_sync_user_question_stats
after insert on public.quiz_attempts
for each row execute function public.sync_user_question_stats_from_attempt();

-- Backfill mastery from historical attempts before the trigger existed.
insert into public.user_question_stats(
  user_id, question_id, attempt_count, correct_count, incorrect_count,
  consecutive_correct, mastery_score, needs_review, first_answered_at,
  last_answered_at, last_correct_at, next_review_at
)
select
  qa.user_id,
  qa.question_id,
  count(*)::integer,
  count(*) filter (where qa.is_correct)::integer,
  count(*) filter (where not qa.is_correct)::integer,
  case when (array_agg(qa.is_correct order by qa.completed_at desc))[1] then 1 else 0 end,
  round(100.0 * count(*) filter (where qa.is_correct) / count(*))::integer,
  not coalesce((array_agg(qa.is_correct order by qa.completed_at desc))[1], false),
  min(qa.completed_at), max(qa.completed_at),
  max(qa.completed_at) filter (where qa.is_correct),
  max(qa.completed_at) + case
    when coalesce((array_agg(qa.is_correct order by qa.completed_at desc))[1], false) then interval '3 days'
    else interval '1 day'
  end
from public.quiz_attempts qa
where qa.question_id is not null and qa.is_correct is not null
group by qa.user_id, qa.question_id
on conflict(user_id, question_id) do nothing;

-- Durable sessions support specialty, difficulty, exam and error-review modes.
create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('daily', 'specialty', 'difficulty', 'exam', 'errors', 'mixed')),
  specialty_id uuid references public.specialties(id) on delete set null,
  difficulty text check (difficulty is null or difficulty in ('facile', 'moyen', 'difficile')),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned', 'expired')),
  question_count integer not null check (question_count between 1 and 100),
  answered_count integer not null default 0 check (answered_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  score_percent integer check (score_percent between 0 and 100),
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds between 60 and 10800),
  config jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_quiz_sessions_user_started on public.quiz_sessions(user_id, started_at desc);
create index if not exists idx_quiz_sessions_user_status on public.quiz_sessions(user_id, status);

create table if not exists public.quiz_session_questions (
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  position integer not null check (position >= 0),
  primary key(session_id, question_id),
  unique(session_id, position)
);

create table if not exists public.quiz_session_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_option_id uuid references public.question_options(id) on delete set null,
  selected_option_text text not null,
  is_correct boolean not null,
  response_time_ms integer check (response_time_ms is null or response_time_ms between 0 and 3600000),
  answered_at timestamptz not null default now(),
  unique(session_id, question_id)
);
create index if not exists idx_quiz_session_answers_session on public.quiz_session_answers(session_id, answered_at);

create table if not exists public.question_import_batches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  filename text,
  status text not null default 'processing' check (status in ('processing', 'completed', 'partial', 'failed')),
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  failed_rows integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.question_import_errors (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.question_import_batches(id) on delete cascade,
  row_number integer not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Infrastructure for structured clinical-case attempts, independent from ECOS.
create table if not exists public.clinical_case_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  clinical_case_id uuid not null references public.clinical_cases(id) on delete restrict,
  mode text not null default 'training' check (mode in ('training', 'exam')),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  answers jsonb not null default '{}'::jsonb,
  feedback jsonb,
  score integer check (score between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_clinical_case_attempts_user on public.clinical_case_attempts(user_id, started_at desc);

create table if not exists public.user_learning_goals (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  daily_questions integer not null default 10 check (daily_questions between 1 and 200),
  weekly_questions integer not null default 50 check (weekly_questions between 1 and 1000),
  target_specialty_id uuid references public.specialties(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Admin-only atomic question write, including options and version snapshot.
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
      specialty_id, pathology_id, prompt, question_text, clinical_vignette,
      learning_objective, explanation, difficulty, xp_reward, question_type,
      review_status, is_published, status, exam_domain, source_title,
      source_url, source_year, estimated_seconds, version, created_by,
      reviewed_by, reviewed_at, published_at
    ) values (
      p_specialty_id, p_pathology_id, trim(p_question_text), trim(p_question_text),
      nullif(trim(p_clinical_vignette), ''), nullif(trim(p_learning_objective), ''),
      nullif(trim(p_explanation), ''), p_difficulty, p_xp_reward, p_question_type,
      p_review_status, v_publish, case when v_publish then 'published' else 'draft' end,
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
      prompt = trim(p_question_text), question_text = trim(p_question_text),
      clinical_vignette = nullif(trim(p_clinical_vignette), ''),
      learning_objective = nullif(trim(p_learning_objective), ''),
      explanation = nullif(trim(p_explanation), ''), difficulty = p_difficulty,
      xp_reward = p_xp_reward, question_type = p_question_type,
      review_status = p_review_status, is_published = v_publish,
      status = case when v_publish then 'published' else 'draft' end,
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
      question_id, label, option_text, is_correct, position, order_index, explanation
    ) values (
      v_question_id, trim(v_option->>'text'), trim(v_option->>'text'),
      coalesce((v_option->>'isCorrect')::boolean, false),
      coalesce((v_option->>'orderIndex')::integer, 0),
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

create or replace function public.start_quiz_session(
  p_user_id uuid,
  p_mode text,
  p_specialty_id uuid default null,
  p_difficulty text default null,
  p_question_count integer default 10,
  p_time_limit_seconds integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_inserted integer;
begin
  if not exists(select 1 from public.profiles where id = p_user_id) then raise exception 'profile not found'; end if;
  if p_mode not in ('daily', 'specialty', 'difficulty', 'exam', 'errors', 'mixed')
    or p_question_count not between 1 and 100
    or (p_difficulty is not null and p_difficulty not in ('facile', 'moyen', 'difficile'))
    or (p_time_limit_seconds is not null and p_time_limit_seconds not between 60 and 10800)
    or (p_mode = 'specialty' and p_specialty_id is null)
    or (p_mode = 'difficulty' and p_difficulty is null) then
    raise exception 'invalid quiz configuration';
  end if;

  insert into public.quiz_sessions(user_id, mode, specialty_id, difficulty, question_count, time_limit_seconds)
  values (p_user_id, p_mode, p_specialty_id, p_difficulty, p_question_count, p_time_limit_seconds)
  returning id into v_session_id;

  with candidates as (
    select q.id,
      row_number() over(order by
        case when p_mode = 'errors' and coalesce(uqs.needs_review, false) then 0 else 1 end,
        case when p_mode <> 'exam' and coalesce(uqs.needs_review, false) then 0 else 1 end,
        case when uqs.question_id is null then 0 else 1 end,
        random()
      ) - 1 as position
    from public.questions q
    left join public.user_question_stats uqs on uqs.question_id = q.id and uqs.user_id = p_user_id
    where q.is_published = true
      and q.review_status = 'approved'
      and (p_specialty_id is null or q.specialty_id = p_specialty_id)
      and (p_difficulty is null or q.difficulty = p_difficulty)
      and (p_mode <> 'errors' or coalesce(uqs.needs_review, false))
    limit p_question_count
  )
  insert into public.quiz_session_questions(session_id, question_id, position)
  select v_session_id, id, position from candidates;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    delete from public.quiz_sessions where id = v_session_id;
    raise exception 'no questions available';
  end if;
  update public.quiz_sessions set question_count = v_inserted where id = v_session_id;
  return v_session_id;
end;
$$;

create or replace function public.answer_quiz_session_question(
  p_user_id uuid,
  p_session_id uuid,
  p_question_id uuid,
  p_selected_option_id uuid,
  p_response_time_ms integer default null
)
returns table(
  answer_is_correct boolean,
  answer_explanation text,
  awarded_xp integer,
  total_xp integer,
  current_level integer,
  current_streak integer,
  reveal_feedback boolean,
  session_completed boolean,
  session_score integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
  v_time_limit integer;
  v_started_at timestamptz;
  v_selected_text text;
  v_answer record;
  v_answered integer;
  v_correct integer;
  v_total integer;
  v_completed boolean;
  v_score integer;
begin
  select mode, time_limit_seconds, started_at into v_mode, v_time_limit, v_started_at
  from public.quiz_sessions
  where id = p_session_id and user_id = p_user_id and status = 'active'
  for update;
  if not found then raise exception 'active session not found'; end if;
  if v_time_limit is not null and now() > v_started_at + make_interval(secs => v_time_limit) then
    raise exception 'session expired';
  end if;
  if not exists(select 1 from public.quiz_session_questions where session_id = p_session_id and question_id = p_question_id) then
    raise exception 'question not in session';
  end if;
  if exists(select 1 from public.quiz_session_answers where session_id = p_session_id and question_id = p_question_id) then
    raise exception 'question already answered';
  end if;
  if p_response_time_ms is not null and p_response_time_ms not between 0 and 3600000 then
    raise exception 'invalid response time';
  end if;

  select option_text into v_selected_text from public.question_options
  where id = p_selected_option_id and question_id = p_question_id;
  if not found then raise exception 'option not found'; end if;

  select * into v_answer from public.answer_question(p_user_id, p_question_id, p_selected_option_id, false);
  insert into public.quiz_session_answers(
    session_id, question_id, selected_option_id, selected_option_text, is_correct, response_time_ms
  ) values (
    p_session_id, p_question_id, p_selected_option_id, v_selected_text,
    v_answer.answer_is_correct, p_response_time_ms
  );

  select count(*), count(*) filter(where is_correct) into v_answered, v_correct
  from public.quiz_session_answers where session_id = p_session_id;
  select question_count into v_total from public.quiz_sessions where id = p_session_id;
  v_completed := v_answered >= v_total;
  v_score := round(100.0 * v_correct / greatest(v_total, 1))::integer;
  update public.quiz_sessions set
    answered_count = v_answered, correct_count = v_correct,
    score_percent = v_score,
    status = case when v_completed then 'completed' else 'active' end,
    completed_at = case when v_completed then now() else null end
  where id = p_session_id;

  return query select
    v_answer.answer_is_correct,
    case when v_mode = 'exam' then null else v_answer.answer_explanation end,
    v_answer.awarded_xp,
    v_answer.total_xp,
    v_answer.current_level,
    v_answer.current_streak,
    v_mode <> 'exam',
    v_completed,
    v_score;
end;
$$;

-- RLS: clients can read only their own learning history. Every write remains
-- behind authenticated Server Actions and SECURITY DEFINER functions.
alter table public.question_topics enable row level security;
alter table public.question_topic_links enable row level security;
alter table public.question_revisions enable row level security;
alter table public.user_question_stats enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_session_questions enable row level security;
alter table public.quiz_session_answers enable row level security;
alter table public.question_import_batches enable row level security;
alter table public.question_import_errors enable row level security;
alter table public.clinical_case_attempts enable row level security;
alter table public.user_learning_goals enable row level security;

drop policy if exists "question_topics_read" on public.question_topics;
create policy "question_topics_read" on public.question_topics for select to authenticated using (true);
drop policy if exists "question_topic_links_read" on public.question_topic_links;
create policy "question_topic_links_read" on public.question_topic_links for select to authenticated using (true);
drop policy if exists "user_question_stats_read_own" on public.user_question_stats;
create policy "user_question_stats_read_own" on public.user_question_stats for select to authenticated using (user_id = auth.uid());
drop policy if exists "quiz_sessions_read_own" on public.quiz_sessions;
create policy "quiz_sessions_read_own" on public.quiz_sessions for select to authenticated using (user_id = auth.uid());
drop policy if exists "quiz_session_questions_read_own" on public.quiz_session_questions;
create policy "quiz_session_questions_read_own" on public.quiz_session_questions for select to authenticated using (
  exists(select 1 from public.quiz_sessions qs where qs.id = session_id and qs.user_id = auth.uid())
);
drop policy if exists "quiz_session_answers_read_own" on public.quiz_session_answers;
create policy "quiz_session_answers_read_own" on public.quiz_session_answers for select to authenticated using (
  exists(select 1 from public.quiz_sessions qs where qs.id = session_id and qs.user_id = auth.uid())
);
drop policy if exists "clinical_case_attempts_read_own" on public.clinical_case_attempts;
create policy "clinical_case_attempts_read_own" on public.clinical_case_attempts for select to authenticated using (user_id = auth.uid());
drop policy if exists "user_learning_goals_read_own" on public.user_learning_goals;
create policy "user_learning_goals_read_own" on public.user_learning_goals for select to authenticated using (user_id = auth.uid());

revoke all on public.question_topics, public.question_topic_links, public.question_revisions,
  public.user_question_stats, public.quiz_sessions, public.quiz_session_questions,
  public.quiz_session_answers, public.question_import_batches, public.question_import_errors,
  public.clinical_case_attempts, public.user_learning_goals from anon, authenticated;
grant select on public.question_topics, public.question_topic_links, public.user_question_stats,
  public.quiz_sessions, public.quiz_session_questions, public.quiz_session_answers,
  public.clinical_case_attempts, public.user_learning_goals to authenticated;

revoke all on function public.admin_upsert_question(
  uuid, uuid, uuid, uuid, text, text, text, text, text, integer, text, text,
  boolean, text, text, text, integer, integer, uuid[], jsonb
) from public, anon, authenticated;
grant execute on function public.admin_upsert_question(
  uuid, uuid, uuid, uuid, text, text, text, text, text, integer, text, text,
  boolean, text, text, text, integer, integer, uuid[], jsonb
) to service_role;
revoke all on function public.start_quiz_session(uuid, text, uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.start_quiz_session(uuid, text, uuid, text, integer, integer)
  to service_role;
revoke all on function public.answer_quiz_session_question(uuid, uuid, uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.answer_quiz_session_question(uuid, uuid, uuid, uuid, integer)
  to service_role;

commit;
