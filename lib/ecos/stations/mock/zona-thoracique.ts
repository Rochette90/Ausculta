import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { CHARACTER, communicationCriterion, FEVER, INTENSITY, LOCATION, ONSET, planReaction, presentationCriterion, RADIATION, treatmentsCriterion, VITALS } from "../shared.ts";

const RASH = ["bouton", "plaque", "rougeur", "rouge$", "eruption", "vesicul", "cloque", "bulle", "lesion", "tache", "croute", "aspect"];
const GENERAL = [...FEVER, "fatigu", "courbatur", "etat general"];
const EYE = ["oeil", "yeux", "vision", "vue$", "voir", "front", "paupiere", "nez$", "visage", "oreille"];
const HISTORY = ["antecedent", "maladie", "probleme de sante", "opere", "operation", "hospitalis", "famil", "parents", "pere$", "mere$", "frere", "soeur"];
const IMMUNITY = ["immun", "defense", "cancer", "chimio", "cortison", "greffe", "vih", "diabet", "infections a repetition"];
const VARICELLA = ["varicelle", "vaccin", "zona"];
const TOBACCO = ["fum", "tabac", "cigarette"];
const ALCOHOL = ["alcool", "boi", "vin$", "biere", "apero"];
const CONTACTS = ["entourage", "enceinte", "grossesse", "bebe", "nouveau ne", "petits enfants", "petit enfant", "contagi", "contact"];

