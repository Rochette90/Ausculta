begin;

-- ---------------------------------------------------------------------------
-- Quatorze nouvelles stations ECOS (station-24 à station-37) : huit de
-- l'ECOS de 3ᵉ année (neurologie, cardiologie, digestif, fièvre, psychiatrie,
-- pédiatrie, dermatologie) et six de 5ᵉ année avec étape « Analyse »
-- (gynécologie-obstétrique, pédiatrie, orthopédie, digestif). Le script, la
-- grille et le débriefing vivent dans lib/ecos/stations ; la base ne garde
-- que l'interrupteur éditorial, sans le diagnostic.
-- Idempotent : une station déjà présente n'est pas modifiée.
-- ---------------------------------------------------------------------------
insert into public.specialties(name, slug, description, icon, color, order_index) values
  ('Gynécologie-obstétrique', 'gynecologie-obstetrique', 'Gynécologie, grossesse et urgences obstétricales', 'baby', 'pink', 18)
on conflict(slug) do nothing;

insert into public.clinical_cases (specialty_id, slug, title, patient, scenario, evaluation_grid, difficulty, status)
select s.id, v.slug, v.title, v.patient, v.scenario, '[]'::jsonb, v.difficulty, 'published'
from (values
  ('Neurologie', 'accident-ischemique-transitoire', 'Accident ischémique transitoire', '{"label":"M. Rapin, 72 ans"}'::jsonb, '{"setting":"urgences","duration":"13 min","tags":["Anamnèse","Raisonnement","Prise en charge"],"candidate_title":"M. Rapin, 72 ans, se présente aux urgences car ce matin sa main droite a lâché et il a eu du mal à parler pendant une vingtaine de minutes ; tout est rentré dans l’ordre."}'::jsonb, 'medium'),
  ('Neurologie', 'paralysie-faciale-peripherique', 'Paralysie faciale périphérique', '{"label":"Mme Kohler, 38 ans"}'::jsonb, '{"setting":"cabinet","duration":"13 min","tags":["Anamnèse","Raisonnement","Prise en charge"],"candidate_title":"Mme Kohler, 38 ans, consulte au cabinet car depuis ce matin la moitié gauche de son visage ne bouge plus."}'::jsonb, 'easy'),
  ('Cardiologie', 'stenose-aortique', 'Sténose aortique serrée', '{"label":"M. Aebischer, 78 ans"}'::jsonb, '{"setting":"cabinet","duration":"13 min","tags":["Anamnèse","Raisonnement","Prise en charge"],"candidate_title":"M. Aebischer, 78 ans, consulte au cabinet pour un essoufflement à l’effort et un malaise survenu en montant un escalier."}'::jsonb, 'medium'),
  ('Gastro-entérologie', 'hemorragie-digestive-haute', 'Hémorragie digestive haute', '{"label":"M. Clerc, 64 ans"}'::jsonb, '{"setting":"urgences","duration":"13 min","tags":["Anamnèse","Raisonnement","Prise en charge"],"candidate_title":"M. Clerc, 64 ans, se présente aux urgences pour des selles noires et un malaise ce matin."}'::jsonb, 'hard'),
  ('Infectiologie', 'paludisme-retour-voyage', 'Paludisme au retour de voyage', '{"label":"M. Oberson, 41 ans"}'::jsonb, '{"setting":"urgences","duration":"13 min","tags":["Anamnèse","Raisonnement","Prise en charge"],"candidate_title":"M. Oberson, 41 ans, se présente aux urgences pour de la fièvre et des frissons depuis trois jours."}'::jsonb, 'medium'),
  ('Psychiatrie', 'trouble-adaptation-epuisement', 'Trouble de l’adaptation et épuisement professionnel', '{"label":"Mme Muller, 45 ans"}'::jsonb, '{"setting":"cabinet","duration":"13 min","tags":["Anamnèse","Raisonnement","Prise en charge"],"candidate_title":"Mme Muller, 45 ans, consulte au cabinet pour de la fatigue et des troubles du sommeil."}'::jsonb, 'easy'),
  ('Pédiatrie', 'gastro-enterite-deshydratation', 'Gastro-entérite avec déshydratation', '{"label":"Elio, 18 mois"}'::jsonb, '{"setting":"urgences","duration":"13 min","tags":["Anamnèse","Raisonnement","Prise en charge"],"candidate_title":"Elio, 18 mois, accompagné de sa mère, Mme Ferrari, 32 ans, se présente aux urgences pour des vomissements et de la diarrhée depuis deux jours."}'::jsonb, 'easy'),
  ('Dermatologie', 'melanome-lesion-pigmentee', 'Mélanome', '{"label":"Mme Brunner, 52 ans"}'::jsonb, '{"setting":"cabinet","duration":"13 min","tags":["Anamnèse","Raisonnement","Prise en charge"],"candidate_title":"Mme Brunner, 52 ans, consulte au cabinet pour un grain de beauté du dos qui a changé d’aspect."}'::jsonb, 'easy'),
  ('Gynécologie-obstétrique', 'grossesse-extra-uterine', 'Grossesse extra-utérine', '{"label":"Mme Rey, 31 ans"}'::jsonb, '{"setting":"urgences","duration":"13 min","tags":["ECOS 5ᵉ année","Anamnèse","Analyse des examens","Prise en charge"],"candidate_title":"Mme Rey, 31 ans, se présente aux urgences pour des saignements et une douleur dans le bas du ventre à droite depuis hier."}'::jsonb, 'medium'),
  ('Pédiatrie', 'invagination-intestinale', 'Invagination intestinale aiguë', '{"label":"Mia, 9 mois"}'::jsonb, '{"setting":"urgences","duration":"13 min","tags":["ECOS 5ᵉ année","Anamnèse","Analyse des examens","Prise en charge"],"candidate_title":"M. Baumann, 34 ans, se présente aux urgences avec sa fille Mia, 9 mois, qui pleure par crises et vomit depuis cette nuit."}'::jsonb, 'medium'),
  ('Orthopédie', 'fracture-radius-distal', 'Fracture du radius distal', '{"label":"Mme Morand, 72 ans"}'::jsonb, '{"setting":"urgences","duration":"13 min","tags":["ECOS 5ᵉ année","Anamnèse","Analyse des examens","Prise en charge"],"candidate_title":"Mme Morand, 72 ans, se présente aux urgences pour une douleur au poignet gauche après une chute dans la rue."}'::jsonb, 'easy'),
  ('Orthopédie', 'luxation-epaule', 'Luxation antérieure de l’épaule', '{"label":"M. Bonvin, 24 ans"}'::jsonb, '{"setting":"urgences","duration":"13 min","tags":["ECOS 5ᵉ année","Anamnèse","Analyse des examens","Prise en charge"],"candidate_title":"M. Bonvin, 24 ans, se présente aux urgences pour une douleur à l’épaule gauche après une chute à snowboard."}'::jsonb, 'easy'),
  ('Orthopédie', 'hernie-discale-sciatique', 'Lombosciatique par hernie discale', '{"label":"M. Roulin, 44 ans"}'::jsonb, '{"setting":"cabinet","duration":"13 min","tags":["ECOS 5ᵉ année","Anamnèse","Analyse des examens","Prise en charge"],"candidate_title":"M. Roulin, 44 ans, consulte au cabinet pour une douleur dans le bas du dos qui descend dans la jambe gauche depuis plusieurs semaines."}'::jsonb, 'medium'),
  ('Gastro-entérologie', 'occlusion-intestinale', 'Occlusion du grêle', '{"label":"Mme Zbinden, 69 ans"}'::jsonb, '{"setting":"urgences","duration":"13 min","tags":["ECOS 5ᵉ année","Anamnèse","Analyse des examens","Prise en charge"],"candidate_title":"Mme Zbinden, 69 ans, se présente aux urgences pour des douleurs au ventre et des vomissements depuis hier soir."}'::jsonb, 'medium')
) as v(specialty, slug, title, patient, scenario, difficulty)
join public.specialties s on s.name = v.specialty
on conflict (slug) do nothing;

commit;
