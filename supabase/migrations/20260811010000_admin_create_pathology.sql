begin;

create or replace function public.admin_create_pathology(
  p_admin_user_id uuid,
  p_specialty_id uuid,
  p_title text,
  p_slug text,
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
    or greatest(
      char_length(coalesce(p_definition, '')),
      char_length(coalesce(p_pathophysiology, '')),
      char_length(coalesce(p_symptoms, '')),
      char_length(coalesce(p_risk_factors, '')),
      char_length(coalesce(p_complementary_exams, '')),
      char_length(coalesce(p_differential_diagnosis, '')),
      char_length(coalesce(p_treatments, '')),
      char_length(coalesce(p_complications, '')),
      char_length(coalesce(p_monitoring, ''))
    ) > 30000 then
    raise exception 'invalid pathology payload';
  end if;

  insert into public.pathologies (
    specialty_id, title, slug, summary, definition, pathophysiology,
    symptoms, risk_factors, complementary_exams, differential_diagnosis,
    treatments, complications, monitoring, difficulty, is_published,
    status, published_at
  ) values (
    p_specialty_id,
    trim(p_title),
    v_slug,
    coalesce(nullif(trim(p_definition), ''), trim(p_title)),
    nullif(trim(p_definition), ''),
    nullif(trim(p_pathophysiology), ''),
    nullif(trim(p_symptoms), ''),
    nullif(trim(p_risk_factors), ''),
    nullif(trim(p_complementary_exams), ''),
    nullif(trim(p_differential_diagnosis), ''),
    nullif(trim(p_treatments), ''),
    nullif(trim(p_complications), ''),
    nullif(trim(p_monitoring), ''),
    p_difficulty,
    p_is_published,
    case when p_is_published then 'published' else 'draft' end,
    case when p_is_published then now() else null end
  ) returning id into v_pathology_id;

  return v_pathology_id;
exception
  when unique_violation then
    raise exception 'pathology slug already exists';
end;
$$;

revoke all on function public.admin_create_pathology(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, boolean
) from public, anon, authenticated;

grant execute on function public.admin_create_pathology(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, boolean
) to service_role;

commit;
