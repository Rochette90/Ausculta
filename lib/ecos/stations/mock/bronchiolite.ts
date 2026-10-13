import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { communicationCriterion, FEVER, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "../shared.ts";

const RHINITIS = ["rhume", "enrhum", "nez", "mouch", "rhinite", "bouche$"];
const COUGH = ["toux", "tousse", "quinte"];
const BREATHING = ["respire", "respiration", "essouffl", "souffle$", "creuse", "tirage", "siffl", "bruit", "du mal a respirer", "dyspn", "halete"];
const FEEDING = ["biberon", "boire", "boit", "bu$", "mange", "manger", "tetee", "tete$", "allait", "sein$", "alimentation", "se nourrit", "quantite", "ml$", "lait"];
const DIURESIS = ["couche", "pipi", "urine", "mouill"];
const APNEA = ["pause", "apnee", "arrete de respirer", "s arrete", "bleu", "cyanos", "violet", "gris$", "change de couleur"];
const BEHAVIOR = ["comportement", "reactif", "somnol", "endormi", "dort", "mou$", "molle", "fatigu", "eveil", "pleure", "geint", "grognon", "sourit", "irritab", "comme d habitude", "consol"];
const BIRTH = ["naissance", "ne a terme", "est ne", "terme$", "prematur", "grossesse", "accouchement", "maternite", "semaines"];
const TERRAIN = ["antecedent", "malad", "malformation", "coeur", "hospitalis", "probleme de sante", "vaccin", "carnet", "deja eu", "deja fait"];
const SMOKE = ["fume", "tabac", "cigarette", "fumee"];
const CONTACTS = ["creche", "garde", "maman de jour", "frere", "soeur", "entourage", "malade autour", "contact", "contag", "quelqu un de malade", "autour de lui"];

export const bronchiolite: EcosScenario = {
  slug: "bronchiolite",
  version: 1,
  setting: "urgences",
  patient: { name: "Noé", age: 0, sex: "M", ageLabel: "4 mois" },
  proxy: true,
  voiceSex: "F",
  persona: "C’est la mère de Noé, nourrisson de 4 mois, qui répond. Inquiète et fatiguée par une nuit sans sommeil, mais calme et coopérante : elle décrit bien ce qu’elle observe, avec des mots simples, et se rassure quand on lui explique les choses.",
  brief: [
    "Vous êtes médecin assistant·e aux urgences pédiatriques.",
    "Mme Monnier, 32 ans, se présente aux urgences avec son fils Noé, 4 mois, qui tousse, respire vite et boit mal depuis hier.",
    "Le nourrisson ne parle pas : sa mère répond. Menez l’anamnèse, décrivez le status et les examens utiles, puis donnez votre hypothèse et la suite.",
  ],
  opening: "Bonjour docteur. Mon bébé tousse depuis hier et cette nuit il s’est mis à respirer très vite. Il n’arrive plus à finir ses biberons.",
  history: {
    identity: "Il s’appelle Noé Monnier, il a quatre mois. Je suis sa maman, Claire.",
    occupation: "Il est à la maison avec moi, je suis encore en congé maternité.",
    living: "Il vit avec son papa, moi et sa grande sœur de trois ans, dans un appartement.",
    feeling: "Il est fatigué et grognon, il ne sourit plus comme d’habitude. Moi, je suis inquiète.",
    previousEpisodes: "Non, c’est la première fois qu’il est malade comme ça.",
    course: "Le nez a commencé à couler il y a trois jours, la toux est venue hier, et depuis cette nuit il respire vite et ça empire un peu.",
    otherSymptoms: "Il boit beaucoup moins bien ses biberons.",
    medications: "Rien de régulier, à part ses gouttes de vitamine D. Je lui mets du sérum physiologique dans le nez et je lui ai donné un suppositoire de paracétamol cette nuit.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Né à terme, à 39 semaines, 3,35 kg, sans problème à la naissance. Il n’a jamais été malade ni hospitalisé.",
    familyHistory: "Pas d’asthme ni d’allergie dans la famille. Pas de maladie du cœur connue.",
    tobacco: "Son papa fume, mais toujours sur le balcon. Moi, je ne fume pas.",
    alcohol: "Non.",
    drugs: "Non.",
    concerns: "J’ai peur qu’il s’étouffe la nuit. Est-ce qu’il faut le garder à l’hôpital ?",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Le nez a commencé à couler il y a trois jours. La toux, c’est depuis hier, et la respiration rapide depuis cette nuit." },
    { topic: "rhume", keywords: RHINITIS, reply: "Il a le nez qui coule, c’est clair, et il est très bouché : il ronfle et ça le gêne pour boire." },
    { topic: "toux", keywords: COUGH, reply: "Il tousse beaucoup, une toux grasse, surtout la nuit. Il ne devient pas rouge ni violet pendant la toux, et il ne fait pas de bruit bizarre en reprenant son souffle." },
    { topic: "respiration", keywords: BREATHING, reply: "Depuis cette nuit il respire très vite, on voit son ventre et le creux entre ses côtes qui se creusent. Il y a un petit sifflement quand il souffle." },
    { topic: "fièvre", keywords: FEVER, reply: "Il avait 38,3 °C cette nuit. Avec le paracétamol, c’est redescendu." },
    { topic: "alimentation", keywords: FEEDING, reply: "D’habitude il prend 150 mL toutes les trois à quatre heures. Depuis hier il s’arrête au bout de 60 ou 80 mL, il doit faire des pauses pour respirer." },
    { topic: "couches", keywords: DIURESIS, reply: "Ses couches sont moins lourdes : quatre couches mouillées depuis hier matin, d’habitude c’est six ou sept." },
    { topic: "vomissements et selles", keywords: ["vomi", "recrach", "regurgit", "rejette", "selles", "diarrh"], reply: "Il recrache un peu de lait après les quintes de toux, mais il ne vomit pas tout. Les selles sont normales." },
    { topic: "pauses respiratoires", keywords: APNEA, reply: "Non, il n’a pas fait de pauses dans sa respiration, il n’est jamais devenu bleu ni gris." },
    { topic: "comportement", keywords: BEHAVIOR, reply: "Il est plus fatigué et il dort plus que d’habitude, mais quand il est réveillé il me regarde et il pleure fort quand je lui mets le sérum dans le nez." },
    { topic: "naissance", keywords: BIRTH, reply: "Il est né à terme, à 39 semaines, 3,35 kg. La grossesse et l’accouchement se sont bien passés." },
    { topic: "vaccins", keywords: ["vaccin", "carnet"], reply: "Il a eu ses vaccins de 2 et de 4 mois, j’ai le carnet avec moi." },
    { topic: "cœur", keywords: ["malformation", "probleme au coeur", "probleme cardiaque", "maladie du coeur", "souffle au coeur", "son coeur"], reply: "Non, le pédiatre n’a jamais rien entendu de particulier au cœur." },
    { topic: "contage", keywords: CONTACTS, reply: "Sa grande sœur va à la crèche, elle est enrhumée depuis la semaine passée." },
    { topic: "croissance", keywords: ["croissance", "courbe", "poids", "grossit", "prend du poids", "pese"], reply: "Il grossit bien, le pédiatre était content de sa courbe à la visite de 4 mois." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 38,1 °C, FC 158/min, FR 58/min, SpO₂ 93 % à l’air ambiant. Poids 6,4 kg." },
    { topic: "état général", examiner: true, keywords: ["etat general", "tonus", "coloration", "teint", "inspection"], reply: "Nourrisson éveillé, réactif, suit du regard, cri vigoureux, bon tonus. Coloration rosée, pas de cyanose ni de marbrures." },
    { topic: "hydratation", examiner: true, keywords: ["hydrat", "muqueuse", "fontanelle", "pli cutane", "recoloration", "trc$"], reply: "Muqueuses un peu sèches, fontanelle antérieure normotendue, pas de pli cutané, temps de recoloration 2 secondes." },
    { topic: "signes de lutte", examiner: true, keywords: ["lutte", "battement des ailes", "geignement", "balancement", "intercostal", "sous costal"], reply: "Tirage intercostal et sous-costal modéré, battement discret des ailes du nez, pas de geignement ni de balancement thoraco-abdominal. Thorax un peu distendu." },
    { topic: "auscultation pulmonaire", examiner: true, keywords: ["poumon", "auscultation pulmonaire", "ausculte les poumons", "crepitant", "sibilant", "murmure"], reply: "Crépitants fins diffus des deux côtés et sibilants expiratoires, expiration un peu prolongée. Auscultation symétrique, pas de souffle tubaire." },
    { topic: "cœur et foie", examiner: true, keywords: ["auscultation cardiaque", "ausculte le coeur", "bruits du coeur", "foie", "femora"], reply: "Bruits du cœur réguliers, rapides, sans souffle. Foie palpé à 1 cm sous le rebord costal, abaissé par la distension du thorax. Pouls fémoraux bien perçus." },
    { topic: "examen ORL", examiner: true, keywords: ["orl$", "otoscop", "tympan", "gorge", "narine"], reply: "Rhinorrhée claire abondante, narines encombrées. Tympans normaux, gorge calme." },
    { topic: "glycémie", examiner: true, keywords: ["glycemie", "dextro", "sucre", "glucose"], reply: "Glycémie capillaire 4,9 mmol/L." },
    planReaction("Donc on lui lave bien le nez et on le surveille ? Et s’il ne boit toujours pas assez, il faudra le garder ici ?", ["lavage", "laver le nez", "moucher", "serum", "fractionn", "petites quantites", "surveill", "hospitalis", "rentrer", "a la maison", "oxygene"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales et saturation", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes"] },
    { id: "etat-general", label: "État général, tonus et coloration", category: "constantes", pertinent: true, topic: "état général", covers: ["etat-general"] },
    { id: "hydratation", label: "Hydratation, fontanelle et temps de recoloration", category: "constantes", pertinent: true, topic: "hydratation", covers: ["hydratation"] },
    { id: "signes-lutte", label: "Signes de lutte respiratoire", category: "examen", pertinent: true, topic: "signes de lutte", covers: ["signes-lutte"] },
    { id: "auscultation-pulmonaire", label: "Auscultation pulmonaire", category: "examen", pertinent: true, topic: "auscultation pulmonaire", covers: ["auscultation-pulmonaire"] },
    { id: "coeur-foie", label: "Auscultation cardiaque, palpation hépatique et pouls fémoraux", category: "examen", pertinent: true, topic: "cœur et foie", covers: ["auscultation-cardiaque", "foie-rate", "pouls-peripheriques"], key: ["auscultation-cardiaque"] },
    { id: "examen-orl", label: "Examen ORL", category: "examen", pertinent: true, topic: "examen ORL", covers: ["examen-orl"] },
    { id: "glycemie", label: "Glycémie capillaire", category: "complementaire", pertinent: true, topic: "glycémie", covers: ["glycemie"] },
    { id: "radio-thorax", label: "Radiographie du thorax", category: "complementaire", pertinent: false, covers: ["radio-thorax"], result: "Non indiquée dans une forme typique : elle montrerait une distension et des infiltrats peu spécifiques, et pousse à tort vers les antibiotiques." },
    { id: "fsc-crp", label: "Formule sanguine et CRP", category: "complementaire", pertinent: false, covers: ["fsc", "crp"], result: "Non indiquées : infection virale typique, nourrisson réactif ; elles ne changent pas la prise en charge." },
    { id: "gazometrie", label: "Gazométrie capillaire", category: "complementaire", pertinent: false, covers: ["gazometrie"], result: "Non indiquée ici : pas de signe d’épuisement ni d’apnée ; à discuter seulement en cas d’aggravation." },
    { id: "ponction-lombaire", label: "Ponction lombaire", category: "complementaire", pertinent: false, covers: ["ponction-lombaire"], result: "Non indiquée : nourrisson de plus de 3 mois, réactif, avec un foyer respiratoire évident et sans signe méningé." },
  ],
  catalogResults: {
    "poids": "Poids 6,4 kg, sur sa courbe habituelle.",
    "glasgow": "Nourrisson éveillé, réactif, suit du regard, cri vigoureux.",
    "percussion-thoracique": "Sonorité normale à légèrement augmentée, symétrique.",
    "palpation-abdominale": "Abdomen souple, foie palpé à 1 cm sous le rebord costal, abaissé par la distension du thorax.",
    "examen-neurologique": "Nourrisson tonique, motricité symétrique, réflexes archaïques adaptés à l’âge.",
    "signes-meninges": "Pas de raideur de nuque, fontanelle antérieure normotendue.",
    "ecg": "Tachycardie sinusale à 158/min, axe et conduction normaux pour l’âge, pas de trouble de la repolarisation.",
  },
  acceptable: ["poids", "percussion-thoracique", "palpation-abdominale"],
  diagnosisChoice: { correct: "Bronchiolite aiguë virale", distractors: ["Pneumonie bactérienne", "Coqueluche", "Insuffisance cardiaque sur cardiopathie congénitale"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Caractérise les symptômes respiratoires",
      hint: "Rhume au début, toux, gêne respiratoire (respiration rapide, creusement, sifflement), fièvre",
      points: 4,
      groups: [RHINITIS, COUGH, BREATHING, FEVER],
    },
    {
      id: "severity",
      label: "Recherche les signes de gravité",
      hint: "Quantités bues par rapport à d’habitude, couches mouillées, pauses respiratoires ou changement de couleur, comportement",
      points: 4,
      groups: [FEEDING, DIURESIS, APNEA, BEHAVIOR],
    },
    {
      id: "terrain",
      label: "Évalue le terrain",
      hint: "Prématurité et naissance, antécédents (cœur, hospitalisations) et vaccins, tabagisme passif",
      points: 3,
      groups: [BIRTH, TERRAIN, SMOKE],
    },
    {
      id: "context",
      label: "Recherche un contage",
      hint: "Fratrie, crèche, entourage enrhumé",
      points: 1,
      groups: [CONTACTS],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes avec saturation, état général et hydratation, signes de lutte, auscultation pulmonaire et cardiaque, examen ORL, glycémie",
      points: 5,
      groups: [["j ausculte", "je l ausculte", "j examine", "je l examine"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Bronchiolite aiguë virale de sévérité modérée chez un nourrisson de 4 mois",
    summary: "Nourrisson de 4 mois, né à terme, sans antécédent, qui présente en saison hivernale une rhinite puis une toux, une polypnée avec tirage, des crépitants et des sibilants diffus, une alimentation réduite à environ la moitié et une saturation à 93 %, dans un contexte de contage familial. C’est une bronchiolite virale typique : le diagnostic est clinique, sans examen complémentaire de routine. L’enjeu est d’évaluer la gravité (alimentation, hydratation, saturation, apnées, signes de lutte) pour décider entre surveillance hospitalière et retour à domicile.",
    keyFindings: [
      "Rhinite pendant deux à trois jours, puis toux et gêne respiratoire chez un nourrisson de moins de 12 mois.",
      "Polypnée à 58/min, tirage intercostal et sous-costal, crépitants fins et sibilants diffus.",
      "Alimentation réduite à environ 50 % des quantités habituelles, couches moins mouillées, SpO₂ 93 %.",
      "Pas d’apnée ni de cyanose, nourrisson réactif ; contage dans la fratrie.",
    ],
    redFlags: [
      "Apnées, cyanose, geignement ou épuisement respiratoire : surveillance hospitalière, avis des soins intensifs si besoin.",
      "SpO₂ persistante sous 90–92 % ou alimentation inférieure à 50 % des besoins : hospitalisation (oxygène, alimentation par sonde ou perfusion).",
      "Âge inférieur à 6–8 semaines, prématurité, cardiopathie ou maladie pulmonaire chronique : risque de forme grave.",
      "Signes de déshydratation ou nourrisson somnolent, peu réactif.",
    ],
    management: [
      "Désobstruction nasale au sérum physiologique, surtout avant les repas ; fractionner les biberons (plus petites quantités, plus souvent).",
      "Pas de bronchodilatateur, de corticoïde ni d’antibiotique en routine ; pas de radiographie ni de prise de sang dans une forme typique.",
      "Ici, forme modérée : réévaluer après lavage de nez et un biberon fractionné ; hospitaliser si la saturation reste basse ou si l’enfant boit moins de la moitié.",
      "En cas de retour à domicile : consignes écrites de surveillance (respiration, pauses, couleur, couches, quantités bues) et contrôle médical le lendemain ; éviter la fumée de tabac.",
    ],
    differentials: [
      "Pneumonie bactérienne (fièvre élevée, état général altéré, foyer unilatéral).",
      "Coqueluche (quintes de toux avec cyanose ou reprise inspiratoire bruyante, apnées, souvent sans fièvre).",
      "Premier épisode d’asthme du nourrisson ou sifflements récurrents (épisodes répétés, terrain atopique).",
      "Insuffisance cardiaque sur cardiopathie congénitale ou myocardite (souffle, hépatomégalie importante, pouls fémoraux faibles).",
      "Reflux avec fausses routes (toux liée aux repas, sans contexte infectieux).",
    ],
    sources: [
      { label: "NICE NG9 — Bronchiolitis in children: diagnosis and management", url: "https://www.nice.org.uk/guidance/ng9" },
      { label: "AAP 2014 — Clinical practice guideline: the diagnosis, management, and prevention of bronchiolitis", url: "https://doi.org/10.1542/peds.2014-2742" },
    ],
    pathologySlugs: ["bronchiolite"],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const bronchioliteDiagnoses: StationDiagnoses = {
  accepted: ["bronchiolite"],
  differentials: [
    d("Pneumonie", "pneumonie-communautaire"),
    d("Premier épisode d’asthme du nourrisson", "exacerbation-asthme"),
    d("Cardiopathie ou myocardite décompensée", "insuffisance-cardiaque-decompensee", "myocardite"),
    d("Reflux avec fausses routes", "reflux-gastro-oesophagien"),
  ],
};
