import type { EcosProcedureCategory } from "./types";

/**
 * Catalogue commun des gestes et examens proposés pendant l'examen clinique,
 * identique pour toutes les stations : la liste ne trahit plus le diagnostic.
 *
 * Chaque station rattache ses propres gestes à ces entrées (`covers` dans
 * `examination`) et donne, si besoin, le résultat propre au cas
 * (`catalogResults`). Tout ce que la station ne décrit pas rend le résultat
 * normal ci-dessous : il doit donc rester neutre (ni âge, ni sexe, ni valeur
 * qui contredirait les constantes) et chaque station doit décrire tout
 * examen qui serait anormal dans son cas.
 */
export type ExamGroup =
  | "Constantes et mesures"
  | "État général et peau"
  | "Cœur et vaisseaux"
  | "Poumons"
  | "Abdomen et urogénital"
  | "Neurologie et psychiatrie"
  | "ORL et cou"
  | "Appareil locomoteur"
  | "Biologie sanguine"
  | "Urines et prélèvements"
  | "ECG et explorations"
  | "Imagerie"
  | "Scores et questionnaires";

export const EXAM_GROUPS: readonly ExamGroup[] = [
  "Constantes et mesures",
  "État général et peau",
  "Cœur et vaisseaux",
  "Poumons",
  "Abdomen et urogénital",
  "Neurologie et psychiatrie",
  "ORL et cou",
  "Appareil locomoteur",
  "Biologie sanguine",
  "Urines et prélèvements",
  "ECG et explorations",
  "Imagerie",
  "Scores et questionnaires",
];

export type ExamCatalogItem = {
  id: string;
  label: string;
  group: ExamGroup;
  category: EcosProcedureCategory;
  /** Résultat quand la station ne décrit rien pour cet examen. */
  normal: string;
  /** Proposé seulement pour ce sexe (examen gynécologique, β-hCG). */
  sex?: "F" | "M";
  minAge?: number;
  maxAge?: number;
};

type Entry = [id: string, label: string, normal: string, options?: Pick<ExamCatalogItem, "sex" | "minAge" | "maxAge">];

function group(name: ExamGroup, category: EcosProcedureCategory, entries: Entry[]): ExamCatalogItem[] {
  return entries.map(([id, label, normal, options]) => ({ id, label, group: name, category, normal, ...options }));
}

