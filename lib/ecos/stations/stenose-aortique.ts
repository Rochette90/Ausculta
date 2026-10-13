import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, DYSPNEA, FEVER, LABS, ONSET, planReaction, presentationCriterion, SYNCOPE, treatmentsCriterion, VITALS } from "./shared.ts";

const EFFORT = ["effort", "escalier", "marches", "monter", "cote$", "marcher", "promenade", "jardin"];
const CHEST = ["douleur thoracique", "douleur dans la poitrine", "poitrine", "serre", "serrement", "oppress", "angine", "angor"];
const PALPITATIONS = ["palpit", "coeur bat", "coeur qui bat", "s emball", "irregul", "battements"];
const CONGESTION = ["oreiller", "a plat", "allonge", "la nuit", "reveill", "gonfl", "oedeme", "chevilles", "jambes enfl"];
const TRAUMA = ["blesse", "fait mal en tombant", "cogne", "traumat", "la tete", "chute"];
const RISK_FACTORS = ["tension", "hypertens", "cholesterol", "diabet", "fume", "tabac", "cigarette"];
const CARDIAC_HISTORY = ["souffle au coeur", "souffle cardiaque", "valve", "cardiolog", "probleme de coeur", "problemes de coeur", "maladie du coeur", "antecedent", "infarctus"];

