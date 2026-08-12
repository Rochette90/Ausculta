begin;

-- Chaque fiche possède un état de validation distinct de sa publication.
-- La signature conserve l'identité du compte et le nom affiché au moment de
-- la validation afin de rester lisible même si le profil change ensuite.
alter table public.pathologies add column if not exists review_status text not null default 'needs_review';
alter table public.pathologies add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.pathologies add column if not exists reviewer_name text;
alter table public.pathologies add column if not exists reviewed_at timestamptz;

alter table public.pathologies drop constraint if exists pathologies_review_status_check;
alter table public.pathologies add constraint pathologies_review_status_check
  check (review_status in ('needs_review', 'reviewed'));

-- La demande éditoriale remet volontairement l'intégralité du catalogue dans
-- la file de révision. Les fiches restent publiées mais portent l'avertissement.
update public.pathologies set
  review_status = 'needs_review',
  reviewed_by = null,
  reviewer_name = null,
  reviewed_at = null;

-- Toute modification invalide la signature précédente. La fiche devra être
-- explicitement relue puis signée via admin_review_pathology.
create or replace function public.admin_update_pathology(
  p_admin_user_id uuid,
  p_pathology_id uuid,
  p_title text,
  p_content text,
  p_difficulty text,
  p_is_published boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = p_admin_user_id and role = 'admin'
  ) then
    raise exception 'admin access required';
  end if;

  if p_pathology_id is null
    or char_length(trim(p_title)) not between 3 and 200
    or char_length(trim(p_content)) not between 1 and 100000
    or p_difficulty not in ('facile', 'moyen', 'difficile') then
    raise exception 'invalid pathology payload';
  end if;

  update public.pathologies set
    title = trim(p_title),
    content = trim(p_content),
    difficulty = p_difficulty,
    is_published = p_is_published,
    review_status = 'needs_review',
    reviewed_by = null,
    reviewer_name = null,
    reviewed_at = null,
    version = version + 1,
    updated_at = now()
  where id = p_pathology_id;

  if not found then raise exception 'pathology not found'; end if;
end;
$$;

create or replace function public.admin_review_pathology(
  p_admin_user_id uuid,
  p_pathology_id uuid
)
returns table(reviewer_name text, reviewed_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reviewer_name text;
  v_reviewed_at timestamptz := now();
begin
  select coalesce(nullif(trim(full_name), ''), split_part(email, '@', 1), 'Équipe médicale')
  into v_reviewer_name
  from public.profiles
  where id = p_admin_user_id and role = 'admin';

  if v_reviewer_name is null then
    raise exception 'admin access required';
  end if;

  update public.pathologies set
    review_status = 'reviewed',
    reviewed_by = p_admin_user_id,
    reviewer_name = v_reviewer_name,
    reviewed_at = v_reviewed_at,
    updated_at = v_reviewed_at
  where id = p_pathology_id and char_length(trim(coalesce(content, ''))) > 0;

  if not found then raise exception 'pathology not found or empty'; end if;

  return query select v_reviewer_name, v_reviewed_at;
end;
$$;

revoke all on function public.admin_update_pathology(uuid, uuid, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.admin_update_pathology(uuid, uuid, text, text, text, boolean)
  to service_role;

revoke all on function public.admin_review_pathology(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_review_pathology(uuid, uuid)
  to service_role;

create index if not exists idx_pathologies_review_status
  on public.pathologies(review_status, updated_at desc);

commit;
