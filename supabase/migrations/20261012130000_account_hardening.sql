-- Durcissement des comptes utilisateurs (audit de sécurité du 2026-10-12).
--
-- 1. Storage : plus aucune écriture directe par les clients. L'application
--    n'écrit dans les buckets qu'avec le client service_role (validation des
--    magic bytes, nommage {uid}/avatar-{ts}.{ext}) ; les policies d'insertion /
--    mise à jour / suppression pour `authenticated` contournaient cette
--    validation (ADR-003). Les policies de lecture restent inchangées.
-- 2. `handle_new_user` : les métadonnées d'inscription (nom, avatar) sont
--    bornées avant d'entrer dans `profiles`.
-- 3. `profiles.email` suit l'adresse de connexion après un changement d'e-mail
--    confirmé (double confirmation côté Auth).
-- 4. Policy `profiles_update_own` supprimée : inopérante depuis la révocation
--    du privilège `update` (20260928110000), elle ne faisait que brouiller la
--    lecture du modèle d'accès.

-- 1. Storage ---------------------------------------------------------------
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;
drop policy if exists "question_images_insert_admin" on storage.objects;
drop policy if exists "question_images_update_admin" on storage.objects;
drop policy if exists "question_images_delete_admin" on storage.objects;

-- 2. Nouveau compte --------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text;
  v_avatar_url text;
begin
  -- Nom : espaces normalisés, caractères de contrôle retirés, 80 caractères max.
  v_full_name := nullif(
    left(
      regexp_replace(
        regexp_replace(coalesce(new.raw_user_meta_data ->> 'full_name', ''), '[[:cntrl:]]', '', 'g'),
        '\s+', ' ', 'g'
      ),
      80
    ),
    ''
  );
  v_full_name := nullif(btrim(v_full_name), '');

  -- Avatar fourni par un fournisseur OAuth : seulement une URL https bornée.
  -- (L'application ne sert que les avatars déposés dans le bucket `avatars`,
  -- cette valeur n'est donc jamais rendue telle quelle.)
  v_avatar_url := new.raw_user_meta_data ->> 'avatar_url';
  if v_avatar_url is null or v_avatar_url !~ '^https://[^[:space:]]{1,2000}$' then
    v_avatar_url := null;
  end if;

  insert into public.profiles(id, email, full_name, avatar_url)
  values (new.id, coalesce(new.email, ''), v_full_name, v_avatar_url)
  on conflict(id) do nothing;
  return new;
end;
$$;

-- 3. Changement d'e-mail confirmé ------------------------------------------
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = coalesce(new.email, ''), updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row execute function public.handle_user_email_change();

-- 4. Policy inopérante -----------------------------------------------------
drop policy if exists "profiles_update_own" on public.profiles;
