begin;

insert into public.specialties(name, slug, description, icon, color, order_index) values
  ('Urgences', 'urgences', 'Prise en charge initiale des urgences vitales et situations aiguës', 'siren', 'red', 7),
  ('Radiologie', 'radiologie', 'Imagerie diagnostique, indications et interprétation des examens', 'scan-line', 'cyan', 8),
  ('Néphrologie', 'nephrologie', 'Pathologies rénales, hydro-électrolytiques et dialyse', 'droplets', 'blue', 9),
  ('Hématologie', 'hematologie', 'Maladies du sang, de la coagulation et de la moelle', 'microscope', 'fuchsia', 10),
  ('Oncologie', 'oncologie', 'Diagnostic, traitements et suivi des cancers', 'ribbon', 'purple', 11),
  ('Pédiatrie', 'pediatrie', 'Santé, croissance et pathologies de l’enfant', 'baby', 'lime', 12),
  ('Gynécologie-obstétrique', 'gynecologie-obstetrique', 'Santé gynécologique, grossesse et accouchement', 'venus-and-mars', 'pink', 13),
  ('Psychiatrie', 'psychiatrie', 'Troubles psychiques, diagnostic et prise en charge', 'brain-circuit', 'indigo', 14),
  ('Rhumatologie', 'rhumatologie', 'Maladies articulaires, osseuses et auto-immunes', 'bone', 'stone', 15),
  ('Dermatologie', 'dermatologie', 'Maladies de la peau, des muqueuses et des phanères', 'activity', 'amber', 16)
on conflict(slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  color = excluded.color,
  order_index = excluded.order_index;

commit;
