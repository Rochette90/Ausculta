begin;

-- Le catalogue éditorial utilise désormais `content` comme document Markdown
-- complet. On remplace l'ancienne RPC, limitée aux colonnes historiques, afin
-- que l'administration et la page publique modifient exactement la même fiche.
drop function if exists public.admin_update_pathology(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, boolean
);

create function public.admin_update_pathology(
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
    version = version + 1,
    updated_at = now()
  where id = p_pathology_id;

  if not found then raise exception 'pathology not found'; end if;
end;
$$;

revoke all on function public.admin_update_pathology(uuid, uuid, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.admin_update_pathology(uuid, uuid, text, text, text, boolean)
  to service_role;

commit;
