begin;

-- ---------------------------------------------------------------------------
-- Huit nouvelles stations ECOS (station-13 à station-20, ADR-015) : psychiatrie,
-- pédiatrie, dermatologie, gastro-entérologie, néphrologie, neurologie,
-- infectiologie et cardiologie. Le script, la grille et le débriefing vivent
-- dans lib/ecos/stations ; la base ne garde que l'interrupteur éditorial.
-- Comme dans scripts/seed-supabase-content.mjs, le diagnostic n'est jamais
-- stocké ici. Idempotent : une station déjà présente n'est pas modifiée.
-- ---------------------------------------------------------------------------
insert into public.clinical_cases (specialty_id, slug, title, patient, scenario, evaluation_grid, difficulty, status)
select s.id, v.slug, v.title, v.patient, v.scenario, '[]'::jsonb, v.difficulty, 'published'
from (values
  ('Psychiatrie', 'humeur-depressive-idees-suicidaires', 'Épisode dépressif avec idées suicidaires', '{"label": "Mme Dubois, 41 ans"}'::jsonb, '{"setting": "cabinet", "duration": "13 min", "tags": ["Anamnèse", "Raisonnement", "Prise en charge"], "candidate_title": "Fatigue et perte d’envie depuis plusieurs semaines"}'::jsonb, 'hard'),
  ('Pédiatrie', 'convulsion-febrile', 'Convulsion fébrile', '{"label": "Léo, 2 ans"}'::jsonb, '{"setting": "urgences", "duration": "13 min", "tags": ["Anamnèse", "Raisonnement", "Prise en charge"], "candidate_title": "Crise convulsive chez un enfant de 2 ans"}'::jsonb, 'medium'),
  ('Dermatologie', 'erysipele-jambe', 'Érysipèle', '{"label": "Mme Huber, 58 ans"}'::jsonb, '{"setting": "cabinet", "duration": "13 min", "tags": ["Anamnèse", "Raisonnement", "Prise en charge"], "candidate_title": "Jambe rouge et douloureuse avec fièvre"}'::jsonb, 'easy'),
  ('Gastro-entérologie', 'cholecystite-aigue', 'Cholécystite aiguë', '{"label": "Mme Moret, 47 ans"}'::jsonb, '{"setting": "urgences", "duration": "13 min", "tags": ["Anamnèse", "Raisonnement", "Prise en charge"], "candidate_title": "Douleur de l’hypocondre droit depuis la nuit"}'::jsonb, 'medium'),
  ('Néphrologie', 'colique-nephretique', 'Colique néphrétique', '{"label": "M. Duc, 38 ans"}'::jsonb, '{"setting": "urgences", "duration": "13 min", "tags": ["Anamnèse", "Raisonnement", "Prise en charge"], "candidate_title": "Douleur lombaire gauche brutale"}'::jsonb, 'easy'),
  ('Neurologie', 'hemorragie-sous-arachnoidienne', 'Hémorragie sous-arachnoïdienne', '{"label": "Mme Berset, 52 ans"}'::jsonb, '{"setting": "urgences", "duration": "13 min", "tags": ["Anamnèse", "Raisonnement", "Prise en charge"], "candidate_title": "Céphalée brutale et intense"}'::jsonb, 'hard'),
  ('Infectiologie', 'pyelonephrite-aigue', 'Pyélonéphrite aiguë', '{"label": "Mme Rochat, 29 ans"}'::jsonb, '{"setting": "cabinet", "duration": "13 min", "tags": ["Anamnèse", "Raisonnement", "Prise en charge"], "candidate_title": "Fièvre et douleur lombaire droite"}'::jsonb, 'easy'),
  ('Cardiologie', 'insuffisance-cardiaque-decompensee', 'Insuffisance cardiaque décompensée', '{"label": "M. Schmid, 74 ans"}'::jsonb, '{"setting": "cabinet", "duration": "13 min", "tags": ["Anamnèse", "Raisonnement", "Prise en charge"], "candidate_title": "Essoufflement croissant et jambes gonflées"}'::jsonb, 'medium')
) as v(specialty, slug, title, patient, scenario, difficulty)
join public.specialties s on s.name = v.specialty
on conflict (slug) do nothing;

commit;
