import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { communicationCriterion, DYSPNEA, FEVER, INTENSITY, LOCATION, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "../shared.ts";

const THROAT = ["gorge", "avaler", "aval", "deglut", "angine", "amygdal", "mal en mangeant"];
const NODES = ["ganglion", "boule", "gonfl", "bosse", "cou$"];
const FATIGUE = ["fatigu", "epuis", "energie", "creve", "dormi", "sommeil"];
const COLD = ["toux", "tousse", "rhume", "nez$", "coule", "eternu"];
const AIRWAY = [...DYSPNEA, "salive", "ouvrir la bouche", "boire", "bois$", "hydrat"];
const COMPLICATIONS = ["ventre", "cote gauche", "sous les cotes", "jaune", "bouton", "eruption", "taches"];
const CONTACT = ["entourage", "contact", "copain", "copine", "embrass", "malade autour", "colocat", "quelqu un de malade", "autour de vous"];
const SEXUAL = ["rapport", "sexu", "partenaire", "preservatif", "protege", "vih", "ist$"];

export const mononucleoseInfectieuse: EcosScenario = {
  slug: "mononucleose-infectieuse",
  version: 1,
  setting: "cabinet",
  patient: { name: "Mme Jaquier", age: 19, sex: "F" },
  painful: true,
  persona: "Étudiante de 19 ans, épuisée et un peu abattue, coopérative. Elle parle franchement, y compris de sa vie sexuelle si on le lui demande avec tact. Elle s’inquiète surtout pour ses examens.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "Mme Jaquier, 19 ans, consulte au cabinet pour un mal de gorge, de la fièvre et une grande fatigue depuis une semaine.",
    "Menez l’anamnèse, réalisez l’examen clinique et les examens utiles, puis proposez une hypothèse diagnostique et la suite.",
  ],
  opening: "Bonjour docteur. J’ai mal à la gorge et de la fièvre depuis une semaine, et je suis complètement épuisée.",
  history: {
    identity: "Clémence Jaquier, j’ai 19 ans.",
    occupation: "Je suis étudiante en première année de droit à Lausanne.",
    living: "Je vis en colocation à Lausanne avec deux amies. Mes parents habitent à Fribourg.",
    feeling: "Vidée. Je dors douze heures par nuit et je suis encore fatiguée en me levant.",
    previousEpisodes: "J’ai déjà eu des angines, mais jamais aussi longtemps ni avec une fatigue pareille.",
    course: "Ça a commencé il y a une dizaine de jours par une grosse fatigue, puis le mal de gorge et la fièvre depuis une semaine. Ça ne s’améliore pas.",
    otherSymptoms: "J’ai des boules dans le cou qui me font un peu mal.",
    medications: "Du paracétamol et de l’ibuprofène pour la fièvre, et la pilule.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Rien de particulier, je n’ai jamais été opérée. Mes vaccins sont à jour.",
    familyHistory: "Mes parents et mon frère vont bien. Mon grand-père a du diabète.",
    tobacco: "Quelques cigarettes en soirée, pas tous les jours.",
    alcohol: "Quelques verres le week-end quand je sors.",
    drugs: "Un joint de temps en temps en soirée, rarement.",
    concerns: "J’ai mes examens dans trois semaines : j’ai peur de ne pas pouvoir les passer.",
  },
  rules: [
    { topic: "mal de gorge", keywords: THROAT, reply: "J’ai très mal en avalant, comme des lames de rasoir, des deux côtés. J’arrive à boire, mais manger du solide est difficile." },
    { topic: "localisation", keywords: [...LOCATION, "ou avez vous mal", "irrad"], reply: "Dans la gorge, des deux côtés, et un peu dans le cou là où il y a les boules." },
    { topic: "intensité", keywords: INTENSITY, reply: "Sept sur dix quand j’avale, moins quand je ne fais rien." },
    { topic: "fièvre", keywords: FEVER, reply: "Entre 38,5 et 39 °C le soir, avec des frissons les premiers jours. Le paracétamol la fait baisser quelques heures." },
    { topic: "ganglions", keywords: NODES, reply: "Oui, j’ai des boules des deux côtés du cou, surtout derrière, un peu sensibles. Je n’ai rien remarqué ailleurs." },
    { topic: "fatigue", keywords: FATIGUE, reply: "Je suis épuisée depuis dix jours. Je n’arrive plus à aller aux cours, je dors tout le temps." },
    { topic: "toux et rhume", keywords: COLD, reply: "Non, je ne tousse pas. J’ai eu le nez un peu bouché au début, c’est tout." },
    { topic: "respiration et déglutition", keywords: [...DYSPNEA, "salive", "ouvrir la bouche", "etouffe"], reply: "Je respire bien. J’arrive à ouvrir la bouche et à avaler ma salive, même si ça fait mal." },
    { topic: "hydratation", keywords: ["boire", "bois$", "hydrat", "uriner", "urine", "pipi"], reply: "Je bois de l’eau et des tisanes sans problème, et j’urine normalement." },
    { topic: "ventre", keywords: ["ventre", "cote gauche", "sous les cotes", "jaune", "urines foncees"], reply: "J’ai une petite gêne à gauche sous les côtes depuis deux ou trois jours, rien de fort. Je n’ai pas remarqué que j’étais jaune." },
    { topic: "peau", keywords: ["bouton", "eruption", "plaque", "rougeur", "taches", "peau"], reply: "Non, je n’ai rien sur la peau." },
    { topic: "contage", keywords: CONTACT, reply: "Mon copain a eu mal à la gorge et il était très fatigué il y a un peu plus d’un mois. Mes colocataires vont bien." },
    { topic: "sexualité", keywords: SEXUAL, reply: "J’ai un copain depuis trois mois. On a utilisé des préservatifs au début, maintenant seulement la pilule. Avant lui, j’ai eu un autre partenaire l’an dernier. Je n’ai jamais fait de test VIH." },
    { topic: "voyage", keywords: ["voyage", "etranger", "vacances"], reply: "Pas depuis cet été : deux semaines en Italie en juillet." },
    { topic: "règles", keywords: ["regles", "enceinte", "grossesse", "contracep"], reply: "Je prends la pilule sans oubli, mes dernières règles datent de deux semaines." },
    { topic: "antibiotiques", keywords: ["antibio"], reply: "Non, je n’ai pas pris d’antibiotique." },
    { topic: "début", keywords: ONSET, reply: "La fatigue il y a une dizaine de jours, puis le mal de gorge et la fièvre depuis une semaine." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 38,6 °C, FC 96/min, TA 112/70 mmHg, FR 16/min, SpO₂ 99 %. Patiente fatiguée mais en bon état général." },
    { topic: "examen ORL", examiner: true, keywords: ["orl", "oropharyn", "otoscop", "tympan", "regarde la gorge", "regarder la gorge", "examine la gorge", "examiner la gorge", "abaisse langue"], reply: "Amygdales très augmentées de volume, recouvertes d’un enduit blanchâtre, quelques pétéchies au palais. Luette médiane, pas de bombement d’un côté, ouverture de bouche normale. Tympans normaux." },
    { topic: "ganglions à l’examen", examiner: true, keywords: ["adenopath", "aires ganglionnaires", "palpe les ganglions", "palper les ganglions", "palpation des ganglions", "palpation du cou"], reply: "Adénopathies cervicales antérieures et postérieures bilatérales de 1,5 à 2 cm, mobiles, peu douloureuses. Quelques petites adénopathies axillaires des deux côtés. Pas d’adénopathie inguinale." },
    { topic: "abdomen", examiner: true, keywords: ["palp", "abdomen", "rate$", "splenomegal", "foie$", "hepatomegal", "examen clinique", "examen physique", "je vous examine"], reply: "Abdomen souple et indolore. Rate palpable à 2 cm sous le rebord costal gauche, souple, à peine sensible. Foie de taille normale, pas d’ictère." },
    { topic: "formule sanguine", examiner: true, keywords: ["formule", "fsc", "frottis", "prise de sang", "bilan sanguin", "biologie", "laboratoire", "labo"], reply: "Leucocytes 13,5 G/L avec 65 % de lymphocytes, dont 15 % de lymphocytes activés (atypiques) au frottis. Hémoglobine 134 g/L, thrombocytes 165 G/L." },
    planReaction("Donc ce n’est pas grave ? Je pourrai passer mes examens ? Et je dois prendre des antibiotiques ?", ["repos", "pas de sport", "sport", "paracetamol", "test", "controle", "certificat"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "orl", label: "Examen ORL (oropharynx, tympans)", category: "examen", pertinent: true, topic: "examen ORL", covers: ["examen-orl"] },
    { id: "adenopathies", label: "Recherche d’adénopathies", category: "examen", pertinent: true, topic: "ganglions à l’examen" },
    { id: "foie-rate", label: "Palpation du foie et de la rate", category: "examen", pertinent: true, topic: "abdomen", covers: ["foie-rate", "palpation-abdominale"] },
    { id: "fsc", label: "Formule sanguine complète avec frottis", category: "complementaire", pertinent: true, topic: "formule sanguine" },
    { id: "test-ebv", label: "Test rapide de mononucléose", category: "complementaire", pertinent: true, result: "Test rapide de mononucléose (anticorps hétérophiles) positif.", covers: ["test-ebv"] },
    { id: "radio-thorax", label: "Radiographie du thorax", category: "complementaire", pertinent: false, result: "Non indiquée : ni toux ni signe pulmonaire. Elle serait normale." },
    { id: "hemocultures", label: "Hémocultures", category: "complementaire", pertinent: false, result: "Non indiquées : jeune patiente en bon état général, sans signe de sepsis." },
    { id: "echo-abdominale", label: "Échographie abdominale", category: "complementaire", pertinent: false, result: "Pas nécessaire : la rate est palpable cliniquement et l’échographie ne changerait pas la conduite. Elle montrerait une rate homogène de 14 cm, sans autre anomalie." },
    { id: "signes-meninges", label: "Signes méningés (raideur de nuque, Kernig, Brudzinski)", category: "examen", pertinent: false, result: "Négatifs. Geste peu utile ici : pas de céphalée, pas de trouble de la conscience." },
    { id: "ponction-lombaire", label: "Ponction lombaire", category: "complementaire", pertinent: false, result: "Non indiquée : aucun signe méningé ni neurologique." },
  ],
  catalogResults: {
    "etat-general": "Patiente fatiguée mais en bon état général, conscience normale, coloration normale.",
    "crp": "CRP 18 mg/L.",
    "tests-hepatiques": "ASAT 78 U/L, ALAT 104 U/L, bilirubine 14 µmol/L, phosphatase alcaline dans les normes.",
    "serologies": "Sérologies VIH, VHB et VHC prélevées avec l’accord de la patiente ; résultats dans quelques jours.",
  },
  acceptable: ["strepto-test", "crp", "tests-hepatiques", "serologies", "peau", "ictere", "auscultation-pulmonaire", "auscultation-cardiaque"],
  diagnosisChoice: { correct: "Mononucléose infectieuse (primo-infection à EBV)", distractors: ["Angine streptococcique", "Primo-infection VIH", "Lymphome"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Caractérise le mal de gorge et la fièvre",
      hint: "Début et évolution, douleur à la déglutition, fièvre",
      points: 3,
      groups: [ONSET, THROAT, FEVER],
    },
    {
      id: "associated",
      label: "Recherche les signes associés",
      hint: "Ganglions, fatigue, toux ou rhume (orientation virale ou bactérienne)",
      points: 3,
      groups: [NODES, FATIGUE, COLD],
    },
    {
      id: "severity",
      label: "Recherche complications et signes de gravité",
      hint: "Gêne respiratoire, salive, capacité à boire ; douleur sous les côtes à gauche, ictère, éruption",
      points: 2,
      groups: [AIRWAY, COMPLICATIONS],
    },
    {
      id: "exposure",
      label: "Recherche le contage et les expositions",
      hint: "Entourage malade, partenaire ; rapports sexuels non protégés (primo-infection VIH)",
      points: 2,
      groups: [CONTACT, SEXUAL],
    },
    {
      id: "terrain",
      label: "Évalue le terrain et les habitudes",
      hint: "Antécédents personnels et familiaux, vaccins ; tabac, alcool, drogues",
      points: 2,
      groups: [
        ["antecedent", "maladie", "probleme de sante", "opere", "operation", "hospitalis", "vaccin", "famille", "parents"],
        ["tabac", "fume", "cigarette", "alcool", "drogue", "cannabis", "joint$"],
      ],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes, examen ORL, recherche d’adénopathies, palpation de la rate et du foie ; formule sanguine avec frottis, test rapide de mononucléose",
      points: 5,
      groups: [["examen clinique", "status", "j examine", "je vous examine"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Mononucléose infectieuse (primo-infection à virus d’Epstein-Barr)",
    summary: "Étudiante de 19 ans avec une fatigue marquée suivie d’une angine érythémato-pultacée fébrile depuis une semaine, des adénopathies cervicales postérieures bilatérales, une splénomégalie discrète, sans toux, après un contact avec un partenaire malade le mois précédent. La formule montre une lymphocytose avec lymphocytes activés et les transaminases sont modérément élevées : le tableau évoque une mononucléose, à confirmer par un test rapide ou une sérologie EBV. Une angine streptococcique et une primo-infection VIH (rapports non protégés) restent à exclure.",
    keyFindings: [
      "Triade fièvre, angine et adénopathies, précédée d’une grande fatigue, chez une adolescente ou une jeune adulte.",
      "Adénopathies cervicales postérieures bilatérales, pétéchies au palais, splénomégalie.",
      "Lymphocytose avec lymphocytes activés (atypiques) et cytolyse hépatique modérée.",
      "Contact avec un partenaire malade quelques semaines avant (incubation de 4 à 6 semaines).",
    ],
    redFlags: [
      "Difficulté à respirer, stridor ou impossibilité d’avaler la salive : obstruction des voies aériennes, avis ORL urgent.",
      "Douleur brutale de l’hypochondre gauche ou de l’épaule gauche, malaise : rupture splénique, urgence chirurgicale.",
      "Bombement unilatéral du voile, trismus, voix étouffée : abcès péri-amygdalien.",
      "Ictère, pâleur ou saignements : hépatite marquée, anémie hémolytique ou thrombopénie.",
    ],
    management: [
      "Confirmer : test rapide d’anticorps hétérophiles (souvent faux négatif la première semaine) ou sérologie EBV (IgM anti-VCA) ; test rapide streptococcique selon le score de Centor.",
      "Proposer un dépistage du VIH (rapports non protégés) : une primo-infection donne un tableau proche.",
      "Traitement symptomatique : antalgiques et antipyrétiques (paracétamol, AINS), hydratation, repos selon la fatigue ; pas d’antibiotique, et surtout pas d’amoxicilline (éruption fréquente).",
      "Éviter les sports de contact et les efforts intenses pendant au moins 3 à 4 semaines (risque de rupture splénique) ; certificat si besoin.",
      "Consignes de reconsultation (gêne respiratoire, douleur à gauche, impossibilité de boire) et contrôle clinique selon l’évolution ; la fatigue peut durer plusieurs semaines.",
    ],
    differentials: [
      "Angine streptococcique (début brutal, pas d’adénopathie postérieure ni de splénomégalie, test rapide positif).",
      "Primo-infection VIH (rapports à risque, éruption, ulcérations buccales ; charge virale ou test de 4ᵉ génération).",
      "Syndrome mononucléosique à CMV ou toxoplasmose (angine souvent absente).",
      "Hémopathie (lymphome, leucémie aiguë) si la fatigue, les adénopathies ou les anomalies de la formule persistent.",
    ],
    sources: [
      { label: "NICE CKS — Glandular fever (infectious mononucleosis)", url: "https://cks.nice.org.uk/topics/glandular-fever-infectious-mononucleosis/" },
      { label: "NICE NG84 (2018) — Sore throat (acute): antimicrobial prescribing", url: "https://www.nice.org.uk/guidance/ng84" },
    ],
    pathologySlugs: ["infection-vih"],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const mononucleoseInfectieuseDiagnoses: StationDiagnoses = {
  accepted: ["mononucleose"],
  differentials: [
    d("Angine streptococcique ou virale", "angine"),
    d("Primo-infection VIH", "primo-infection-vih"),
    d("Hépatite virale aiguë", "hepatite-aigue"),
    d("Hémopathie (lymphome, leucémie aiguë)", "lymphome", "leucemie-aigue"),
  ],
};
