import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { communicationCriterion, NAUSEA, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "../shared.ts";

const KIND = ["decri", "sensation", "ressemble", "comme quoi", "ca fait comment", "a quoi", "tourne", "rotat", "tangage", "bateau", "ivre", "instab", "desequilibre", "tete qui tourne", "flotte", "type de vertige", "quel genre", "quel type"];
const TRIGGER = ["position", "allong", "couch", "dans le lit", "se retourn", "vous retourn", "tourner la tete", "tournez la tete", "lever la tete", "levez la tete", "regarder en haut", "pencher", "penchez", "se lever", "vous levez", "declench", "provoque", "au repos", "spontan", "quand ca arrive", "dans quelles circonstances", "quelles situations"];
const DURATION = ["combien de temps", "duree", "dure$", "secondes", "minutes", "longtemps", "permanent", "en continu", "entre les crises", "entre les episodes", "combien de fois", "frequen", "par jour"];
const HEARING = ["entend", "audition", "oreille", "sourd", "acouph", "siffl", "bourdonn", "oreille bouchee", "plein"];
const HEAD = ["mal de tete", "mal a la tete", "maux de tete", "cephal", "nuque", "cou$"];
const BRAINSTEM = ["double", "voir", "vision", "vue$", "parler", "articul", "avaler", "deglut", "bouche", "visage"];
const LIMBS = ["faiblesse", "paralys", "engourd", "fourmill", "maladroit", "tomb", "chute", "perte de connaissance", "evanoui", "malaise"];
const VASCULAR = ["tension", "hypertension", "diabet", "cholesterol", "coeur", "cardiaque", "avc", "attaque", "infarctus", "famil", "pere", "mere", "antecedent"];
const INFECTION = ["rhume", "grippe", "infection", "virus", "viral", "malade recemment", "fievre", "angine", "otite"];
const HABITS = ["tabac", "fume", "cigarette", "alcool", "boisson", "vin$", "biere", "drogue", "cannabis"];

export const vertigePositionnel: EcosScenario = {
  slug: "vertige-positionnel",
  version: 1,
  setting: "cabinet",
  patient: { name: "M. Cuendet", age: 54, sex: "M" },
  persona: "Homme posé et coopératif, un peu inquiet parce que son père a fait une attaque. Il décrit précisément ce qu’il ressent quand on lui pose des questions simples, sans vocabulaire médical.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "M. Cuendet, 54 ans, consulte au cabinet pour des vertiges depuis quelques jours.",
    "Menez l’anamnèse, réalisez le status utile, puis proposez une hypothèse diagnostique et la suite de la prise en charge.",
  ],
  opening: "Bonjour docteur. Depuis quelques jours, j’ai des vertiges : tout se met à tourner d’un coup, surtout le matin dans mon lit.",
  history: {
    identity: "Pierre-Alain Cuendet, 54 ans.",
    occupation: "Je suis magasinier dans une entreprise de matériaux, à Yverdon.",
    living: "Je vis avec ma femme dans une maison ; nos deux enfants sont grands.",
    feeling: "Là, assis, je me sens bien. Mais j’ai peur que ça recommence dès que je bouge la tête.",
    previousEpisodes: "Non, c’est la première fois que j’ai des vertiges comme ça.",
    course: "C’est pareil depuis quatre jours : plusieurs crises par jour, très courtes, et entre deux je me sens à peu près normal, juste un peu prudent.",
    otherSymptoms: "Pendant les crises, j’ai un peu mal au cœur.",
    medications: "De l’amlodipine 5 mg le matin pour la tension, depuis trois ans. Rien d’autre.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Une tension un peu haute, bien contrôlée d’après mon médecin. Une opération du ménisque il y a dix ans. Pas de diabète.",
    familyHistory: "Mon père a fait une attaque cérébrale à 72 ans. Ma mère va bien.",
    tobacco: "J’ai fumé un paquet par jour pendant vingt ans ; j’ai arrêté il y a huit ans.",
    alcohol: "Un ou deux verres de vin le week-end.",
    drugs: "Non, jamais.",
    concerns: "Mon père a commencé son attaque avec des vertiges. J’ai peur que ce soit la même chose.",
  },
  rules: [
    { topic: "description", keywords: KIND, reply: "Tout tourne autour de moi, comme un manège, très fort pendant quelques secondes. Ensuite ça se calme." },
    { topic: "déclenchement", keywords: TRIGGER, reply: "Ça arrive quand je me couche, quand je me retourne dans le lit vers la droite, quand je me lève le matin, ou quand je lève la tête pour attraper un carton en hauteur. Assis sans bouger, je n’ai rien." },
    { topic: "durée", keywords: DURATION, reply: "Chaque crise dure moins d’une minute, je dirais une vingtaine de secondes. J’en ai cinq ou six par jour. Entre les crises, je ne tourne pas." },
    { topic: "début", keywords: ONSET, reply: "C’est arrivé la première fois il y a quatre jours, le matin, en me retournant dans mon lit. D’un coup, tout s’est mis à tourner." },
    { topic: "nausées", keywords: NAUSEA, reply: "J’ai un peu mal au cœur pendant les crises, mais je n’ai pas vomi." },
    { topic: "audition", keywords: HEARING, reply: "Non, j’entends comme d’habitude, pas de sifflement, pas d’oreille bouchée ni de douleur d’oreille." },
    { topic: "maux de tête", keywords: HEAD, reply: "Non, pas de mal de tête, et pas de douleur dans la nuque." },
    { topic: "signes du tronc cérébral", keywords: BRAINSTEM, reply: "Non, je vois bien, pas de vision double. Je parle et j’avale normalement, rien au visage." },
    { topic: "membres et chutes", keywords: LIMBS, reply: "Non, pas de faiblesse, pas de fourmillements, et je ne suis jamais tombé. Je ne suis pas tombé dans les pommes non plus." },
    { topic: "marche", keywords: ["marche", "marchez", "equilibre", "tenir debout", "tituber"], reply: "Je marche normalement. Je fais juste attention en me relevant, au cas où ça tourne." },
    { topic: "infection récente", keywords: INFECTION, reply: "J’ai eu un petit rhume il y a deux semaines, rien de méchant, sans fièvre. C’est passé." },
    { topic: "traumatisme", keywords: ["trauma", "choc", "cogne", "coup sur la tete", "accident"], reply: "Non, je ne me suis pas cogné la tête." },
    { topic: "facteurs de risque", keywords: ["tension", "hypertension", "diabet", "cholesterol", "coeur", "cardiaque", "infarctus"], reply: "J’ai de la tension, traitée par l’amlodipine. Pas de diabète. Le cholestérol était un peu haut l’an passé, mais pas de traitement. Jamais de problème de cœur." },
    { topic: "palpitations", keywords: ["palpit", "coeur qui bat", "coeur qui s emballe", "douleur dans la poitrine", "poitrine"], reply: "Non, pas de palpitations ni de douleur dans la poitrine." },
    { topic: "retentissement", keywords: ["travail", "conduire", "voiture", "quotidien", "impact", "echelle", "chariot"], reply: "Au travail, j’évite de monter sur l’échelle et je ne conduis plus le chariot élévateur depuis lundi." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 138/84 mmHg couché, 136/86 mmHg debout après 3 minutes, sans chute tensionnelle. FC 72/min, régulière. FR 14/min, SpO₂ 98 %, T 36,6 °C." },
    { topic: "examen neurologique", examiner: true, keywords: ["examen neuro", "neurolog", "nerfs craniens", "reflexe", "force", "sensibilite", "nystagmus", "oculomotric", "head impulse", "hints", "skew"], reply: "Patient assis, sans vertige au repos. Pas de nystagmus spontané ni dans le regard latéral. Poursuite oculaire normale, pas de diplopie, pas de déviation verticale à l’occlusion alternée. Head impulse test normal des deux côtés. Autres nerfs crâniens, force, sensibilité et réflexes sans particularité." },
    { topic: "coordination", examiner: true, keywords: ["coordination", "romberg", "doigt nez", "talon genou", "dysmetrie", "unterberger", "fukuda"], reply: "Épreuves doigt-nez et talon-genou normales et symétriques, pas d’adiadococinésie. Romberg négatif. Marche normale, y compris en tandem." },
    { topic: "otoscopie et Dix-Hallpike", examiner: true, keywords: ["dix hallpike", "hallpike", "manoeuvre", "otoscop", "tympan", "test du chuchotement"], reply: "Tympans normaux des deux côtés, audition normale au chuchotement. Manœuvre de Dix-Hallpike à droite : après une latence de 3 à 4 secondes, nystagmus torsionnel battant vers le haut et vers l’oreille droite, en crescendo-decrescendo, d’environ 20 secondes, qui reproduit le vertige et s’inverse au redressement. À gauche : pas de nystagmus, pas de vertige." },
    { topic: "glycémie", examiner: true, keywords: ["glycemie", "sucre", "dextro", "glucose"], reply: "Glycémie capillaire 5,8 mmol/L." },
    planReaction("Ah, ce n’est donc pas une attaque ? Et ça peut revenir ? Je peux reprendre le travail ?", ["epley", "manoeuvre", "cristaux", "oreille interne", "repositionnement", "exercices"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales avec mesure orthostatique", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "neuro", label: "Examen neurologique avec oculomotricité et head impulse test", category: "examen", pertinent: true, topic: "examen neurologique", covers: ["examen-neurologique", "pupilles", "nihss"], key: ["examen-neurologique"] },
    { id: "coordination", label: "Coordination, Romberg et marche", category: "examen", pertinent: true, topic: "coordination", covers: ["coordination"] },
    { id: "dix-hallpike", label: "Otoscopie et manœuvre de Dix-Hallpike", category: "examen", pertinent: true, topic: "otoscopie et Dix-Hallpike", covers: ["vestibulaire", "examen-orl"], key: ["vestibulaire"] },
    { id: "glycemie", label: "Glycémie capillaire", category: "complementaire", pertinent: true, topic: "glycémie" },
    { id: "ct-cerebral", label: "CT cérébral natif", category: "complementaire", pertinent: false, result: "Non indiqué : vertige positionnel bref avec Dix-Hallpike typique et examen neurologique normal. Le CT est d’ailleurs peu sensible pour un AVC de la fosse postérieure." },
    { id: "irm-cerebrale", label: "IRM cérébrale", category: "complementaire", pertinent: false, result: "Non indiquée d’emblée : à réserver aux signes centraux, à un nystagmus atypique ou à l’échec des manœuvres de repositionnement." },
    { id: "radio-colonne-cervicale", label: "Radiographie de la colonne cervicale", category: "complementaire", pertinent: false, result: "Non indiquée : pas de traumatisme ni de douleur cervicale ; elle n’explique pas un vertige positionnel." },
    { id: "eeg", label: "Électroencéphalogramme", category: "complementaire", pertinent: false, result: "Non indiqué : aucun argument pour une épilepsie." },
  ],
  acceptable: ["ecg", "auscultation-cardiaque", "auscultation-carotides", "ta-deux-bras", "fsc"],
  diagnosisChoice: { correct: "Vertige paroxystique positionnel bénin du canal postérieur droit", distractors: ["Névrite vestibulaire", "AVC ischémique du cervelet", "Maladie de Ménière"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "vertigo",
      label: "Caractérise le vertige",
      hint: "Début, type (rotatoire), circonstances de déclenchement (changements de position), durée et fréquence des crises",
      points: 4,
      groups: [ONSET, KIND, TRIGGER, DURATION],
    },
    {
      id: "associated",
      label: "Recherche les signes associés",
      hint: "Audition, acouphènes et plénitude d’oreille ; nausées ou vomissements",
      points: 2,
      groups: [HEARING, NAUSEA],
    },
    {
      id: "central",
      label: "Recherche les signes d’alarme d’une cause centrale",
      hint: "Céphalée ou douleur cervicale, diplopie, dysarthrie, dysphagie, déficit ou troubles sensitifs, chute ou malaise",
      points: 3,
      groups: [HEAD, BRAINSTEM, LIMBS],
    },
    {
      id: "terrain",
      label: "Évalue le terrain",
      hint: "Facteurs de risque cardiovasculaire et antécédents familiaux, infection virale récente, tabac et alcool",
      points: 3,
      groups: [VASCULAR, INFECTION, HABITS],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes avec mesure orthostatique, examen neurologique avec recherche d’un nystagmus et head impulse test, coordination et marche, otoscopie et manœuvre de Dix-Hallpike, glycémie",
      points: 5,
      groups: [["nystagmus"], ["tympan"], ["doigt nez", "talon genou"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Vertige paroxystique positionnel bénin (VPPB) du canal semi-circulaire postérieur droit",
    summary: "Homme de 54 ans, hypertendu traité et ancien fumeur, qui présente depuis quatre jours des crises de vertige rotatoire de moins d’une minute, déclenchées par le coucher, le retournement dans le lit vers la droite et l’extension de la tête, sans signe auditif ni neurologique. Le status neurologique est normal (pas de nystagmus spontané, head impulse test normal, coordination et marche normales) et la manœuvre de Dix-Hallpike droite reproduit le vertige avec un nystagmus torsionnel et vers le haut, après latence et épuisable : VPPB du canal postérieur droit. Les facteurs de risque vasculaire imposent de bien rechercher des signes centraux, absents ici.",
    keyFindings: [
      "Vertige rotatoire bref (< 1 min), en crises répétées, déclenché par les changements de position de la tête.",
      "Pas de vertige continu, pas de signe auditif, pas de céphalée ni de signe neurologique.",
      "Dix-Hallpike droit positif : latence, nystagmus torsionnel géotrope battant vers le haut, durée < 1 min, épuisable ; côté gauche négatif.",
      "Examen neurologique, oculomotricité, head impulse test, coordination et marche normaux ; pas d’hypotension orthostatique.",
    ],
    redFlags: [
      "Vertige continu depuis plusieurs heures avec nystagmus spontané : syndrome vestibulaire aigu, faire un examen HINTS (un head impulse test normal dans ce contexte est inquiétant).",
      "Céphalée ou douleur cervicale brutale, diplopie, dysarthrie, dysphagie, déficit, ataxie ou impossibilité de marcher : AVC de la fosse postérieure, urgences.",
      "Nystagmus purement vertical ou changeant de direction, sans latence ni épuisement : cause centrale.",
      "Surdité brusque, acouphène unilatéral : avis ORL rapide.",
    ],
    management: [
      "Expliquer le mécanisme (débris dans l’oreille interne) et rassurer : affection bénigne, sans lien avec un AVC.",
      "Manœuvre de repositionnement d’Epley au cabinet pour le canal postérieur droit, à répéter si besoin ; exercices de Brandt-Daroff possibles à domicile.",
      "Pas de traitement médicamenteux au long cours (antivertigineux inutiles, sauf brièvement pour les nausées). Prudence au travail en hauteur et pour la conduite tant que les crises persistent.",
      "Contrôle dans 1 à 4 semaines ; consulter en urgence si vertige continu, signe neurologique ou céphalée. IRM et avis ORL ou neurologique si échec des manœuvres ou forme atypique.",
    ],
    differentials: [
      "Névrite vestibulaire (vertige continu sur plusieurs jours, nystagmus spontané horizontal, head impulse test pathologique, souvent après une virose).",
      "AVC ou AIT de la fosse postérieure (facteurs de risque vasculaire, signes neurologiques, ataxie, nystagmus central, head impulse test normal en cas de vertige continu).",
      "Maladie de Ménière (crises de 20 min à quelques heures avec baisse d’audition fluctuante, acouphène et plénitude d’oreille).",
      "Hypotension orthostatique, notamment sous antihypertenseur (sensation de tête vide au lever, pas de vertige rotatoire en position couchée).",
    ],
    sources: [
      { label: "AAO-HNS (2017) — Clinical Practice Guideline: Benign Paroxysmal Positional Vertigo (Update)", url: "https://journals.sagepub.com/doi/10.1177/0194599816689667" },
      { label: "NICE CKS — Benign paroxysmal positional vertigo", url: "https://cks.nice.org.uk/topics/benign-paroxysmal-positional-vertigo/" },
    ],
    pathologySlugs: ["avc-ait"],
  },
};

export const vertigePositionnelDiagnoses: StationDiagnoses = {
  accepted: ["vppb"],
  differentials: [
    { label: "Névrite vestibulaire", ids: ["nevrite-vestibulaire"] },
    { label: "AVC ou AIT de la fosse postérieure", ids: ["avc-ischemique", "ait", "hemorragie-intracerebrale"] },
    { label: "Processus expansif de la fosse postérieure", ids: ["tumeur-cerebrale"] },
    { label: "Hypotension orthostatique", ids: ["hypotension-orthostatique"] },
  ],
};
