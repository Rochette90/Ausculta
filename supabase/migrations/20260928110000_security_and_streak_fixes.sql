begin;

-- ---------------------------------------------------------------------------
-- 1. `admin_upsert_question` : la migration 20260901000000 a ajouté deux
--    paramètres (image), ce qui a créé une nouvelle surcharge à 22 paramètres
--    sans révoquer le droit EXECUTE accordé par défaut. Cette fonction
--    SECURITY DEFINER ne vérifie que `p_admin_user_id`, un identifiant lisible
--    par les clients : elle doit rester réservée au serveur (service_role).
--    L'ancienne surcharge à 20 paramètres n'est plus appelée par l'application.
-- ---------------------------------------------------------------------------
revoke all on function public.admin_upsert_question(
  uuid, uuid, uuid, uuid, text, text, text, text, text, integer, text, text,
  boolean, text, text, text, integer, integer, uuid[], jsonb, text, text
) from public, anon, authenticated;
grant execute on function public.admin_upsert_question(
  uuid, uuid, uuid, uuid, text, text, text, text, text, integer, text, text,
  boolean, text, text, text, integer, integer, uuid[], jsonb, text, text
) to service_role;

drop function if exists public.admin_upsert_question(
  uuid, uuid, uuid, uuid, text, text, text, text, text, integer, text, text,
  boolean, text, text, text, integer, integer, uuid[], jsonb
);

-- ---------------------------------------------------------------------------
-- 2. Profils : toutes les écritures passent par les routes serveur validées
--    (`/api/profile`, `/api/profile/avatar`). L'écriture directe de colonnes
--    depuis le navigateur permettait de contourner la validation du nom et du
--    chemin de l'avatar.
-- ---------------------------------------------------------------------------
revoke update on public.profiles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Série quotidienne : toute activité qui rapporte de l'XP compte pour la
--    journée. Auparavant, une activité « non quotidienne » (lecture de fiche,
--    QCM de spécialité) mettait à jour la date de dernière activité sans faire
--    progresser la série : la série n'augmentait plus ce jour-là et un jour
--    manqué n'était pas remis à zéro. Un appel à 0 XP (fiche déjà lue, réponse
--    fausse) ne modifie ni la série ni la date. Le paramètre `is_daily` est
--    conservé pour la compatibilité des appels existants.
-- ---------------------------------------------------------------------------
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
      when xp_amount = 0 then p.streak
      when p.last_activity_date = v_today then greatest(p.streak, 1)
      when p.last_activity_date = v_today - 1 then p.streak + 1
      else 1
    end,
    last_activity_date = case when xp_amount = 0 then p.last_activity_date else v_today end
  where p.id = user_id
  returning p.xp, p.level, p.streak;

  if not found then raise exception 'profile not found'; end if;
end;
$$;

revoke all on function public.add_xp(uuid, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.add_xp(uuid, integer, boolean)
  to service_role;

-- ---------------------------------------------------------------------------
-- 4. Signature médicale d'une fiche : elle porte sur la version relue. Sans
--    contrôle, un second administrateur pouvait enregistrer une nouvelle
--    version entre la relecture et la signature, qui validait alors un contenu
--    jamais relu.
-- ---------------------------------------------------------------------------
drop function if exists public.admin_review_pathology(uuid, uuid);

create or replace function public.admin_review_pathology(
  p_admin_user_id uuid,
  p_pathology_id uuid,
  p_expected_version integer
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
  where id = p_pathology_id
    and version = p_expected_version
    and char_length(trim(coalesce(content, ''))) > 0;

  if not found then
    if exists(select 1 from public.pathologies where id = p_pathology_id and version <> p_expected_version) then
      raise exception 'pathology version mismatch';
    end if;
    raise exception 'pathology not found or empty';
  end if;

  return query select v_reviewer_name, v_reviewed_at;
end;
$$;

revoke all on function public.admin_review_pathology(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.admin_review_pathology(uuid, uuid, integer)
  to service_role;

commit;
