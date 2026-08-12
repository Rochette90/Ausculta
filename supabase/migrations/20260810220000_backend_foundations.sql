begin;

-- `last_activity_on` was the Phase 1 name. Keep it synchronized while the
-- application migrates to the clearer `last_activity_date` name.
alter table public.profiles add column if not exists last_activity_date date;
update public.profiles
set last_activity_date = coalesce(last_activity_date, last_activity_on);

create or replace function public.sync_profile_activity_dates()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.last_activity_date := coalesce(new.last_activity_date, new.last_activity_on);
    new.last_activity_on := coalesce(new.last_activity_on, new.last_activity_date);
  elsif new.last_activity_date is distinct from old.last_activity_date then
    new.last_activity_on := new.last_activity_date;
  elsif new.last_activity_on is distinct from old.last_activity_on then
    new.last_activity_date := new.last_activity_on;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_activity_dates on public.profiles;
create trigger profiles_sync_activity_dates
before insert or update on public.profiles
for each row execute function public.sync_profile_activity_dates();

-- One source of truth for XP, level and streak updates.
create or replace function public.add_xp(
  user_id uuid,
  xp_amount integer,
  is_daily boolean default false
)
returns table(new_xp integer, new_level integer, new_streak integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Europe/Zurich')::date;
begin
  if user_id is null or xp_amount is null or xp_amount not between 0 and 1000 then
    raise exception 'invalid xp payload';
  end if;

  return query
  update public.profiles p set
    xp = p.xp + xp_amount,
    level = floor((p.xp + xp_amount) / 100.0)::integer + 1,
    streak = case
      when not is_daily then p.streak
      when p.last_activity_date = v_today then p.streak
      when p.last_activity_date = v_today - 1 then p.streak + 1
      else 1
    end,
    last_activity_date = v_today
  where p.id = user_id
  returning p.xp, p.level, p.streak;

  if not found then raise exception 'profile not found'; end if;
end;
$$;

revoke all on function public.add_xp(uuid, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.add_xp(uuid, integer, boolean)
  to service_role;

-- Align existing profiles with the new global level formula.
update public.profiles set level = floor(xp / 100.0)::integer + 1;

create or replace function public.mark_pathology_as_read(
  p_user_id uuid,
  p_pathology_id uuid,
  p_xp_reward integer default 5
)
returns table(
  awarded_xp integer,
  total_xp integer,
  current_level integer,
  current_streak integer,
  already_completed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_progress_id uuid;
  v_slug text;
  v_awarded_xp integer := 0;
  v_total_xp integer;
  v_level integer;
  v_streak integer;
  v_already_completed boolean := false;
  v_today date := (now() at time zone 'Europe/Zurich')::date;
begin
  if p_user_id is null or p_pathology_id is null or p_xp_reward not between 0 and 50 then
    raise exception 'invalid pathology progress payload';
  end if;

  perform 1 from public.profiles where id = p_user_id for update;
  if not found then raise exception 'profile not found'; end if;

  select p.slug into v_slug
  from public.pathologies p
  where p.id = p_pathology_id and p.is_published = true;
  if not found then raise exception 'pathology not found'; end if;

  select up.id into v_progress_id
  from public.user_progress up
  where up.user_id = p_user_id
    and (
      up.pathology_id = p_pathology_id
      or (
        up.resource_type = 'pathology'
        and up.resource_id in (p_pathology_id::text, v_slug)
      )
    )
  order by (up.pathology_id = p_pathology_id) desc
  limit 1;

  if v_progress_id is null then
    v_awarded_xp := p_xp_reward;
    insert into public.user_progress(
      user_id,
      resource_type,
      resource_id,
      status,
      best_score,
      attempts,
      pathology_id,
      is_completed,
      xp_earned,
      completed_at
    ) values (
      p_user_id,
      'pathology',
      v_slug,
      'completed',
      100,
      1,
      p_pathology_id,
      true,
      v_awarded_xp,
      now()
    );
  else
    v_already_completed := true;
    update public.user_progress set
      resource_type = 'pathology',
      resource_id = v_slug,
      status = 'completed',
      best_score = greatest(best_score, 100),
      pathology_id = p_pathology_id,
      is_completed = true,
      last_activity_at = now(),
      completed_at = coalesce(completed_at, now())
    where id = v_progress_id;
  end if;

  select a.new_xp, a.new_level, a.new_streak
    into v_total_xp, v_level, v_streak
  from public.add_xp(p_user_id, v_awarded_xp, false) a;

  if v_awarded_xp > 0 then
    insert into public.activity_events(
      user_id, activity_type, activity_id, score, xp, completed_on
    ) values (
      p_user_id, 'fiche', v_slug, 100, v_awarded_xp, v_today
    ) on conflict(user_id, activity_type, activity_id, completed_on) do nothing;
    perform public.award_automatic_badges(p_user_id);
  end if;

  return query select
    v_awarded_xp,
    v_total_xp,
    v_level,
    v_streak,
    v_already_completed;
end;
$$;

revoke all on function public.mark_pathology_as_read(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.mark_pathology_as_read(uuid, uuid, integer)
  to service_role;

-- Keep correctness, idempotency and XP in one transaction. The public Server
-- Action calls this function; this function delegates profile math to add_xp.
create or replace function public.answer_question(
  p_user_id uuid,
  p_question_id uuid,
  p_selected_option_id uuid,
  p_is_daily_quiz boolean default false
)
returns table(
  answer_is_correct boolean,
  answer_explanation text,
  awarded_xp integer,
  total_xp integer,
  current_level integer,
  current_streak integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_explanation text;
  v_reward integer;
  v_is_correct boolean;
  v_is_daily_question boolean;
  v_previous_xp integer := 0;
  v_awarded_xp integer := 0;
  v_total_xp integer;
  v_level integer;
  v_streak integer;
  v_today date := (now() at time zone 'Europe/Zurich')::date;
begin
  if p_user_id is null or p_question_id is null or p_selected_option_id is null then
    raise exception 'invalid answer payload';
  end if;

  perform 1 from public.profiles where id = p_user_id for update;
  if not found then raise exception 'profile not found'; end if;

  select q.explanation, q.xp_reward
    into v_explanation, v_reward
  from public.questions q
  where q.id = p_question_id and q.is_published = true;
  if not found then raise exception 'question not found'; end if;

  select qo.is_correct into v_is_correct
  from public.question_options qo
  where qo.id = p_selected_option_id and qo.question_id = p_question_id;
  if not found then raise exception 'option not found'; end if;

  select exists(
    select 1 from public.daily_quizzes dq
    where dq.question_id = p_question_id and dq.quiz_date = v_today
  ) into v_is_daily_question;
  if p_is_daily_quiz and not v_is_daily_question then
    raise exception 'daily question mismatch';
  end if;

  select coalesce(up.xp_earned, 0) into v_previous_xp
  from public.user_progress up
  where up.user_id = p_user_id and up.question_id = p_question_id;

  if v_is_correct and coalesce(v_previous_xp, 0) = 0 then
    v_awarded_xp := v_reward;
  end if;

  insert into public.quiz_attempts(
    user_id, question_id, selected_option_id, is_correct, xp_earned
  ) values (
    p_user_id, p_question_id, p_selected_option_id, v_is_correct, v_awarded_xp
  );

  insert into public.user_progress(
    user_id,
    resource_type,
    resource_id,
    status,
    best_score,
    attempts,
    question_id,
    is_completed,
    is_correct,
    xp_earned,
    completed_at
  ) values (
    p_user_id,
    'quiz',
    p_question_id::text,
    'completed',
    case when v_is_correct then 100 else 0 end,
    1,
    p_question_id,
    true,
    v_is_correct,
    v_awarded_xp,
    now()
  )
  on conflict (user_id, question_id) where question_id is not null
  do update set
    resource_type = coalesce(public.user_progress.resource_type, 'quiz'),
    resource_id = coalesce(public.user_progress.resource_id, excluded.resource_id),
    status = 'completed',
    best_score = greatest(public.user_progress.best_score, excluded.best_score),
    attempts = public.user_progress.attempts + 1,
    last_activity_at = now(),
    completed_at = coalesce(public.user_progress.completed_at, now()),
    is_completed = true,
    is_correct = coalesce(public.user_progress.is_correct, false) or excluded.is_correct,
    xp_earned = greatest(public.user_progress.xp_earned, excluded.xp_earned);

  select a.new_xp, a.new_level, a.new_streak
    into v_total_xp, v_level, v_streak
  from public.add_xp(p_user_id, v_awarded_xp, p_is_daily_quiz) a;

  if v_awarded_xp > 0 then
    insert into public.activity_events(
      user_id, activity_type, activity_id, score, xp, completed_on
    ) values (
      p_user_id, 'question', p_question_id::text, 100, v_awarded_xp, v_today
    ) on conflict(user_id, activity_type, activity_id, completed_on) do nothing;
  end if;

  perform public.award_automatic_badges(p_user_id);

  return query select
    v_is_correct,
    v_explanation,
    v_awarded_xp,
    v_total_xp,
    v_level,
    v_streak;
end;
$$;

revoke all on function public.answer_question(uuid, uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.answer_question(uuid, uuid, uuid, boolean)
  to service_role;

-- Existing activity paths now use the same XP/level formula.
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

  perform * from public.add_xp(p_user_id, p_xp, true);

  v_resource_type := case p_activity_type
    when 'fiche' then 'pathology'
    when 'quiz' then 'quiz'
    when 'rci' then 'training'
    else 'training'
  end;
  insert into public.user_progress(user_id, resource_type, resource_id, status, best_score, completed_at)
  values (p_user_id, v_resource_type, p_activity_id, 'completed', p_score, now())
  on conflict(user_id, resource_type, resource_id) do update set
    status = 'completed',
    best_score = greatest(public.user_progress.best_score, excluded.best_score),
    attempts = public.user_progress.attempts + 1,
    last_activity_at = now(),
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
begin
  if p_score < 0 or p_score > p_max_score or p_max_score < 1 or p_max_score > 100 or p_xp not between 0 and 300 then
    raise exception 'invalid score';
  end if;
  select station_slug into v_slug
  from public.ecos_sessions
  where id = p_session_id and user_id = p_user_id
  for update;
  if not found then raise exception 'session not found'; end if;

  update public.ecos_sessions set
    status = 'completed',
    score = p_score,
    max_score = p_max_score,
    transcript = p_transcript,
    completed_at = coalesce(completed_at, now())
  where id = p_session_id and user_id = p_user_id and status = 'active';

  insert into public.xp_events(user_id, session_id, amount)
  values (p_user_id, p_session_id, p_xp)
  on conflict(session_id) do nothing
  returning id into v_xp_id;
  if v_xp_id is null then return; end if;

  perform * from public.add_xp(p_user_id, p_xp, true);

  insert into public.user_progress(user_id, resource_type, resource_id, status, best_score, completed_at)
  values (p_user_id, 'clinical_case', v_slug, 'completed', round(p_score * 100.0 / p_max_score), now())
  on conflict(user_id, resource_type, resource_id) do update set
    status = 'completed',
    best_score = greatest(public.user_progress.best_score, excluded.best_score),
    attempts = public.user_progress.attempts + 1,
    last_activity_at = now(),
    completed_at = coalesce(public.user_progress.completed_at, now());
  perform public.award_automatic_badges(p_user_id);
end;
$$;

commit;
