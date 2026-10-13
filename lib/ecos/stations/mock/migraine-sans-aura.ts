import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { CHARACTER, communicationCriterion, FEVER, INTENSITY, LOCATION, NAUSEA, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "../shared.ts";

const COURSE = [...ONSET, "frequen", "combien de fois", "par mois", "par semaine", "duree", "dure$", "combien d heures", "longtemps"];
const SIDE = [...LOCATION, "quel cote", "un cote", "un seul cote", "les deux cotes", "unilat", "tempe", "front"];
const PAIN_TYPE = [...CHARACTER, "tape", "ca bat", "battement", "etau", "en casque"];
const SENSORY = ["lumiere", "bruit", "photo", "phono", "le noir", "obscurit", "volets"];
const AURA = ["aura", "troubles visuels", "trouble visuel", "voir$", "vision", "vue$", "zigzag", "eclair", "flash", "tache", "flou", "fourmill", "avant la douleur", "avant le mal", "annonce", "previen", "signe avant"];
const MENINGEAL = [...FEVER, "nuque", "raide"];
const DEFICIT = ["faiblesse", "paralys", "engourd", "parler", "langage", "confus", "double", "equilibre", "convuls", "perte de connaissance", "deficit", "bouche"];
const PATTERN = ["brutal", "coup de tonnerre", "d un coup", "en quelques secondes", "pire", "jamais eu", "different", "inhabituel", "change", "nuit", "reveil", "toux", "tousse", "effort"];
const FAMILY = ["famil", "parent", "mere", "maman", "pere", "papa", "soeur", "frere", "hereditaire"];
const HORMONAL = ["regles", "cycle", "pilule", "contracep", "enceinte", "grossesse", "hormon"];
const HABITS = ["tabac", "fume", "cigarette", "alcool", "boisson", "cafe", "sommeil", "dormez", "stress", "drogue", "cannabis"];

export const migraineSansAura: EcosScenario = {
  slug: "migraine-sans-aura",
  version: 1,
  setting: "cabinet",
  patient: { name: "Mme Vuilleumier", age: 27, sex: "F" },
  painful: true,
  persona: "Jeune femme calme et coopérative, un peu lasse de ses crises qui reviennent plus souvent depuis qu’elle a changé de poste. Elle décrit volontiers ses maux de tête et répond simplement à chaque question.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "Mme Vuilleumier, 27 ans, consulte au cabinet pour des maux de tête qui reviennent de plus en plus souvent.",
    "Menez l’anamnèse, réalisez le status utile, puis proposez une hypothèse diagnostique et la suite de la prise en charge.",
  ],
  opening: "Bonjour docteur. Je viens parce que j’ai des maux de tête qui reviennent de plus en plus souvent, et ça commence à me gâcher la vie.",
  history: {
    identity: "Camille Vuilleumier, 27 ans.",
    occupation: "Je suis employée de banque à Lausanne ; j’ai changé de poste il y a quatre mois, c’est plus stressant.",
    living: "Je vis en appartement avec mon compagnon, pas d’enfant.",
    feeling: "Aujourd’hui ça va, je n’ai pas mal. Mais je redoute la prochaine crise.",
    previousEpisodes: "J’en ai depuis l’adolescence, à peu près une par mois. Depuis trois ou quatre mois, c’est plutôt trois à quatre fois par mois.",
    course: "Les crises se ressemblent toutes, c’est seulement qu’elles sont plus fréquentes. Entre les crises, je n’ai rien du tout.",
    otherSymptoms: "Pendant les crises, j’ai mal au cœur et je ne supporte pas la lumière.",
    medications: "La pilule depuis huit ans, et de l’ibuprofène 400 mg pendant les crises, à peu près six jours par mois.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Rien de particulier, je n’ai jamais été opérée ni hospitalisée.",
    familyHistory: "Ma mère a aussi des migraines depuis toujours. Pas d’autre maladie connue dans la famille.",
    tobacco: "Non, je n’ai jamais fumé.",
    alcohol: "Un verre de vin de temps en temps ; j’ai remarqué que le vin rouge peut déclencher une crise.",
    drugs: "Non.",
    concerns: "J’ai peur d’avoir quelque chose dans la tête, une tumeur, puisque ça augmente.",
  },
  rules: [
    { topic: "localisation", keywords: [...SIDE, "ou avez vous mal"], reply: "D’un seul côté, autour de la tempe et derrière l’œil. Parfois à droite, parfois à gauche, ça change d’une crise à l’autre." },
    { topic: "type de douleur", keywords: PAIN_TYPE, reply: "Ça tape, comme si mon cœur battait dans ma tête." },
    { topic: "intensité", keywords: INTENSITY, reply: "Sept ou huit sur dix. Pendant une crise, je dois m’allonger dans le noir, je ne peux plus travailler." },
    { topic: "durée et fréquence", keywords: ["combien de temps", "duree", "dure$", "combien d heures", "longtemps", "frequen", "combien de fois", "par mois", "par semaine"], reply: "Une crise dure entre une demi-journée et une journée entière si je ne prends rien. En ce moment, j’en ai trois ou quatre par mois." },
    { topic: "début", keywords: ONSET, reply: "J’ai des crises depuis mes 15 ans, mais elles sont plus fréquentes depuis trois ou quatre mois. Une crise monte progressivement, en une heure environ. La dernière, c’était il y a cinq jours." },
    { topic: "nausées", keywords: NAUSEA, reply: "J’ai mal au cœur pendant les crises, et j’ai vomi une ou deux fois quand c’était très fort." },
    { topic: "lumière et bruit", keywords: SENSORY, reply: "Oui, la lumière me fait mal aux yeux et le bruit m’est insupportable. Je ferme les volets." },
    { topic: "aura", keywords: AURA, reply: "Non, je ne vois rien de spécial avant, pas de lumières ni de zigzags, pas de fourmillements. Le mal de tête arrive directement." },
    { topic: "activité physique", keywords: ["effort", "escalier", "bouger", "mouvement", "activite", "sport", "marcher"], reply: "Quand je bouge ou que je monte les escaliers pendant une crise, ça tape encore plus fort." },
    { topic: "déclencheurs", keywords: ["declench", "stress", "sommeil", "dormi", "manque de sommeil", "repas", "sauter un repas", "vin$", "chocolat", "cafe"], reply: "Le stress, quand je dors mal, quand je saute un repas, et le vin rouge. Je bois deux cafés par jour." },
    { topic: "lien avec le cycle", keywords: HORMONAL, reply: "Je prends la pilule depuis huit ans, sans oubli. Les crises arrivent souvent juste avant ou pendant les règles. Mes dernières règles datent d’il y a deux semaines, je ne pense pas être enceinte." },
    { topic: "fièvre et nuque", keywords: MENINGEAL, reply: "Non, je n’ai jamais de fièvre avec ces maux de tête, et je bouge bien la nuque." },
    { topic: "signes neurologiques", keywords: DEFICIT, reply: "Non, jamais de faiblesse, de difficulté à parler, de vision double ni d’engourdissement." },
    { topic: "caractère inhabituel", keywords: ["brutal", "coup de tonnerre", "d un coup", "en quelques secondes", "pire", "jamais eu", "different", "inhabituel", "change"], reply: "Non, ça ne vient jamais d’un coup, et c’est toujours le même mal de tête que d’habitude, seulement plus souvent." },
    { topic: "nuit et toux", keywords: ["nuit", "reveil", "matin", "toux", "tousse", "pousser", "allong", "pencher", "position"], reply: "Ça ne me réveille pas la nuit, et ça n’augmente pas quand je tousse ou que je me penche. M’allonger me soulage plutôt." },
    { topic: "traumatisme", keywords: ["trauma", "choc", "cogne", "chute", "tombe", "accident"], reply: "Non, je ne me suis pas cognée la tête." },
    { topic: "antidouleurs", keywords: ["ibuprofen", "antidouleur", "anti douleur", "calme", "soulage", "efficace", "combien de comprimes", "combien de jours", "paracetamol", "dafalgan", "algifor", "triptan"], reply: "L’ibuprofène 400 mg aide un peu si je le prends tôt, mais souvent la crise continue. Je le prends environ six jours par mois, jamais plus. Je n’ai jamais essayé d’autre médicament." },
    { topic: "retentissement", keywords: ["absen", "quotidien", "impact", "retentis", "arret de travail", "gene au travail", "manque le travail"], reply: "J’ai dû rentrer du travail deux fois ce mois-ci. Ça m’inquiète pour mon nouveau poste." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 116/74 mmHg, FC 68/min, FR 14/min, SpO₂ 99 %, T 36,7 °C. Patiente en bon état général, sans douleur actuellement." },
    { topic: "examen neurologique", examiner: true, keywords: ["examen neuro", "neurolog", "reflexe", "nerfs craniens", "force", "sensibilite", "pupille"], reply: "Patiente orientée, langage normal. Nerfs crâniens sans particularité, pupilles égales et réactives, champ visuel normal au doigt. Force, sensibilité et réflexes ostéotendineux symétriques, réflexes cutanés plantaires en flexion. Pas de déficit." },
    { topic: "syndrome méningé", examiner: true, keywords: ["meninge", "kernig", "brudzinski", "raideur de nuque"], reply: "Nuque souple, signes de Kernig et de Brudzinski négatifs." },
    { topic: "fond d’œil", examiner: true, keywords: ["fond d oeil", "papille", "ophtalmoscop"], reply: "Fond d’œil : papilles bien délimitées des deux côtés, pas d’œdème papillaire." },
    { topic: "coordination", examiner: true, keywords: ["coordination", "romberg", "doigt nez", "talon genou", "marche"], reply: "Épreuves doigt-nez et talon-genou normales, Romberg négatif, marche normale, y compris sur les talons et les pointes." },
    { topic: "test de grossesse", examiner: true, keywords: ["test de grossesse", "beta hcg", "bhcg", "hcg"], reply: "β-hCG urinaire négatif." },
    planReaction("D’accord. Et il existe un médicament plus efficace pour les crises ? Je peux garder ma pilule ?", ["triptan", "ibuprofene", "naproxene", "agenda", "journal", "calendrier", "traitement de fond", "prevention"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "neuro", label: "Examen neurologique complet", category: "examen", pertinent: true, topic: "examen neurologique", covers: ["examen-neurologique", "pupilles"] },
    { id: "meninges", label: "Recherche d’un syndrome méningé", category: "examen", pertinent: true, topic: "syndrome méningé", covers: ["signes-meninges"] },
    { id: "fond-oeil", label: "Fond d’œil", category: "examen", pertinent: true, topic: "fond d’œil", covers: ["fond-oeil"] },
    { id: "coordination", label: "Coordination et marche", category: "examen", pertinent: true, topic: "coordination", covers: ["coordination"] },
    { id: "beta-hcg", label: "β-hCG urinaire", category: "complementaire", pertinent: true, topic: "test de grossesse", covers: ["beta-hcg"] },
    { id: "ct-cerebral", label: "CT cérébral natif", category: "complementaire", pertinent: false, result: "Non indiqué : céphalées anciennes, stéréotypées, avec status neurologique normal et sans signe d’alarme. L’imagerie ne rassurerait que transitoirement et exposerait aux rayons." },
    { id: "irm-cerebrale", label: "IRM cérébrale", category: "complementaire", pertinent: false, result: "Non indiquée : migraine typique sans signe d’alarme ni anomalie au status. À discuter seulement si le tableau change." },
    { id: "ponction-lombaire", label: "Ponction lombaire", category: "complementaire", pertinent: false, result: "Non indiquée : ni fièvre, ni syndrome méningé, ni céphalée brutale." },
    { id: "eeg", label: "Électroencéphalogramme", category: "complementaire", pertinent: false, result: "Non indiqué : aucun argument pour une épilepsie ; l’EEG n’a pas de place dans le bilan d’une migraine." },
  ],
  acceptable: ["examen-orl", "auscultation-carotides"],
  diagnosisChoice: { correct: "Migraine sans aura", distractors: ["Céphalée de tension", "Hémorragie sous-arachnoïdienne", "Céphalée par abus médicamenteux"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "headache",
      label: "Caractérise les maux de tête",
      hint: "Début, durée et fréquence des crises, localisation (unilatérale), type (pulsatile), intensité",
      points: 4,
      groups: [COURSE, SIDE, PAIN_TYPE, INTENSITY],
    },
    {
      id: "associated",
      label: "Recherche les signes associés",
      hint: "Nausées ou vomissements, photophobie et phonophobie, aura visuelle ou sensitive",
      points: 3,
      groups: [NAUSEA, SENSORY, AURA],
    },
    {
      id: "red-flags",
      label: "Recherche les signes d’alarme",
      hint: "Fièvre ou raideur de nuque, déficit neurologique, céphalée brutale, nouvelle ou nocturne, aggravée par la toux",
      points: 2,
      groups: [MENINGEAL, DEFICIT, PATTERN],
    },
    {
      id: "terrain",
      label: "Évalue le terrain",
      hint: "Antécédents familiaux de migraine, cycle et contraception, habitudes (tabac, alcool, café, sommeil, stress)",
      points: 3,
      groups: [FAMILY, HORMONAL, HABITS],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes, examen neurologique, recherche d’un syndrome méningé, fond d’œil, coordination ; test de grossesse avant de traiter",
      points: 5,
      groups: [["reflexe", "nerfs craniens"], ["kernig", "brudzinski"], ["papille", "ophtalmoscop"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Migraine sans aura épisodique, en recrudescence (facteurs : stress, sommeil, cycle menstruel)",
    summary: "Femme de 27 ans, migraineuse depuis l’adolescence, avec une mère migraineuse, dont les crises sont devenues plus fréquentes (3 à 4 par mois) depuis un changement de poste. Crises stéréotypées de 12 à 24 h, unilatérales à bascule, pulsatiles, intenses, aggravées par l’effort, avec nausées, photophobie et phonophobie, sans aura. Aucun signe d’alarme, status neurologique et fond d’œil normaux : aucune imagerie n’est nécessaire.",
    keyFindings: [
      "Crises récurrentes de 4 à 72 h, unilatérales, pulsatiles, modérées à sévères, aggravées par l’activité physique (critères ICHD-3).",
      "Nausées, vomissements, photophobie et phonophobie ; pas d’aura.",
      "Crises stéréotypées, déclenchées par le stress, le manque de sommeil, les règles et le vin rouge ; mère migraineuse.",
      "Constantes, status neurologique, recherche de syndrome méningé et fond d’œil normaux.",
    ],
    redFlags: [
      "Céphalée brutale « en coup de tonnerre » : hémorragie sous-arachnoïdienne jusqu’à preuve du contraire.",
      "Fièvre, raideur de nuque, confusion : méningite ou encéphalite.",
      "Déficit neurologique, œdème papillaire, céphalée nocturne ou aggravée par la toux, céphalée nouvelle après 50 ans : imagerie cérébrale.",
      "Changement du caractère habituel des crises, ou aura atypique (prolongée, motrice).",
    ],
    management: [
      "Rassurer et expliquer le diagnostic ; tenir un agenda des crises et de la prise d’antalgiques.",
      "Traitement de crise précoce : AINS (ibuprofène 400–600 mg ou naproxène 500 mg) avec métoclopramide si nausées ; triptan (p. ex. sumatriptan 50–100 mg) si insuffisant.",
      "Prévenir la céphalée par abus médicamenteux : AINS moins de 15 jours par mois, triptans moins de 10 jours par mois.",
      "Hygiène de vie (sommeil régulier, repas, gestion du stress, activité physique) ; traitement de fond (bêtabloquant, amitriptyline…) à discuter vu 3 à 4 crises invalidantes par mois. Pilule combinée possible en l’absence d’aura et de tabac ; contrôle dans 2 à 3 mois.",
    ],
    differentials: [
      "Céphalée de tension (bilatérale, en étau, non pulsatile, peu intense, sans nausée ni aggravation à l’effort).",
      "Céphalée par abus médicamenteux (prise d’antalgiques ≥ 15 jours par mois).",
      "Céphalées secondaires : hémorragie sous-arachnoïdienne, méningite, thrombose veineuse cérébrale (d’autant plus sous pilule), processus expansif.",
      "Migraine avec aura (troubles visuels ou sensitifs transitoires précédant la céphalée), qui contre-indiquerait la pilule combinée.",
    ],
    sources: [
      { label: "ICHD-3 — 1.1 Migraine without aura", url: "https://ichd-3.org/1-migraine/1-1-migraine-without-aura/" },
      { label: "NICE CG150 — Headaches in over 12s: diagnosis and management", url: "https://www.nice.org.uk/guidance/cg150" },
    ],
    pathologySlugs: ["cephalees-primaires-secondaires"],
  },
};

export const migraineSansAuraDiagnoses: StationDiagnoses = {
  accepted: ["migraine"],
  differentials: [
    { label: "Céphalée de tension", ids: ["cephalee-tension"] },
    { label: "Hémorragie sous-arachnoïdienne ou thrombose veineuse cérébrale", ids: ["hemorragie-sous-arachnoidienne", "thrombose-veineuse-cerebrale"] },
    { label: "Méningite", ids: ["meningite-virale", "meningite-bacterienne"] },
    { label: "Processus expansif intracrânien", ids: ["tumeur-cerebrale"] },
  ],
};
