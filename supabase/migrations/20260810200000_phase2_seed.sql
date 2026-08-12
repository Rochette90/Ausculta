begin;

insert into public.specialties(name, slug, description, icon, color, order_index) values
  ('Cardiologie', 'cardiologie', 'Pathologies du cœur et des vaisseaux', 'heart', 'rose', 1),
  ('Neurologie', 'neurologie', 'Pathologies du système nerveux', 'brain', 'violet', 2),
  ('Pneumologie', 'pneumologie', 'Pathologies respiratoires', 'wind', 'sky', 3),
  ('Gastro-entérologie', 'gastro-enterologie', 'Pathologies digestives', 'activity', 'orange', 4),
  ('Infectiologie', 'infectiologie', 'Maladies infectieuses', 'bug', 'emerald', 5),
  ('Endocrinologie', 'endocrinologie', 'Pathologies hormonales', 'flask-conical', 'amber', 6)
on conflict(slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  color = excluded.color,
  order_index = excluded.order_index;

insert into public.pathologies(
  specialty_id,
  title,
  slug,
  definition,
  pathophysiology,
  symptoms,
  risk_factors,
  complementary_exams,
  differential_diagnosis,
  treatments,
  complications,
  monitoring,
  difficulty,
  is_published
) values (
  (select id from public.specialties where slug = 'cardiologie'),
  'Infarctus du myocarde (SCA ST+)',
  'infarctus-myocarde-sca',
  'Nécrose du muscle cardiaque secondaire à une occlusion coronaire aiguë.',
  'Rupture de plaque d’athérome → thrombose coronaire → ischémie puis nécrose myocardique.',
  'Douleur thoracique constrictive intense, irradiant dans le bras gauche / mâchoire, sueurs, nausées, dyspnée.',
  'Tabac, hypertension, dyslipidémie, diabète, âge, antécédents familiaux, obésité.',
  'ECG (sus-décalage ST), troponines, coronarographie.',
  'Péricardite, myocardite, dissection aortique, embolie pulmonaire, crise d’angoisse.',
  'Aspirine + inhibiteur P2Y12, anticoagulation, reperfusion (angioplastie primaire ou thrombolyse), bêtabloquant, IEC, statine.',
  'Choc cardiogénique, troubles du rythme, rupture cardiaque, insuffisance cardiaque, récidive.',
  'Surveillance scope, troponines, fonction ventriculaire gauche (échographie).',
  'moyen',
  true
)
on conflict(slug) do update set
  specialty_id = excluded.specialty_id,
  title = excluded.title,
  definition = excluded.definition,
  pathophysiology = excluded.pathophysiology,
  symptoms = excluded.symptoms,
  risk_factors = excluded.risk_factors,
  complementary_exams = excluded.complementary_exams,
  differential_diagnosis = excluded.differential_diagnosis,
  treatments = excluded.treatments,
  complications = excluded.complications,
  monitoring = excluded.monitoring,
  difficulty = excluded.difficulty,
  is_published = excluded.is_published;

commit;
