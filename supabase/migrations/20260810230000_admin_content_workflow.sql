begin;

alter table public.profiles add column if not exists role text not null default 'student';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'admin'));

create table if not exists public.pathology_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pathology_id uuid not null references public.pathologies(id) on delete cascade,
  section_key text not null check (section_key in (
    'definition', 'pathophysiology', 'symptoms', 'risk_factors',
    'complementary_exams', 'differential_diagnosis', 'treatments',
    'complications', 'monitoring'
  )),
  selected_text text not null check (char_length(selected_text) between 1 and 2000),
  context_before text check (char_length(context_before) <= 500),
  context_after text check (char_length(context_after) <= 500),
  comment text not null check (char_length(comment) between 5 and 2000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  admin_note text check (char_length(admin_note) <= 2000),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pathology_reports_status_created
  on public.pathology_reports(status, created_at desc);
create index if not exists idx_pathology_reports_pathology
  on public.pathology_reports(pathology_id, created_at desc);
create index if not exists idx_pathology_reports_user
  on public.pathology_reports(user_id, created_at desc);

drop trigger if exists pathology_reports_set_updated_at on public.pathology_reports;
create trigger pathology_reports_set_updated_at
before update on public.pathology_reports
for each row execute function public.set_updated_at();

alter table public.pathology_reports enable row level security;
drop policy if exists "pathology_reports_read_own" on public.pathology_reports;
create policy "pathology_reports_read_own" on public.pathology_reports
  for select to authenticated using (user_id = auth.uid());

revoke all on public.pathology_reports from anon, authenticated;
grant select on public.pathology_reports to authenticated;

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

  select case p_section_key
    when 'definition' then p.definition
    when 'pathophysiology' then p.pathophysiology
    when 'symptoms' then p.symptoms
    when 'risk_factors' then p.risk_factors
    when 'complementary_exams' then p.complementary_exams
    when 'differential_diagnosis' then p.differential_diagnosis
    when 'treatments' then p.treatments
    when 'complications' then p.complications
    when 'monitoring' then p.monitoring
    else null
  end into v_source
  from public.pathologies p
  where p.id = p_pathology_id and p.is_published = true;
  if not found or v_source is null then raise exception 'report section not found'; end if;

  v_selected_normalized := regexp_replace(trim(p_selected_text), '\s+', ' ', 'g');
  v_source_normalized := regexp_replace(v_source, '\s+', ' ', 'g');
  if position(v_selected_normalized in v_source_normalized) = 0 then
    raise exception 'selected text mismatch';
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

create or replace function public.admin_update_pathology(
  p_admin_user_id uuid,
  p_pathology_id uuid,
  p_title text,
  p_definition text,
  p_pathophysiology text,
  p_symptoms text,
  p_risk_factors text,
  p_complementary_exams text,
  p_differential_diagnosis text,
  p_treatments text,
  p_complications text,
  p_monitoring text,
  p_difficulty text,
  p_is_published boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists(
    select 1 from public.profiles
    where id = p_admin_user_id and role = 'admin'
  ) then raise exception 'admin access required'; end if;

  if p_pathology_id is null or char_length(trim(p_title)) not between 3 and 200
    or p_difficulty not in ('facile', 'moyen', 'difficile') then
    raise exception 'invalid pathology payload';
  end if;

  update public.pathologies set
    title = trim(p_title),
    definition = nullif(trim(p_definition), ''),
    summary = coalesce(nullif(trim(p_definition), ''), summary),
    pathophysiology = nullif(trim(p_pathophysiology), ''),
    symptoms = nullif(trim(p_symptoms), ''),
    risk_factors = nullif(trim(p_risk_factors), ''),
    complementary_exams = nullif(trim(p_complementary_exams), ''),
    differential_diagnosis = nullif(trim(p_differential_diagnosis), ''),
    treatments = nullif(trim(p_treatments), ''),
    complications = nullif(trim(p_complications), ''),
    monitoring = nullif(trim(p_monitoring), ''),
    difficulty = p_difficulty,
    is_published = p_is_published,
    version = version + 1,
    updated_at = now()
  where id = p_pathology_id;
  if not found then raise exception 'pathology not found'; end if;
end;
$$;

create or replace function public.admin_review_pathology_report(
  p_admin_user_id uuid,
  p_report_id uuid,
  p_status text,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists(
    select 1 from public.profiles
    where id = p_admin_user_id and role = 'admin'
  ) then raise exception 'admin access required'; end if;
  if p_status not in ('reviewing', 'resolved', 'rejected')
    or coalesce(char_length(p_admin_note), 0) > 2000 then
    raise exception 'invalid report review payload';
  end if;

  update public.pathology_reports set
    status = p_status,
    admin_note = nullif(trim(p_admin_note), ''),
    resolved_by = case when p_status in ('resolved', 'rejected') then p_admin_user_id else null end,
    resolved_at = case when p_status in ('resolved', 'rejected') then now() else null end
  where id = p_report_id;
  if not found then raise exception 'report not found'; end if;
end;
$$;

revoke all on function public.create_pathology_report(uuid, uuid, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.admin_update_pathology(uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, boolean)
  from public, anon, authenticated;
revoke all on function public.admin_review_pathology_report(uuid, uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.create_pathology_report(uuid, uuid, text, text, text, text, text)
  to service_role;
grant execute on function public.admin_update_pathology(uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, boolean)
  to service_role;
grant execute on function public.admin_review_pathology_report(uuid, uuid, text, text)
  to service_role;

commit;