export const EXAM_CATALOG: readonly ExamCatalogItem[] = [
  ...group("Constantes et mesures", "constantes", [
    ["constantes", "Constantes vitales", "Tension artérielle, fréquence cardiaque, fréquence respiratoire, saturation et température dans les normes."],
    ["glasgow", "Score de Glasgow", "Glasgow 15."],
    ["glycemie", "Glycémie capillaire", "Glycémie capillaire 5,4 mmol/L."],
    ["poids", "Poids", "Poids mesuré ; pas de valeur antérieure dans le dossier."],
  ]),
  ...group("État général et peau", "constantes", [
    ["etat-general", "Inspection et état général", "Conscience normale, coloration normale, pas de cyanose ni de marbrures."],
    ["hydratation", "Hydratation et temps de recoloration", "Muqueuses humides, pas de pli cutané, temps de recoloration inférieur à 2 secondes."],
  ]),
  ...group("État général et peau", "examen", [
    ["peau", "Examen de la peau avec vitropression", "Peau sans lésion ni éruption, pas de purpura."],
    ["ictere", "Recherche d’un ictère", "Pas d’ictère cutané ni conjonctival."],
    ["adenopathies", "Recherche d’adénopathies", "Pas d’adénopathie cervicale, axillaire ni inguinale."],
    ["points-appui", "Examen cutané des points d’appui", "Points d’appui sans rougeur ni lésion."],
    ["automutilation", "Recherche de lésions d’automutilation", "Pas de cicatrice ni de lésion d’automutilation."],
    ["marquage-erytheme", "Délimitation d’un érythème au marqueur", "Pas d’érythème à délimiter."],
    ["pieds-interorteils", "Examen des pieds et des espaces interorteils", "Pieds sans lésion, espaces interorteils sains."],
  ]),
  ...group("Cœur et vaisseaux", "examen", [
    ["auscultation-cardiaque", "Auscultation cardiaque", "Bruits du cœur réguliers, sans souffle ni frottement."],
    ["pouls-peripheriques", "Pouls périphériques", "Pouls périphériques présents et symétriques."],
    ["ta-deux-bras", "Tension artérielle aux deux bras", "Pas d’asymétrie tensionnelle entre les deux bras."],
    ["jugulaires", "Jugulaires et reflux hépato-jugulaire", "Pas de turgescence jugulaire, reflux hépato-jugulaire négatif."],
    ["oedemes", "Œdèmes des membres inférieurs", "Pas d’œdème des membres inférieurs."],
    ["mollets", "Palpation des mollets", "Mollets souples, indolores et symétriques."],
    ["auscultation-carotides", "Auscultation des carotides", "Pas de souffle carotidien."],
  ]),
  ...group("Poumons", "examen", [
    ["auscultation-pulmonaire", "Auscultation pulmonaire", "Murmure vésiculaire symétrique, sans bruit surajouté."],
    ["percussion-thoracique", "Percussion et vibrations vocales", "Sonorité normale et symétrique, vibrations vocales bien transmises."],
    ["signes-lutte", "Signes de lutte respiratoire", "Pas de tirage ni de signe de lutte respiratoire."],
    ["trachee", "Position de la trachée", "Trachée médiane, pas d’emphysème sous-cutané."],
  ]),
  ...group("Abdomen et urogénital", "examen", [
    ["palpation-abdominale", "Palpation abdominale", "Abdomen souple, indolore, sans masse."],
    ["auscultation-abdominale", "Auscultation abdominale", "Bruits intestinaux présents et normaux."],
    ["signes-peritoneaux", "Signes péritonéaux (défense, Blumberg)", "Pas de défense ni de contracture, signe de Blumberg négatif."],
    ["mcburney", "Point de McBurney, Rovsing et psoas", "Point de McBurney indolore, signes de Rovsing et du psoas négatifs."],
    ["murphy", "Signe de Murphy", "Signe de Murphy négatif."],
    ["foie-rate", "Palpation du foie et de la rate", "Pas d’hépatomégalie ni de splénomégalie."],
    ["ebranlement-lombaire", "Ébranlement des fosses lombaires", "Ébranlement des fosses lombaires indolore des deux côtés."],
    ["orifices-herniaires", "Orifices herniaires", "Orifices herniaires libres."],
    ["oge", "Organes génitaux externes", "Organes génitaux externes sans particularité."],
    ["toucher-rectal", "Toucher rectal", "Toucher rectal indolore, pas de sang au doigtier.", { minAge: 12 }],
    ["examen-gyneco", "Examen gynécologique au spéculum", "Examen gynécologique sans particularité.", { sex: "F", minAge: 15 }],
  ]),
  ...group("Neurologie et psychiatrie", "examen", [
    ["examen-neurologique", "Examen neurologique (force, sensibilité, réflexes, nerfs crâniens)", "Examen neurologique normal : force, sensibilité, réflexes et nerfs crâniens sans particularité."],
    ["nihss", "Score NIHSS", "NIHSS 0."],
    ["pupilles", "Pupilles", "Pupilles égales, rondes et réactives."],
    ["signes-meninges", "Signes méningés (raideur de nuque, Kernig, Brudzinski)", "Pas de raideur de nuque, signes de Kernig et de Brudzinski négatifs."],
    ["coordination", "Coordination et marche", "Coordination normale, marche sans particularité."],
    ["fond-oeil", "Fond d’œil", "Fond d’œil sans particularité."],
    ["vestibulaire", "Nystagmus et manœuvres vestibulaires (Dix-Hallpike, head impulse test)", "Pas de nystagmus spontané ni positionnel ; manœuvre de Dix-Hallpike et head impulse test négatifs."],
    ["etat-mental", "Examen de l’état mental", "Contact adéquat, discours cohérent, pas de symptôme psychotique ni d’idée suicidaire.", { minAge: 12 }],
  ]),
  ...group("ORL et cou", "examen", [
    ["examen-orl", "Examen ORL (gorge, tympans)", "Gorge calme, tympans normaux."],
    ["thyroide", "Palpation de la thyroïde", "Thyroïde non palpable, sans nodule."],
  ]),
  ...group("Appareil locomoteur", "examen", [
    ["rachis", "Examen du rachis", "Rachis indolore à la palpation, mobilité conservée."],
    ["membres-inferieurs", "Inspection et palpation des membres inférieurs", "Membres inférieurs symétriques, sans rougeur, chaleur, tuméfaction ni déformation."],
    ["hanche", "Mobilisation des hanches", "Mobilisation des hanches complète et indolore."],
    ["genou-inspection", "Inspection et palpation du genou, choc rotulien", "Genoux secs, sans épanchement ni douleur à la palpation."],
    ["genou-mobilite", "Mobilité du genou", "Mobilité des genoux complète et indolore."],
    ["lachman", "Test de Lachman et tiroir antérieur du genou", "Lachman et tiroir antérieur négatifs, arrêt dur."],
    ["genou-collateraux", "Ligaments collatéraux du genou (valgus, varus)", "Pas de laxité en valgus ni en varus."],
    ["menisques", "Tests méniscaux", "Tests méniscaux négatifs."],
    ["ottawa-cheville", "Palpation de la cheville et du pied (critères d’Ottawa)", "Chevilles et pieds indolores à la palpation, appui possible."],
    ["fibula-proximale", "Palpation de la fibula proximale", "Fibula proximale indolore."],
    ["tiroir-cheville", "Tiroir antérieur de la cheville", "Pas de tiroir antérieur de la cheville."],
    ["thompson", "Test de Thompson", "Test de Thompson négatif : tendon d’Achille continu."],
    ["neurovasculaire-distal", "Pouls distaux, sensibilité et motricité des extrémités", "Pouls distaux présents, sensibilité et motricité des extrémités conservées."],
  ]),
  ...group("Biologie sanguine", "complementaire", [
    ["fsc", "Formule sanguine complète", "Formule sanguine dans les normes."],
    ["crp", "CRP", "CRP inférieure à 5 mg/L."],
    ["procalcitonine", "Procalcitonine", "Procalcitonine inférieure à 0,1 µg/L."],
    ["ionogramme", "Ionogramme (Na, K, Cl, Ca, Mg)", "Ionogramme dans les normes."],
    ["creatinine", "Créatinine et urée", "Créatinine et urée dans les normes."],
    ["tests-hepatiques", "Tests hépatiques et bilirubine", "Tests hépatiques et bilirubine dans les normes."],
    ["lipase", "Lipase", "Lipase dans les normes."],
    ["troponine", "Troponine", "Troponine hs négative."],
    ["nt-probnp", "NT-proBNP", "NT-proBNP dans les normes pour l’âge."],
    ["d-dimeres", "D-dimères", "D-dimères inférieurs à 0,5 mg/L."],
    ["crase", "Crase (INR, aPTT)", "Crase normale : INR 1,0, aPTT dans les normes."],
    ["groupe", "Groupe sanguin et anticorps irréguliers", "Groupe sanguin et recherche d’anticorps irréguliers prélevés."],
    ["tsh", "TSH", "TSH dans les normes."],
    ["lactate", "Lactate", "Lactate 1,0 mmol/L."],
    ["ck", "CK", "CK dans les normes."],
    ["gazometrie", "Gazométrie", "pH, pCO₂, pO₂ et bicarbonates dans les normes."],
    ["cetonemie", "Cétonémie", "Cétonémie inférieure à 0,6 mmol/L."],
    ["hba1c", "HbA1c", "HbA1c dans les normes."],
    ["ferritine-b12", "Ferritine, vitamine B12 et folates", "Ferritine, vitamine B12 et folates dans les normes."],
    ["serologies", "Sérologies VIH, VHB, VHC", "Sérologies prélevées ; résultats dans quelques jours."],
    ["alcool-toxiques", "Alcoolémie et dépistage toxicologique", "Alcoolémie nulle, dépistage toxicologique urinaire négatif.", { minAge: 12 }],
    ["hemocultures", "Hémocultures", "Hémocultures prélevées ; résultat dans 24 à 48 heures."],
  ]),
  ...group("Urines et prélèvements", "complementaire", [
    ["bandelette", "Bandelette urinaire", "Bandelette urinaire négative."],
    ["beta-hcg", "Test de grossesse (β-hCG)", "β-hCG négatif.", { sex: "F", minAge: 12, maxAge: 55 }],
    ["culture-urinaire", "Culture urinaire", "Urine envoyée en culture ; résultat dans 48 heures."],
    ["antigenes-urinaires", "Antigènes urinaires (pneumocoque, légionelle)", "Antigènes urinaires pneumocoque et légionelle négatifs."],
    ["strepto-test", "Test rapide du streptocoque (frottis de gorge)", "Test rapide du streptocoque A négatif."],
    ["test-ebv", "Test rapide de mononucléose (sérologie EBV)", "Test rapide de mononucléose négatif."],
    ["prelevement-cutane", "Prélèvement bactériologique cutané", "Prélèvement envoyé ; résultat dans 48 heures."],
    ["ponction-lombaire", "Ponction lombaire", "LCR clair, moins de 5 éléments/µL, protéines et glucose dans les normes."],
    ["ponction-articulaire", "Ponction articulaire", "Pas d’épanchement à ponctionner."],
  ]),
  ...group("ECG et explorations", "complementaire", [
    ["ecg", "ECG 12 dérivations", "Rythme sinusal, fréquence concordante avec les constantes, axe normal, conduction normale, pas de trouble de la repolarisation."],
    ["ecg-droit", "ECG : dérivations droites et postérieures (V4R, V7–V9)", "Pas de sus-décalage du segment ST en V4R ni en V7–V9."],
    ["dep", "Débit expiratoire de pointe", "Débit expiratoire de pointe dans les normes pour l’âge et la taille.", { minAge: 6 }],
    ["spirometrie", "Spirométrie", "Spirométrie normale.", { minAge: 6 }],
    ["eeg", "Électroencéphalogramme", "Tracé de veille normal."],
    ["gastroscopie", "Gastroscopie", "Muqueuse œso-gastro-duodénale normale."],
  ]),
  ...group("Imagerie", "complementaire", [
    ["radio-thorax", "Radiographie du thorax", "Pas de foyer, pas d’épanchement, pas de pneumothorax, silhouette cardiaque normale."],
    ["radio-abdomen", "Radiographie de l’abdomen sans préparation", "Pas de pneumopéritoine, pas de niveau hydro-aérique."],
    ["radio-colonne-cervicale", "Radiographie de la colonne cervicale", "Alignement conservé, pas de fracture."],
    ["radio-bassin-hanche", "Radiographie du bassin et de la hanche", "Pas de fracture du bassin ni des hanches."],
    ["radio-genou", "Radiographie du genou", "Pas de fracture, interlignes conservés, pas d’épanchement."],
    ["radio-cheville", "Radiographie de la cheville", "Pas de fracture, mortaise congruente."],
    ["radio-pied", "Radiographie du pied", "Pas de lésion osseuse."],
    ["radio-jambe", "Radiographie de la jambe", "Pas de lésion osseuse."],
    ["echo-abdominale", "Échographie abdominale", "Foie, vésicule, voies biliaires, reins et rate sans particularité ; pas d’épanchement."],
    ["echo-pleurale", "Échographie pleuro-pulmonaire", "Glissement pleural présent des deux côtés, pas d’épanchement."],
    ["echocardiographie", "Échocardiographie", "FEVG normale, pas de valvulopathie significative, cavités droites non dilatées, pas d’épanchement péricardique."],
    ["echo-veineuse", "Échographie veineuse de compression des membres inférieurs", "Veines compressibles, pas de thrombose."],
    ["echo-articulaire", "Échographie articulaire", "Pas d’épanchement articulaire."],
    ["ct-cerebral", "CT cérébral natif", "Pas d’hémorragie, pas de lésion focale ni d’effet de masse."],
    ["angio-ct-cerebral", "Angio-CT des vaisseaux cérébraux", "Pas d’occlusion artérielle ni d’anévrisme."],
    ["irm-cerebrale", "IRM cérébrale", "IRM cérébrale sans particularité."],
    ["ct-thoracique", "CT thoracique injecté (angio-CT pulmonaire)", "Pas d’embolie pulmonaire, pas de foyer, pas de masse."],
    ["ct-abdominal", "CT abdominal injecté", "Pas d’anomalie intra-abdominale."],
    ["ct-low-dose", "CT abdominal low-dose sans injection", "Pas de calcul, voies urinaires non dilatées."],
    ["irm-genou", "IRM du genou", "Ligaments, ménisques et cartilage sans particularité."],
    ["irm-hanche", "IRM de la hanche", "IRM de la hanche sans particularité."],
    ["ct-cheville", "CT de la cheville", "Pas de fracture."],
  ]),
  ...group("Scores et questionnaires", "complementaire", [
    ["crb65", "Score CRB-65", "Pas de confusion, fréquence respiratoire et tension artérielle sans critère de gravité."],
    ["wells", "Probabilité clinique d’embolie pulmonaire (Wells, Genève)", "Probabilité clinique faible."],
    ["score-appendicite", "Score d’appendicite (AIR, Alvarado)", "Score faible."],
    ["phq9", "Questionnaire PHQ-9", "PHQ-9 : 3/27, pas de symptôme dépressif significatif.", { minAge: 12 }],
  ]),
];

/**
 * Gestes de base que l'étudiant peut toujours demander sans pénalité ni
 * point, sauf si la station les a explicitement jugés inutiles.
 */
export const BASIC_EXAMS: ReadonlySet<string> = new Set(["constantes", "glasgow", "etat-general", "glycemie", "hydratation"]);

export const EXAM_CATALOG_BY_ID: ReadonlyMap<string, ExamCatalogItem> = new Map(EXAM_CATALOG.map((item) => [item.id, item]));

/** Examens proposés pour un patient : le catalogue, moins ce qui ne s'applique pas à son sexe ou à son âge. */
export function examCatalogFor(patient: { sex: "F" | "M"; age: number }): ExamCatalogItem[] {
  return EXAM_CATALOG.filter((item) => (!item.sex || item.sex === patient.sex)
    && (item.minAge === undefined || patient.age >= item.minAge)
    && (item.maxAge === undefined || patient.age <= item.maxAge));
}
