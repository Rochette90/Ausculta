import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { communicationCriterion, FEVER, LOCATION, NAUSEA, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "../shared.ts";

const ITCH = ["demang", "gratt", "prurit", "ca pique", "picot"];
const COURSE = ["disparai", "bouge", "deplac", "change de place", "changent de place", "migr", "meme endroit", "restent", "reste combien", "fugace", "combien de temps dure", "chaque plaque", "aspect", "a quoi ressemble"];
const SWELLING = ["gonfl", "enfl", "levre", "langue", "paupiere", "visage", "oedem", "bouche"];
const AIRWAY = ["respir", "essouffl", "souffle", "siffl", "avaler", "deglut", "voix", "gorge serre", "serre la gorge", "etouff"];
const SYSTEMIC = ["malaise", "vertige", "tete qui tourne", "evanoui", "connaissance", "ventre", "diarrh", "palpit", "coeur qui bat", ...NAUSEA];
const INFECTION = ["infection", "rhume", "mal de gorge", "gorge$", "malade", "grippe", "toux", "tousse", "angine", ...FEVER];
const FOOD = ["mange", "manger", "aliment", "repas", "nourriture", "fruits de mer", "crevette", "noix", "cacahuete", "restaurant"];
const OTHER_TRIGGERS = ["piqure", "guepe", "abeille", "insecte", "effort", "sport", "froid", "nouveau produit", "creme", "savon", "lessive", "cosmetique", "animal", "chat$"];
const PREVIOUS = ["deja eu", "deja arrive", "premiere fois", "avant$", "deja fait"];
const TERRAIN = ["antecedent", "asthm", "atop", "rhume des foins", "pollen", "eczema", "maladie", "famil", "parents", "mere$", "pere$"];

export const urticaireAigue: EcosScenario = {
  slug: "urticaire-aigue",
  version: 1,
  setting: "cabinet",
  patient: { name: "Mme Pasche", age: 24, sex: "F" },
  persona: "Étudiante inquiète mais coopérative, qui se gratte pendant l’entretien. Elle répond simplement et n’a pas pensé d’elle-même aux médicaments pris pour son rhume.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "Mme Pasche, 24 ans, consulte au cabinet pour des plaques rouges qui grattent sur tout le corps depuis hier soir.",
    "Menez l’anamnèse et l’examen clinique (status) ciblés, demandez les examens utiles, puis proposez une hypothèse diagnostique et la suite.",
  ],
  opening: "Bonjour docteur. Depuis hier soir, j’ai des plaques rouges partout qui grattent énormément. Je n’ai presque pas dormi.",
  history: {
    identity: "Julie Pasche, 24 ans.",
    occupation: "Je suis étudiante en droit à Lausanne.",
    living: "J’habite en colocation avec deux amies.",
    feeling: "Ça gratte tellement que je n’arrive pas à me concentrer, mais sinon je me sens bien.",
    previousEpisodes: "Non, jamais. C’est la première fois.",
    course: "Les premières plaques sont apparues hier soir sur le ventre, puis il y en a eu sur les bras et les cuisses. Elles partent et reviennent ailleurs.",
    otherSymptoms: "J’ai encore un peu mal à la gorge, j’ai eu un rhume la semaine passée.",
    medications: "La pilule. Et de l’ibuprofène depuis quatre jours pour le mal de gorge, deux ou trois comprimés par jour.",
    allergies: "Pas d’allergie connue à un médicament. J’ai le rhume des foins au printemps.",
    personalHistory: "Le rhume des foins, et un peu d’eczéma quand j’étais petite. Rien d’autre.",
    familyHistory: "Ma mère est asthmatique. Mon père n’a rien de particulier.",
    tobacco: "Non, je ne fume pas.",
    alcohol: "Un ou deux verres en soirée, le week-end.",
    drugs: "Non.",
    concerns: "J’ai peur que ma gorge gonfle, comme on voit dans les films. Et est-ce que je suis devenue allergique à quelque chose ?",
  },
  rules: [
    { topic: "localisation", keywords: [...LOCATION, "ou sont", "quelles parties", "tout le corps", "ailleurs"], reply: "Sur le ventre, le dos, les bras et les cuisses. Un peu dans le cou. Pas sur le visage." },
    { topic: "démangeaisons", keywords: ITCH, reply: "Ça gratte énormément, surtout le soir et la nuit. Ça ne brûle pas, ça ne fait pas mal." },
    { topic: "évolution des plaques", keywords: COURSE, reply: "Ce sont des plaques rouges en relief, un peu gonflées, parfois plus pâles au milieu. Chaque plaque disparaît en quelques heures sans laisser de trace, et d’autres apparaissent ailleurs." },
    { topic: "gonflement", keywords: SWELLING, reply: "Non, mes lèvres, ma langue et mes paupières ne sont pas gonflées. Mon visage est normal, je l’ai regardé ce matin dans le miroir." },
    { topic: "respiration et déglutition", keywords: AIRWAY, reply: "Non, je respire normalement, je ne siffle pas. J’avale bien, ma voix est normale. Juste un peu mal à la gorge à cause du rhume." },
    { topic: "malaise et troubles digestifs", keywords: SYSTEMIC, reply: "Non, pas de malaise, pas de vertige. Pas mal au ventre, pas de nausée ni de vomissement, pas de diarrhée." },
    { topic: "infection récente", keywords: INFECTION, reply: "La semaine passée, j’ai eu un gros rhume avec mal de gorge et un peu de fièvre, 38 °C. Ça va mieux, il me reste un peu mal à la gorge. Plusieurs amies de la colocation l’ont eu aussi." },
    { topic: "nouveau médicament", keywords: ["nouveau medicament", "anti inflammatoire", "ibuprofen", "aspirine", "antibio", "pris quelque chose", "algifor", "brufen", "pastille"], reply: "Pour le mal de gorge, je prends de l’ibuprofène depuis quatre jours, deux ou trois comprimés par jour. Le dernier hier à midi. Pas d’antibiotique. J’en avais déjà pris avant sans problème." },
    { topic: "alimentation", keywords: FOOD, reply: "Rien de spécial, je mange comme d’habitude. Pas de fruits de mer ni de cacahuètes ces derniers jours." },
    { topic: "autres déclencheurs", keywords: OTHER_TRIGGERS, reply: "Non, pas de piqûre d’insecte, je n’ai pas fait de sport juste avant. Pas de nouvelle crème, pas de nouveau savon ni de nouvelle lessive. Pas d’animal à la colocation." },
    { topic: "épisodes antérieurs", keywords: PREVIOUS, reply: "Non, je n’ai jamais eu ça. C’est la première fois." },
    { topic: "terrain atopique", keywords: ["asthm", "atop", "rhume des foins", "pollen", "eczema"], reply: "J’ai le rhume des foins au printemps, et de l’eczéma quand j’étais petite. Pas d’asthme moi-même, mais ma mère est asthmatique." },
    { topic: "grossesse et contraception", keywords: ["enceinte", "grossesse", "regles", "contracep", "pilule", "rapport"], reply: "Je prends la pilule sans oubli. Mes dernières règles datent d’il y a deux semaines, normales." },
    { topic: "début", keywords: ONSET, reply: "Hier soir vers 20 heures, en rentrant de l’université. J’étais assise, je n’avais rien mangé de spécial." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 122/76 mmHg, FC 84/min, FR 14/min, SpO₂ 99 % à l’air ambiant, T 37,3 °C. Patiente en bon état général, pas de détresse." },
    { topic: "peau", examiner: true, keywords: ["inspect", "examen de la peau", "examen cutane", "vitropression", "dermographisme"], reply: "Papules et plaques érythémato-œdémateuses de 1 à 6 cm, à bords nets, certaines confluentes ou à centre plus pâle, sur le tronc, les bras et les cuisses ; lésions de grattage. Elles s’effacent à la vitropression : pas de purpura. Pas de vésicule, pas de lésion en cocarde, pas de décollement. Dermographisme positif." },
    { topic: "muqueuses", examiner: true, keywords: ["muqueuse", "luette", "palais", "examen orl", "examen de la bouche", "pharynx"], reply: "Lèvres, langue, luette et voile du palais sans œdème ; pas d’œdème des paupières. Pharynx légèrement rouge, sans dépôt ; amygdales non augmentées. Voix normale, pas de stridor." },
    { topic: "auscultation", examiner: true, keywords: ["auscult", "stethoscope", "j ecoute", "lutte"], reply: "Murmure vésiculaire symétrique, sans sibilance ni stridor ; pas de tirage. Bruits du cœur réguliers, sans souffle." },
    { topic: "bilan sanguin", examiner: true, keywords: ["formule sanguine", "fsc", "crp", "prise de sang"], reply: "Leucocytes 9,1 G/L, formule normale (éosinophiles 0,3 G/L). CRP 14 mg/L." },
    planReaction("Ces comprimés contre l’allergie, je les prends combien de temps ? Et je peux encore prendre de l’ibuprofène pour ma gorge ?", ["antihistamin", "cetirizine", "loratadine", "bilastine", "paracetamol", "a la maison"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "examen-cutane", label: "Inspection cutanée complète avec vitropression et dermographisme", category: "examen", pertinent: true, topic: "peau", covers: ["peau"] },
    { id: "muqueuses", label: "Examen ORL et des muqueuses (luette, voile du palais)", category: "examen", pertinent: true, topic: "muqueuses", covers: ["examen-orl"] },
    { id: "auscultation", label: "Auscultation cardio-pulmonaire et signes de lutte", category: "examen", pertinent: true, topic: "auscultation", covers: ["auscultation-pulmonaire", "auscultation-cardiaque", "signes-lutte"] },
    { id: "d-dimeres", label: "D-dimères", category: "complementaire", pertinent: false, result: "Non indiqués : rien n’évoque une thrombose ni une embolie.", covers: ["d-dimeres"] },
    { id: "tsh", label: "TSH", category: "complementaire", pertinent: false, result: "TSH dans les normes, mais non indiquée : elle se discute dans l’urticaire chronique (plus de 6 semaines), pas dans un premier épisode aigu.", covers: ["tsh"] },
    { id: "radio-thorax", label: "Radiographie du thorax", category: "complementaire", pertinent: false, result: "Normale, non indiquée : pas de signe respiratoire, auscultation normale.", covers: ["radio-thorax"] },
    { id: "hemocultures", label: "Hémocultures", category: "complementaire", pertinent: false, result: "Non indiquées : pas de fièvre actuelle, pas de signe de sepsis.", covers: ["hemocultures"] },
    { id: "tests-hepatiques", label: "Tests hépatiques et bilirubine", category: "complementaire", pertinent: false, result: "Dans les normes, non indiqués : rien n’oriente vers une atteinte du foie.", covers: ["tests-hepatiques"] },
  ],
  catalogResults: {
    "marquage-erytheme": "Peu utile : les plaques sont fugaces et changent de place en quelques heures.",
    "adenopathies": "Petites adénopathies cervicales sous-angulo-mandibulaires bilatérales, souples, peu sensibles. Pas d’autre adénopathie.",
    "points-appui": "Plaques ortiées aussi sur les fesses et à la ceinture, là où les vêtements serrent ; pas d’autre lésion.",
  },
  acceptable: ["fsc", "crp", "adenopathies", "beta-hcg", "dep", "percussion-thoracique"],
  diagnosisChoice: { correct: "Urticaire aiguë généralisée, sans angio-œdème ni anaphylaxie", distractors: ["Anaphylaxie", "Eczéma de contact", "Exanthème viral"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "lesions",
      label: "Caractérise l’éruption",
      hint: "Début, localisation, prurit, aspect et caractère fugace de chaque plaque (moins de 24 h)",
      points: 3,
      groups: [ONSET, LOCATION, ITCH, COURSE],
    },
    {
      id: "severity",
      label: "Recherche angio-œdème et anaphylaxie",
      hint: "Gonflement des lèvres, de la langue ou des paupières ; gêne respiratoire, à avaler ou à parler ; malaise, troubles digestifs",
      points: 3,
      groups: [SWELLING, AIRWAY, SYSTEMIC],
    },
    {
      id: "triggers",
      label: "Cherche un déclencheur",
      hint: "Infection récente, nouveau médicament (anti-inflammatoire, antibiotique), aliment, piqûre, contact, effort",
      points: 2,
      groups: [INFECTION, FOOD, OTHER_TRIGGERS],
    },
    {
      id: "terrain",
      label: "Évalue les antécédents",
      hint: "Épisodes antérieurs, atopie (asthme, rhinite, eczéma), antécédents familiaux",
      points: 2,
      groups: [PREVIOUS, TERRAIN],
    },
    {
      id: "habits",
      label: "Demande habitudes et contexte",
      hint: "Tabac, alcool, grossesse et contraception",
      points: 1,
      groups: [["fum", "tabac", "cigarette"], ["alcool", "boi", "verre"], ["enceinte", "grossesse", "regles", "contracep", "pilule"]],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes, description des lésions avec vitropression, examen des muqueuses (angio-œdème), auscultation et signes de lutte ; aucun bilan systématique",
      points: 5,
      groups: [["vitropression", "dermographisme", "luette", "auscult"]],
    },
    {
      id: "management",
      label: "Propose une suite simple",
      hint: "Antihistaminique H1 non sédatif, arrêt de l’anti-inflammatoire suspect ; consignes d’urgence si gonflement ou gêne respiratoire",
      points: 1,
      groups: [["antihistamin", "cetirizine", "levocetirizine", "loratadine", "desloratadine", "bilastine", "fexofenadine"], ["144", "reconsult", "revenir", "urgences", "si ca gonfle", "si vos levres"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Urticaire aiguë généralisée, probablement post-infectieuse (virose ORL) et/ou favorisée par l’ibuprofène, sans angio-œdème ni signe d’anaphylaxie",
    summary: "Femme de 24 ans, atopique, avec depuis la veille des papules et plaques érythémato-œdémateuses très prurigineuses, fugaces (chaque lésion disparaît en moins de 24 h sans trace) et migratrices, survenant après une virose des voies respiratoires supérieures traitée par ibuprofène. Pas de gonflement des lèvres, de la langue ou des paupières, pas de signe respiratoire, digestif ni circulatoire ; constantes normales. Les deux causes restent possibles et ne se distinguent pas cliniquement : antihistaminique H1 non sédatif, arrêt de l’AINS par prudence, consignes d’urgence.",
    keyFindings: [
      "Plaques ortiées prurigineuses, fugaces et migratrices, disparaissant à la vitropression, sans purpura ; dermographisme.",
      "Absence d’angio-œdème (lèvres, langue, luette, paupières) et d’atteinte respiratoire, digestive ou circulatoire : pas d’anaphylaxie.",
      "Contexte de virose ORL récente et prise d’ibuprofène depuis quatre jours ; terrain atopique.",
      "Constantes normales, auscultation normale.",
    ],
    redFlags: [
      "Gonflement des lèvres, de la langue ou de la gorge, voix modifiée, difficulté à avaler : angio-œdème, risque pour les voies aériennes.",
      "Gêne respiratoire, sibilances, stridor, malaise, hypotension, vomissements ou douleurs abdominales : anaphylaxie, adrénaline 0,5 mg intramusculaire et appel du 144.",
      "Lésions fixes plus de 24 h, douloureuses, purpuriques ou laissant une trace : penser à une vasculite urticarienne.",
      "Fièvre élevée, atteinte des muqueuses, décollement cutané : toxidermie grave, avis spécialisé urgent.",
    ],
    management: [
      "Antihistaminique H1 de 2ᵉ génération non sédatif (p. ex. cétirizine 10 mg/j ou bilastine 20 mg/j), à poursuivre quelques jours après la disparition des plaques ; dose jusqu’à 4× si insuffisant.",
      "Arrêter l’ibuprofène et les autres AINS, remplacer par du paracétamol pour la gorge ; corticoïde oral bref seulement si poussée sévère.",
      "Pas de bilan systématique dans une urticaire aiguë ; une FSC et une CRP peuvent étayer un contexte infectieux.",
      "Consignes : 144 ou urgences en cas de gonflement du visage ou de gêne respiratoire ; contrôle si persistance au-delà de 6 semaines (urticaire chronique) ; avis allergologique si suspicion médicamenteuse à confirmer.",
    ],
    differentials: [
      "Anaphylaxie (atteinte respiratoire, circulatoire ou digestive associée).",
      "Exanthème viral ou toxidermie maculo-papuleuse (lésions fixes, non fugaces).",
      "Eczéma de contact (lésions fixes, vésicules, zone de contact).",
      "Vasculite urticarienne, érythème polymorphe (lésions fixes, en cocarde).",
    ],
    sources: [
      { label: "NICE Clinical Knowledge Summaries — Urticaria", url: "https://cks.nice.org.uk/topics/urticaria/" },
      { label: "EAACI/GA²LEN/EuroGuiDerm/APAAACI — International guideline for urticaria (Allergy, 2022)", url: "https://doi.org/10.1111/all.15090" },
      { label: "NICE Clinical Knowledge Summaries — Angio-oedema and anaphylaxis", url: "https://cks.nice.org.uk/topics/angio-oedema-anaphylaxis/" },
    ],
    pathologySlugs: ["urticaire", "allergie-anaphylaxie"],
  },
};

export const urticaireAigueDiagnoses: StationDiagnoses = {
  accepted: ["urticaire"],
  differentials: [
    { label: "Anaphylaxie", ids: ["anaphylaxie"] },
    { label: "Eczéma de contact", ids: ["eczema-contact"] },
    { label: "Mononucléose infectieuse (éruption avec angine)", ids: ["mononucleose"] },
    { label: "Érysipèle", ids: ["erysipele"] },
  ],
};
