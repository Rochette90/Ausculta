begin;

-- Correct answers and XP are evaluated inside Postgres. The browser only gets
-- the public option fields and can never choose its own score or reward.
revoke select on public.question_options from authenticated;
grant select(id, question_id, label, position, option_text, order_index)
  on public.question_options to authenticated;

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

  -- Serialise rewards for one user so two simultaneous submissions cannot
  -- credit the same question twice.
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then raise exception 'profile not found'; end if;

  select q.explanation, q.xp_reward
    into v_explanation, v_reward
  from public.questions q
  where q.id = p_question_id and q.is_published = true;
  if not found then raise exception 'question not found'; end if;

  select qo.is_correct
    into v_is_correct
  from public.question_options qo
  where qo.id = p_selected_option_id and qo.question_id = p_question_id;
  if not found then raise exception 'option not found'; end if;

  select exists(
    select 1
    from public.daily_quizzes dq
    where dq.question_id = p_question_id and dq.quiz_date = v_today
  ) into v_is_daily_question;

  if p_is_daily_quiz and not v_is_daily_question then
    raise exception 'daily question mismatch';
  end if;

  select coalesce(up.xp_earned, 0)
    into v_previous_xp
  from public.user_progress up
  where up.user_id = p_user_id and up.question_id = p_question_id;

  if v_is_correct and coalesce(v_previous_xp, 0) = 0 then
    v_awarded_xp := v_reward;
  end if;

  insert into public.quiz_attempts(
    user_id,
    question_id,
    selected_option_id,
    is_correct,
    xp_earned
  ) values (
    p_user_id,
    p_question_id,
    p_selected_option_id,
    v_is_correct,
    v_awarded_xp
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

  if v_awarded_xp > 0 then
    insert into public.activity_events(
      user_id,
      activity_type,
      activity_id,
      score,
      xp,
      completed_on
    ) values (
      p_user_id,
      'question',
      p_question_id::text,
      100,
      v_awarded_xp,
      v_today
    ) on conflict(user_id, activity_type, activity_id, completed_on) do nothing;
  end if;

  update public.profiles p set
    xp = p.xp + v_awarded_xp,
    level = floor((p.xp + v_awarded_xp) / 250.0)::integer + 1,
    streak = case
      when not p_is_daily_quiz then p.streak
      when p.last_activity_on = v_today then p.streak
      when p.last_activity_on = v_today - 1 then p.streak + 1
      else 1
    end,
    last_activity_on = case when p_is_daily_quiz then v_today else p.last_activity_on end
  where p.id = p_user_id
  returning p.xp, p.level, p.streak
    into v_total_xp, v_level, v_streak;

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

commit;