export const zonaThoracique: EcosScenario = {
  slug: "zona-thoracique",
  version: 1,
  setting: "cabinet",
  patient: { name: "M. Delacrétaz", age: 67, sex: "M" },
  painful: true,
  persona: "Retraité calme et précis, un peu inquiet parce qu’il a d’abord cru à un problème de cœur. Coopératif, il montre volontiers l’endroit douloureux et répond simplement aux questions.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "M. Delacrétaz, 67 ans, consulte au cabinet pour une douleur qui brûle sur le côté gauche et des boutons apparus depuis deux jours.",
    "Menez l’anamnèse et l’examen clinique (status) ciblés, demandez les examens utiles, puis proposez une hypothèse diagnostique et la suite.",
  ],
  opening: "Bonjour docteur. Depuis quelques jours, j’ai une douleur qui brûle sur le côté gauche, et maintenant il y a des boutons.",
  history: {
    identity: "Pierre Delacrétaz, 67 ans.",
    occupation: "Je suis retraité, j’étais facteur.",
    living: "Je vis avec ma femme dans une maison à Moudon. Nous gardons nos petits-enfants le mercredi.",
    feeling: "Ça va, mais cette brûlure m’empêche de bien dormir.",
    previousEpisodes: "Non, je n’ai jamais eu ça.",
    course: "D’abord seulement la douleur, il y a quatre jours. Avant-hier, des boutons rouges sont sortis au même endroit, puis des petites cloques.",
    otherSymptoms: "Je me sens un peu fatigué et patraque.",
    medications: "Un comprimé pour la tension, de l’amlodipine, et du paracétamol depuis trois jours, mais ça ne soulage pas beaucoup.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "De la tension depuis une dizaine d’années, bien contrôlée. On m’a enlevé la vésicule il y a longtemps. Pas de diabète, pas de cancer.",
    familyHistory: "Mon père est mort d’un infarctus à 78 ans. Ma mère a eu du diabète.",
    tobacco: "J’ai fumé jusqu’à 50 ans, à peu près un paquet par jour. J’ai arrêté depuis.",
    alcohol: "Un verre de vin au repas, pas plus.",
    drugs: "Non, jamais.",
    concerns: "Au début, j’ai eu peur que ce soit le cœur. Et est-ce que c’est contagieux pour mes petits-enfants ?",
  },
  rules: [
    { topic: "localisation", keywords: [...LOCATION, "ou avez vous mal", "quel cote"], reply: "Ici, sur le côté gauche : ça part du dos, sous l’omoplate, et ça fait le tour jusque sous le sein, comme une ceinture. Seulement à gauche." },
    { topic: "type de douleur", keywords: CHARACTER, reply: "Ça brûle, avec des coups de décharge électrique de temps en temps. Même le frottement du t-shirt me fait mal." },
    { topic: "intensité", keywords: INTENSITY, reply: "Six sur dix la journée, plus la nuit." },
    { topic: "irradiation", keywords: RADIATION, reply: "Non, ça ne va pas dans le bras ni dans la mâchoire. Ça reste sur cette bande-là." },
    { topic: "facteurs déclenchants", keywords: ["effort", "marche", "escalier", "monter", "respir", "inspir", "bouge", "mouvement", "position", "touche", "frott"], reply: "Ce n’est pas lié à l’effort : je monte les escaliers sans problème. Respirer ne change rien. C’est surtout quand on touche la peau ou que le t-shirt frotte." },
    { topic: "éruption", keywords: [...RASH, "boutons ailleurs", "ailleurs sur le corps", "autre part"], reply: "Avant-hier, des plaques rouges sont sorties exactement là où j’avais mal, puis des petites cloques remplies d’un liquide clair. Certaines commencent à sécher. Il n’y en a nulle part ailleurs. Ça gratte un peu, mais surtout ça brûle." },
    { topic: "fièvre et état général", keywords: GENERAL, reply: "Pas vraiment de fièvre : 37,5 °C au plus. Je suis un peu fatigué, avec des courbatures au début." },
    { topic: "yeux et visage", keywords: EYE, reply: "Non, rien au visage ni près des yeux. Je vois bien, mes yeux ne sont ni rouges ni douloureux. Rien aux oreilles non plus." },
    { topic: "symptômes cardiaques et respiratoires", keywords: ["poitrine", "serre", "oppress", "palpit", "coeur", "essouffl", "souffle", "toux", "tousse"], reply: "Non, pas de serrement dans la poitrine, pas de palpitations, je ne suis pas essoufflé et je ne tousse pas." },
    { topic: "faiblesse et autres troubles", keywords: ["faiblesse", "force", "paralys", "fourmill", "engourd", "uriner", "pipi", "selles", "mal de tete", "nuque", "confus"], reply: "Non, j’ai toute ma force, pas de fourmillements ailleurs, pas de souci pour uriner ni pour aller à selle. Pas de mal de tête." },
    { topic: "défenses immunitaires", keywords: IMMUNITY, reply: "Non, pas de cancer, pas de chimio, pas de cortisone. Pas de diabète non plus. Je ne suis jamais beaucoup malade." },
    { topic: "varicelle et vaccins", keywords: VARICELLA, reply: "J’ai eu la varicelle enfant, comme tout le monde à l’époque. Je n’ai jamais eu de vaccin contre le zona, je ne savais pas que ça existait." },
    { topic: "entourage", keywords: CONTACTS, reply: "Nous gardons nos deux petits-enfants le mercredi, le plus petit a 8 mois. Et ma belle-fille attend un troisième enfant." },
    { topic: "tabac", keywords: TOBACCO, reply: "J’ai fumé un paquet par jour pendant trente ans, j’ai arrêté à 50 ans." },
    { topic: "alcool", keywords: ALCOHOL, reply: "Un verre de vin au repas, pas plus." },
    { topic: "début", keywords: ONSET, reply: "La douleur il y a quatre jours, d’abord comme un coup de froid dans le dos. Les boutons sont sortis avant-hier." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 142/84 mmHg, FC 76/min, FR 14/min, SpO₂ 97 % à l’air ambiant, T 37,4 °C. Patient en bon état général." },
    { topic: "peau", examiner: true, keywords: ["inspect", "regarde la peau", "examen de la peau", "examen cutane", "vitropression"], reply: "Sur l’hémithorax gauche, bande unilatérale allant de la colonne (niveau T5) jusque sous le mamelon : vésicules claires groupées en bouquets sur fond érythémateux, quelques vésicules ombiliquées et croûtes débutantes. L’éruption s’arrête net à la ligne médiane, en avant comme en arrière. Pas de lésion à distance, pas de signe de surinfection (pas de pus, pas d’extension de la rougeur)." },
    { topic: "examen neurologique", examiner: true, keywords: ["sensibilit", "dermatome", "examen neuro", "neurolog", "reflexe"], reply: "Allodynie au simple effleurement et hypoesthésie dans le territoire T5 gauche. Force, réflexes et nerfs crâniens normaux, pas de déficit moteur." },
    { topic: "examen ophtalmologique", examiner: true, keywords: ["hutchinson", "ophtalm", "examen des yeux", "pupille", "conjonctiv", "cornee"], reply: "Pas de vésicule sur le front, la paupière ni le bout du nez (signe de Hutchinson négatif). Conjonctives calmes, cornées claires, pupilles égales et réactives, acuité visuelle conservée." },
    { topic: "adénopathies", examiner: true, keywords: ["adenopathie", "ganglion", "aisselle", "axillaire"], reply: "Petite adénopathie axillaire gauche d’environ 1 cm, mobile et un peu sensible. Pas d’autre adénopathie." },
    { topic: "auscultation", examiner: true, keywords: ["auscult", "stethoscope", "j ecoute"], reply: "Bruits du cœur réguliers, sans souffle ni frottement. Murmure vésiculaire symétrique, sans bruit surajouté." },
    { topic: "ECG", examiner: true, keywords: ["ecg", "electrocardiogramme"], reply: "ECG : rythme sinusal à 76/min, axe normal, conduction normale, pas de trouble de la repolarisation." },
    planReaction("Ces médicaments, ça va faire passer la douleur ? Et pour les petits-enfants, je fais comment ?", ["valaciclovir", "aciclovir", "antiviral", "zona", "contagi", "a la maison"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "inspection-eruption", label: "Inspection du tronc avec vitropression", category: "examen", pertinent: true, topic: "peau", covers: ["peau"] },
    { id: "sensibilite-territoire", label: "Sensibilité du territoire atteint et examen neurologique", category: "examen", pertinent: true, topic: "examen neurologique", covers: ["examen-neurologique"] },
    { id: "examen-ophtalmo", label: "Examen ophtalmologique simple (signe de Hutchinson)", category: "examen", pertinent: true, topic: "examen ophtalmologique", covers: ["pupilles", "fond-oeil"] },
    { id: "adenopathies", label: "Recherche d’adénopathies", category: "examen", pertinent: true, topic: "adénopathies", covers: ["adenopathies"] },
    { id: "auscultation", label: "Auscultation cardio-pulmonaire", category: "examen", pertinent: true, topic: "auscultation", covers: ["auscultation-cardiaque", "auscultation-pulmonaire"] },
    { id: "ecg", label: "ECG 12 dérivations", category: "complementaire", pertinent: true, topic: "ECG", covers: ["ecg"], image: { src: "/ecos/ecg/blanc-13.svg", alt: "ECG 12 dérivations, avec DII long" } },
    { id: "prelevement-cutane", label: "Prélèvement bactériologique cutané", category: "complementaire", pertinent: false, result: "Inutile : éruption vésiculeuse typique, sans surinfection. En cas de doute, c’est une PCR VZV sur le liquide d’une vésicule qu’on demanderait, pas une bactériologie.", covers: ["prelevement-cutane"] },
    { id: "radio-thorax", label: "Radiographie du thorax", category: "complementaire", pertinent: false, result: "Normale, non indiquée : la douleur est superficielle, liée à l’éruption, sans signe respiratoire.", covers: ["radio-thorax"] },
    { id: "ct-thoracique", label: "CT thoracique injecté (angio-CT pulmonaire)", category: "complementaire", pertinent: false, result: "Non indiqué : pas de dyspnée, pas de signe d’embolie, cause cutanée évidente. Irradiation et produit de contraste inutiles.", covers: ["ct-thoracique"] },
    { id: "troponine", label: "Troponine", category: "complementaire", pertinent: false, result: "Troponine hs négative, mais non indiquée : douleur en brûlure continue, déclenchée par le frottement, sans lien avec l’effort, ECG normal.", covers: ["troponine"] },
  ],
  catalogResults: {
    "fond-oeil": "Fond d’œil sans particularité.",
    "marquage-erytheme": "Peu utile : il s’agit de vésicules groupées dans une bande, pas d’un érythème qui s’étend.",
    "rachis": "Rachis dorsal indolore à la percussion, mobilité conservée. La peau du dos à gauche est très sensible au toucher.",
  },
  acceptable: ["fsc", "crp", "creatinine", "hba1c", "percussion-thoracique"],
  diagnosisChoice: { correct: "Zona intercostal T5 gauche, sans atteinte ophtalmique", distractors: ["Eczéma de contact", "Herpès simplex cutané", "Syndrome coronarien aigu sans sus-décalage ST"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "pain",
      label: "Caractérise la douleur",
      hint: "Début et chronologie, localisation unilatérale en bande, type (brûlure, décharges), intensité et irradiation",
      points: 4,
      groups: [ONSET, LOCATION, CHARACTER, [...INTENSITY, ...RADIATION]],
    },
    {
      id: "associated",
      label: "Décrit l’éruption et recherche les signes associés",
      hint: "Aspect de l’éruption, fièvre et état général, atteinte de l’œil ou du visage",
      points: 3,
      groups: [RASH, GENERAL, EYE],
    },
    {
      id: "terrain",
      label: "Évalue le terrain",
      hint: "Antécédents personnels et familiaux, immunosuppression (cancer, corticoïdes, diabète), varicelle et vaccination",
      points: 3,
      groups: [HISTORY, IMMUNITY, VARICELLA],
    },
    {
      id: "habits",
      label: "Demande les habitudes de vie",
      hint: "Tabac, alcool",
      points: 1,
      groups: [TOBACCO, ALCOHOL],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes, description de l’éruption et du dermatome, sensibilité, recherche d’une atteinte ophtalmique, adénopathies, auscultation ; ECG chez un patient de 67 ans avec douleur du thorax",
      points: 5,
      groups: [["dermatome", "hutchinson", "auscult", "ecg"]],
    },
    {
      id: "management",
      label: "Propose une suite simple",
      hint: "Antiviral débuté dans les 72 h, antalgie ; précautions de contagion (femme enceinte, nourrisson)",
      points: 1,
      groups: [["valaciclovir", "aciclovir", "famciclovir", "antiviral"], ["contagi", "couvrir", "femme enceinte", "nourrisson", "nouveau ne"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Zona intercostal (dermatome T5 gauche), sans atteinte ophtalmique ni signe de gravité",
    summary: "Homme de 67 ans, immunocompétent, avec une douleur unilatérale en brûlure et décharges, en bande de la colonne au sternum, suivie deux jours plus tard d’une éruption de vésicules groupées sur fond érythémateux limitée au dermatome T5 gauche, ne dépassant pas la ligne médiane. Allodynie dans le territoire, pas d’atteinte du visage ni de l’œil, ECG normal. Éruption depuis moins de 72 h chez un patient de plus de 50 ans : antiviral oral et antalgie.",
    keyFindings: [
      "Prodrome douloureux (brûlure, décharges, allodynie) précédant l’éruption de 2 à 3 jours.",
      "Vésicules groupées en bouquets sur fond érythémateux, unilatérales, dans un seul dermatome, s’arrêtant à la ligne médiane.",
      "Hypoesthésie et allodynie dans le territoire T5 gauche, sans déficit moteur.",
      "Signe de Hutchinson négatif, pas de lésion du visage ; pas d’immunosuppression.",
    ],
    redFlags: [
      "Atteinte du territoire ophtalmique (front, paupière, bout du nez, œil rouge ou douloureux) : avis ophtalmologique urgent.",
      "Immunosuppression, zona étendu à plusieurs dermatomes ou disséminé : avis spécialisé, souvent aciclovir intraveineux.",
      "Céphalées, raideur de nuque, confusion, déficit moteur ou atteinte de l’oreille avec paralysie faciale (Ramsay Hunt).",
      "Douleur thoracique avant l’éruption chez un patient à risque : ne pas manquer une cause cardiaque (ECG).",
    ],
    management: [
      "Valaciclovir 1 g 3 ×/j pendant 7 jours (ou aciclovir 800 mg 5 ×/j), à débuter dans les 72 h suivant l’éruption ; dose à adapter à la fonction rénale.",
      "Antalgie par paliers (paracétamol, AINS avec prudence) ; si douleur neuropathique intense, discuter un gabapentinoïde.",
      "Lésions gardées propres, sèches et couvertes ; éviter le contact avec les femmes enceintes non immunes, les nourrissons et les personnes immunosupprimées jusqu’au stade de croûtes.",
      "Contrôle si aggravation ou atteinte du visage ; suivi de la douleur (névralgie post-zostérienne) ; vaccination contre le zona (vaccin recombinant) à distance de l’épisode.",
    ],
    differentials: [
      "Douleur d’origine cardiaque (syndrome coronarien) pendant la phase douloureuse sans éruption.",
      "Douleur pariétale ou radiculopathie dorsale.",
      "Herpès simplex à disposition zostériforme (récidives au même endroit).",
      "Eczéma de contact ou impétigo bulleux (pas de topographie en dermatome).",
    ],
    sources: [
      { label: "NICE Clinical Knowledge Summaries — Shingles", url: "https://cks.nice.org.uk/topics/shingles/" },
      { label: "DermNet — Herpes zoster", url: "https://dermnetnz.org/topics/herpes-zoster" },
    ],
    pathologySlugs: [],
  },
};

export const zonaThoraciqueDiagnoses: StationDiagnoses = {
  accepted: ["zona"],
  differentials: [
    { label: "Douleur thoracique d’origine cardiaque", ids: ["sca-nst", "sca-st", "angor-stable"] },
    { label: "Douleur pariétale thoracique", ids: ["douleur-parietale"] },
    { label: "Eczéma de contact", ids: ["eczema-contact"] },
    { label: "Impétigo", ids: ["impetigo"] },
  ],
};
