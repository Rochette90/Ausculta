begin;

-- ---------------------------------------------------------------------------
-- Les onze stations ECOS « en préparation » disposent désormais d'un patient
-- simulé scripté, d'une grille et d'un débriefing (lib/ecos/stations). Une
-- station n'est jouable que si elle est publiée ici ET présente dans ce
-- registre. Pour retirer une station, repasser son statut à 'draft'.
-- ---------------------------------------------------------------------------
update public.clinical_cases
set status = 'published',
    version = version + 1
where status = 'draft'
  and slug in (
    'fibrillation-auriculaire',
    'avc-ischemique-sylvien-gauche',
    'meningite-aigue',
    'pneumonie-communautaire',
    'pneumothorax-spontane',
    'embolie-pulmonaire-post-voyage',
    'appendicite-aigue',
    'pancreatite-aigue',
    'acidocetose-diabetique',
    'endocardite-infectieuse',
    'crise-asthme'
  );

-- ---------------------------------------------------------------------------
-- Le diagnostic n'est révélé qu'au débriefing, après la correction serveur.
-- Il ne doit donc pas être lisible directement par les comptes connectés :
-- le titre interne, le slug et le scénario le nomment. L'application lit ces
-- colonnes côté serveur (service_role) et n'expose qu'un code neutre.
-- ---------------------------------------------------------------------------
update public.clinical_cases
set scenario = scenario - 'diagnosis'
where scenario ? 'diagnosis';

revoke select on public.clinical_cases from authenticated;
grant select (id, specialty_id, difficulty, status, version, patient, created_at, updated_at)
  on public.clinical_cases to authenticated;

commit;
