begin;

-- ---------------------------------------------------------------------------
-- Stations d'orthopédie de l'ECOS de 5e année (station-21 à station-23,
-- ADR-019) : genou, hanche, cheville. Ces stations ajoutent une étape
-- « Analyse » : l'étudiant interprète par écrit les examens demandés. Le
-- script, la grille et le débriefing vivent dans lib/ecos/stations ; la base
-- ne garde que l'interrupteur éditorial, sans le diagnostic.
-- Idempotent : une station déjà présente n'est pas modifiée.
-- ---------------------------------------------------------------------------
insert into public.specialties(name, slug, description, icon, color, order_index) values
  ('Orthopédie', 'orthopedie', 'Traumatologie et pathologies de l’appareil locomoteur', 'bone', 'stone', 17)
on conflict(slug) do nothing;

insert into public.clinical_cases (specialty_id, slug, title, patient, scenario, evaluation_grid, difficulty, status)
select s.id, v.slug, v.title, v.patient, v.scenario, '[]'::jsonb, v.difficulty, 'published'
from (values
  ('rupture-ligament-croise-anterieur', 'Rupture du ligament croisé antérieur', '{"label": "M. Reymond, 23 ans"}'::jsonb, '{"setting": "cabinet", "duration": "13 min", "tags": ["ECOS 5ᵉ année", "Anamnèse", "Analyse des examens", "Prise en charge"], "candidate_title": "Genou instable après une torsion au football"}'::jsonb, 'medium'),
  ('fracture-col-femoral', 'Fracture du col fémoral', '{"label": "Mme Pittet, 84 ans"}'::jsonb, '{"setting": "urgences", "duration": "13 min", "tags": ["ECOS 5ᵉ année", "Anamnèse", "Analyse des examens", "Prise en charge"], "candidate_title": "Chute à domicile chez une patiente âgée"}'::jsonb, 'medium'),
  ('fracture-cheville-weber-b', 'Fracture de la malléole latérale (Weber B)', '{"label": "M. Lopes, 34 ans"}'::jsonb, '{"setting": "urgences", "duration": "13 min", "tags": ["ECOS 5ᵉ année", "Anamnèse", "Analyse des examens", "Prise en charge"], "candidate_title": "Traumatisme de la cheville en ratant une marche"}'::jsonb, 'easy')
) as v(slug, title, patient, scenario, difficulty)
join public.specialties s on s.slug = 'orthopedie'
on conflict (slug) do nothing;

commit;