export const stenoseAortique: EcosScenario = {
  slug: "stenose-aortique",
  version: 1,
  setting: "cabinet",
  patient: { name: "M. Aebischer", age: 78, sex: "M" },
  persona: "Patient âgé, robuste et pudique, ancien agriculteur fribourgeois. Il minimise (« c’est l’âge ») et ne parle de la gêne dans la poitrine et du malaise que si on lui pose la question. Il tient beaucoup à continuer à conduire.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "M. Aebischer, 78 ans, consulte au cabinet pour un essoufflement à l’effort et un malaise survenu en montant un escalier.",
    "Menez l’anamnèse, décrivez l’examen clinique et les examens utiles, posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. C’est ma femme qui a insisté : je m’essouffle de plus en plus, et la semaine passée j’ai fait un malaise dans l’escalier.",
  history: {
    identity: "Marcel Aebischer, 78 ans.",
    occupation: "Je suis retraité, j’étais agriculteur, on avait des vaches laitières.",
    living: "Je vis avec ma femme dans notre ferme, près de Guin. Mon fils a repris l’exploitation, j’aide encore un peu au jardin.",
    feeling: "Je suis fatigué, je n’ai plus la force d’avant. Et ce malaise m’a fait un peu peur, je dois dire.",
    previousEpisodes: "Le malaise, c’est la première fois. L’essoufflement, ça vient petit à petit depuis quelques mois.",
    course: "Depuis le printemps, je m’essouffle de plus en plus vite en montant la côte derrière la maison. Maintenant je dois m’arrêter au milieu de l’escalier de la cave.",
    otherSymptoms: "Quand je monte la côte, j’ai parfois comme un poids sur la poitrine qui passe si je m’arrête.",
    medications: "De l’amlodipine pour la tension et de l’atorvastatine pour le cholestérol. Du paracétamol de temps en temps pour les genoux.",
    allergies: "Pas d’allergie que je sache.",
    personalHistory: "De la tension et du cholestérol depuis une quinzaine d’années. Mon ancien médecin m’avait dit qu’il entendait un petit souffle au cœur, mais on n’a jamais fait d’examen. Opéré de la prostate il y a dix ans.",
    familyHistory: "Mon père est mort à 80 ans, du cœur je crois. Ma mère a vécu vieille.",
    tobacco: "J’ai fumé la pipe jusqu’à 60 ans, plus depuis.",
    alcohol: "Un verre de vin au repas, parfois une bière.",
    drugs: "Non, jamais.",
    concerns: "J’ai peur qu’on me retire le permis : sans la voiture, à la ferme, on ne peut rien faire.",
  },
  rules: [
    { topic: "essoufflement", keywords: [...DYSPNEA, ...EFFORT], reply: "Seulement à l’effort : la côte derrière la maison, l’escalier de la cave avec un cageot. Au repos, je respire bien. Il y a un an, je faisais encore tout sans m’arrêter." },
    { topic: "douleur thoracique", keywords: CHEST, reply: "Oui, quand je monte la côte, j’ai comme un poids au milieu de la poitrine, ça ne va pas dans le bras. Si je m’arrête deux minutes, ça passe. Jamais au repos." },
    { topic: "malaise", keywords: SYNCOPE, reply: "Mardi passé, je montais l’escalier de la cave avec une caisse de pommes. Arrivé en haut, j’ai vu tout noir et je me suis retrouvé assis par terre. Ma femme dit que je suis resté absent quelques secondes, pas plus. Après, j’étais tout de suite bien réveillé, je savais où j’étais." },
    { topic: "circonstances du malaise", keywords: ["prodrome", "avant le malaise", "senti venir", "nausee", "sueur", "transpir", "convuls", "secou", "mordu", "langue", "urine sur", "perdu les urines", "confus"], reply: "Je n’ai rien senti venir, à part le souffle court en montant. Pas de sueurs, pas de nausée. Ma femme n’a pas vu de secousses, je ne me suis pas mordu la langue et je ne me suis pas mouillé." },
    { topic: "debout ou couché", keywords: ["en vous levant", "se lever", "lever du lit", "debout longtemps", "chaleur", "position"], reply: "Non, ce n’était pas en me levant, c’était pendant l’effort, en haut de l’escalier." },
    { topic: "palpitations", keywords: PALPITATIONS, reply: "Non, je n’ai pas senti le cœur battre vite ou de travers." },
    { topic: "congestion", keywords: CONGESTION, reply: "Je dors avec un oreiller, comme toujours, je ne me réveille pas pour respirer. Les chevilles sont un peu gonflées le soir, mais ça passe la nuit." },
    { topic: "blessure", keywords: TRAUMA, reply: "Je me suis juste un peu écorché le coude. La tête n’a pas tapé." },
    { topic: "souffle connu", keywords: ["souffle au coeur", "souffle cardiaque", "valve", "deja entendu", "cardiolog", "echographie du coeur"], reply: "L’ancien docteur m’avait parlé d’un petit souffle, il y a peut-être cinq ans. Je n’ai jamais vu de cardiologue." },
    { topic: "facteurs de risque", keywords: RISK_FACTORS, reply: "La tension et le cholestérol, oui, je prends les comprimés. Pas de diabète. J’ai fumé la pipe jusqu’à 60 ans." },
    { topic: "fièvre", keywords: [...FEVER, "dentiste", "dents"], reply: "Non, pas de fièvre. J’ai un dentier en haut, je vais chez le dentiste une fois par année." },
    { topic: "début", keywords: ONSET, reply: "L’essoufflement depuis le printemps, de plus en plus. Le malaise, c’était mardi passé, il y a six jours." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 118/84 mmHg aux deux bras, FC 72/min régulière, FR 16/min, SpO₂ 96 % à l’air ambiant, T 36,6 °C. Pas d’hypotension orthostatique. Patient eupnéique au repos, bien orienté." },
    { topic: "auscultation cardiaque", examiner: true, keywords: ["auscult", "stethoscop", "bruits du coeur", "examen cardio", "j examine", "je vous examine", "examen clinique", "examen physique"], reply: "Souffle systolique éjectionnel rude, 4/6, en losange à maximum tardif, maximal au 2ᵉ espace intercostal droit, irradiant aux deux carotides. B2 aboli. Pas de B3, pas de souffle diastolique." },
    { topic: "pouls", examiner: true, keywords: ["pouls", "carotid", "palpe le pouls", "pouls radial"], reply: "Pouls carotidien faible et ascension lente, retardé par rapport au choc de pointe (pulsus parvus et tardus). Pouls périphériques présents et symétriques. Choc de pointe soutenu, non déplacé." },
    { topic: "poumons et congestion", examiner: true, keywords: ["poumon", "crepitant", "jugulaire", "reflux hepato", "godet"], reply: "Murmure vésiculaire symétrique, quelques crépitants fins aux deux bases. Pas de turgescence jugulaire, reflux hépato-jugulaire négatif. Discrets œdèmes malléolaires bilatéraux prenant le godet." },
    { topic: "ECG", examiner: true, keywords: ["ecg", "electrocardio"], reply: "ECG 12 dérivations : rythme sinusal régulier à 72/min, PR 180 ms, QRS 100 ms, axe à −10°. Indice de Sokolow-Lyon (S en V1 + R en V5) à 42 mm : hypertrophie ventriculaire gauche. Sous-décalage descendant du segment ST de 1 mm avec ondes T négatives asymétriques en V5, V6, DI et aVL (troubles de la repolarisation de surcharge). Pas d’onde Q, pas de bloc de branche." },
    { topic: "échocardiographie", examiner: true, keywords: ["echocardio", "echographie cardiaque", "echographie du coeur", "echo cardiaque", "ett$"], reply: "Échocardiographie transthoracique : valve aortique tricuspide très calcifiée, à l’ouverture très réduite. Vitesse maximale transvalvulaire 4,6 m/s, gradient moyen 52 mmHg, surface valvulaire aortique 0,7 cm² (0,38 cm²/m²). Hypertrophie concentrique du ventricule gauche (septum 14 mm), FEVG conservée à 60 %. Pas d’autre valvulopathie significative, PAPs estimée à 35 mmHg." },
    { topic: "bilan sanguin", examiner: true, keywords: [...LABS, "bnp", "nt probnp", "troponine", "hemoglobine"], reply: "Hb 136 g/L, leucocytes et plaquettes normaux, créatinine 96 µmol/L, sodium 139 mmol/L, potassium 4,3 mmol/L, NT-proBNP 1 250 ng/L, troponine hs 12 ng/L." },
    { topic: "radiographie", examiner: true, keywords: ["radio", "radiographie"], reply: "Radiographie du thorax : silhouette cardiaque à la limite supérieure de la norme, pointe arrondie, calcifications projetées sur la valve aortique sur le profil, dilatation de l’aorte ascendante. Pas de foyer, pas d’épanchement, pas de redistribution vasculaire nette." },
    planReaction("Une opération, à mon âge ? Et je pourrai continuer à conduire en attendant ?", ["operation", "operer", "valve", "tavi", "cardiolog", "echographie", "conduire", "voiture"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales, tension aux deux bras et recherche d’hypotension orthostatique", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes", "ta-deux-bras"], key: ["constantes"] },
    { id: "auscultation-cardiaque", label: "Auscultation cardiaque et des vaisseaux du cou", category: "examen", pertinent: true, topic: "auscultation cardiaque", covers: ["auscultation-cardiaque", "auscultation-carotides"], key: ["auscultation-cardiaque"] },
    { id: "pouls", label: "Palpation des pouls carotidiens et périphériques", category: "examen", pertinent: true, topic: "pouls", covers: ["pouls-peripheriques"] },
    { id: "congestion", label: "Poumons, jugulaires et membres inférieurs", category: "examen", pertinent: true, topic: "poumons et congestion", covers: ["auscultation-pulmonaire", "jugulaires", "oedemes"], key: ["auscultation-pulmonaire", "jugulaires", "oedemes"] },
    { id: "ecg", label: "ECG 12 dérivations", category: "complementaire", pertinent: true, topic: "ECG", covers: ["ecg"], image: { src: "/ecos/ecg/station-26.svg", alt: "ECG 12 dérivations, avec DII long" } },
    { id: "echocardiographie", label: "Échocardiographie transthoracique", category: "complementaire", pertinent: true, topic: "échocardiographie", covers: ["echocardiographie"] },
    { id: "bilan-sanguin", label: "Bilan sanguin (FSC, créatinine, électrolytes, NT-proBNP, troponine)", category: "complementaire", pertinent: true, topic: "bilan sanguin", covers: ["fsc", "creatinine", "ionogramme", "nt-probnp", "troponine"], key: ["fsc", "nt-probnp"] },
    { id: "ct-cerebral", label: "CT cérébral natif", category: "complementaire", pertinent: false, result: "Non indiqué : perte de connaissance brève à l’effort, sans traumatisme crânien ni déficit neurologique ; la cause est à chercher du côté du cœur.", covers: ["ct-cerebral"] },
    { id: "eeg", label: "Électroencéphalogramme", category: "complementaire", pertinent: false, result: "Non indiqué : pas d’argument pour une crise épileptique (syncope d’effort brève, sans secousses, morsure ni confusion).", covers: ["eeg"] },
    { id: "d-dimeres", label: "D-dimères", category: "complementaire", pertinent: false, result: "Non indiqués : dyspnée d’effort progressive depuis des mois, sans argument pour une embolie pulmonaire ; un dosage positif à cet âge n’apporterait rien.", covers: ["d-dimeres"] },
  ],
  catalogResults: {
    "fsc": "Hb 136 g/L, leucocytes et plaquettes normaux.",
    "creatinine": "Créatinine 96 µmol/L, urée 7,1 mmol/L.",
    "ionogramme": "Sodium 139 mmol/L, potassium 4,3 mmol/L.",
    "nt-probnp": "NT-proBNP 1 250 ng/L.",
    "troponine": "Troponine hs 12 ng/L, stable à 1 heure.",
    "radio-thorax": "Silhouette cardiaque à la limite supérieure de la norme, pointe arrondie, calcifications projetées sur la valve aortique sur le profil, dilatation de l’aorte ascendante. Pas de foyer, pas d’épanchement, pas de redistribution vasculaire nette.",
    "percussion-thoracique": "Sonorité normale et symétrique.",
    "mollets": "Discrets œdèmes malléolaires bilatéraux ; mollets souples et indolores.",
  },
  acceptable: ["radio-thorax", "ta-deux-bras", "ecg-droit", "tsh", "crase", "foie-rate", "examen-neurologique"],
  diagnosisChoice: { correct: "Sténose aortique serrée symptomatique", distractors: ["Syncope vasovagale", "Bloc auriculo-ventriculaire", "Angor stable"] },
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Caractérise les symptômes d’effort",
      hint: "Début et évolution, dyspnée d’effort, douleur thoracique d’effort, malaise ou syncope",
      points: 4,
      groups: [ONSET, [...DYSPNEA, ...EFFORT], CHEST, SYNCOPE],
    },
    {
      id: "syncope",
      label: "Précise le malaise et ses diagnostics à exclure",
      hint: "Palpitations (arythmie), signes d’insuffisance cardiaque, traumatisme lors de la chute",
      points: 3,
      groups: [PALPITATIONS, CONGESTION, TRAUMA],
    },
    {
      id: "terrain",
      label: "Évalue le terrain cardiovasculaire",
      hint: "Facteurs de risque cardiovasculaire, souffle ou maladie cardiaque connus",
      points: 2,
      groups: [RISK_FACTORS, CARDIAC_HISTORY],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen et examens ciblés",
      hint: "Constantes, auscultation cardiaque et carotides, pouls, signes congestifs, ECG, échocardiographie, bilan sanguin",
      points: 3,
      groups: [["auscult", "souffle", "carotid", "pouls"], ["ecg", "electrocardio"], ["echocardio", "echographie cardiaque", "echographie du coeur"]],
    },
    {
      id: "management",
      label: "Oriente vers un traitement de la valve",
      hint: "Échocardiographie, avis cardiologique rapide (Heart Team), remplacement valvulaire (TAVI ou chirurgie), pas d’effort intense ni de conduite automobile en attendant",
      points: 4,
      groups: [
        ["echocardio", "echographie cardiaque", "echographie du coeur", "ultrason du coeur", "ett$"],
        ["cardiolog", "heart team", "specialiste du coeur"],
        ["remplacement", "tavi", "valve", "prothese", "chirurg", "operation", "operer", "intervention"],
        ["eviter les efforts", "pas d effort", "efforts", "conduire", "conduite", "voiture", "permis"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Sténose aortique serrée calcifiée (dégénérative), symptomatique : dyspnée d’effort, angor d’effort et syncope d’effort",
    summary: "Homme de 78 ans, hypertendu, avec un souffle connu jamais exploré, qui présente depuis quelques mois une dyspnée d’effort progressive, un angor d’effort et une syncope brève à l’effort. À l’examen : souffle systolique éjectionnel 4/6 au 2ᵉ espace intercostal droit irradiant aux carotides, B2 aboli, pouls parvus et tardus. ECG : hypertrophie ventriculaire gauche avec troubles de repolarisation. L’échocardiographie confirme une sténose aortique serrée (Vmax 4,6 m/s, gradient moyen 52 mmHg, surface 0,7 cm²) à FEVG conservée : indication à un remplacement valvulaire rapide, discuté en Heart Team.",
    keyFindings: [
      "Triade d’effort : dyspnée, angor et syncope, apparus chez un patient âgé avec un souffle connu.",
      "Souffle systolique éjectionnel rude au 2ᵉ espace intercostal droit irradiant aux carotides, B2 aboli, pouls carotidien parvus et tardus.",
      "ECG : rythme sinusal, hypertrophie ventriculaire gauche (Sokolow-Lyon 42 mm) avec sous-décalage ST et ondes T négatives en V5-V6.",
      "Échocardiographie : Vmax 4,6 m/s, gradient moyen 52 mmHg, surface valvulaire 0,7 cm², FEVG conservée.",
    ],
    redFlags: [
      "Syncope d’effort : cause cardiaque jusqu’à preuve du contraire ; risque de mort subite dans la sténose aortique symptomatique.",
      "Apparition des symptômes : pronostic sombre sans traitement de la valve (survie médiane de quelques années, plus courte encore en cas d’insuffisance cardiaque).",
      "Signes d’insuffisance cardiaque, angor de repos ou baisse de la FEVG : hospitalisation et intervention rapide.",
      "Vasodilatateurs puissants (nitrés), déshydratation ou hypovolémie : risque d’hypotension sévère.",
    ],
    management: [
      "Échocardiographie transthoracique rapide pour confirmer et quantifier la sténose (Vmax, gradient moyen, surface, FEVG).",
      "Avis cardiologique rapide, dans les jours qui suivent ; décision en Heart Team.",
      "Sténose serrée symptomatique : remplacement valvulaire aortique ; à 78 ans, le TAVI (voie fémorale) est en général privilégié, la chirurgie selon l’anatomie et le risque opératoire. Bilan préalable : coronarographie ou CT coronaire, CT de l’aorte et des axes iliofémoraux, contrôle dentaire.",
      "En attendant : éviter les efforts intenses, pas de conduite automobile après une syncope d’effort tant que la cause n’est pas traitée, éviter les nitrés et la déshydratation, poursuivre le traitement antihypertenseur avec prudence.",
      "Expliquer le diagnostic, consignes de consulter en urgence en cas de nouvelle syncope, douleur de repos ou essoufflement aggravé.",
    ],
    differentials: [
      "Cardiopathie ischémique (angor stable) : l’angor peut aussi venir d’une maladie coronarienne associée, fréquente à cet âge.",
      "Trouble du rythme ou de la conduction (bloc auriculo-ventriculaire, tachycardie ventriculaire) : ECG, Holter.",
      "Cardiomyopathie hypertrophique obstructive : souffle majoré par la manœuvre de Valsalva, B2 conservé ; l’échocardiographie tranche.",
      "Syncope réflexe ou orthostatique : survient debout ou au lever, avec prodromes, et non pendant l’effort.",
    ],
    sources: [
      { label: "ESC/EACTS 2021 — Guidelines for the management of valvular heart disease", url: "https://doi.org/10.1093/eurheartj/ehab395" },
      { label: "ESC 2018 — Guidelines for the diagnosis and management of syncope", url: "https://doi.org/10.1093/eurheartj/ehy037" },
    ],
    pathologySlugs: ["stenose-aortique", "epilepsie-syncope-pnes", "insuffisance-cardiaque"],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const stenoseAortiqueDiagnoses: StationDiagnoses = {
  accepted: ["stenose-aortique"],
  differentials: [
    d("Cardiopathie ischémique", "angor-stable", "sca-nst"),
    d("Trouble du rythme ou de la conduction", "bloc-av", "tachycardie-ventriculaire", "fibrillation-auriculaire"),
    d("Insuffisance cardiaque d’autre origine", "insuffisance-cardiaque-decompensee"),
    d("Syncope réflexe ou orthostatique", "syncope-vasovagale", "hypotension-orthostatique"),
  ],
};
