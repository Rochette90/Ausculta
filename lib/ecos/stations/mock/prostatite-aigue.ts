import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { communicationCriterion, FEVER, INTENSITY, LOCATION, NAUSEA, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "../shared.ts";

const URINARY = ["brul", "uriner", "urine", "pipi", "souvent", "frequen", "envie pressante", "jet$", "pousser", "goutte", "la nuit"];
const PAIN = [...LOCATION, "ou avez vous mal", "douleur", "mal$", "bas ventre", "perine", "entre les jambes", "anus", "assis"];
const URINE_ASPECT = ["sang", "trouble", "odeur", "couleur", "rouge", "aspect"];
const BACK = ["dos$", "reins", "rein$", "flanc"];
const GENITAL = ["testicul", "bourse", "ecoulement", "penis", "verge", "rapport", "sexu", "partenaire"];
const GENERAL = [...NAUSEA, "malaise", "confus", "tete qui tourne", "vertige"];
const RETENTION = ["bloque", "n arrive plus", "plus uriner", "retention", "vider", "vide$", "rien ne sort"];

export const prostatiteAigue: EcosScenario = {
  slug: "prostatite-aigue",
  version: 1,
  setting: "cabinet",
  patient: { name: "M. Bovet", age: 56, sex: "M" },
  painful: true,
  persona: "Homme de 56 ans, fiévreux et courbaturé, calme et coopératif. Un peu gêné de parler de la sphère urinaire et du toucher rectal, mais il répond simplement quand on lui explique pourquoi.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "M. Bovet, 56 ans, consulte au cabinet pour de la fièvre et des brûlures en urinant depuis deux jours.",
    "Menez l’anamnèse, réalisez l’examen clinique et les examens utiles, puis proposez une hypothèse diagnostique et la suite.",
  ],
  opening: "Bonjour docteur. Depuis deux jours, ça me brûle quand j’urine, et cette nuit j’ai eu de la fièvre avec de grands frissons.",
  history: {
    identity: "Jean-Marc Bovet, 56 ans.",
    occupation: "Je suis menuisier, j’ai ma petite entreprise à Yverdon.",
    living: "Je vis avec ma femme. Nos deux enfants sont grands et ont quitté la maison.",
    feeling: "Je suis patraque, j’ai mal partout comme avec une grippe.",
    previousEpisodes: "Non, je n’ai jamais eu d’infection urinaire.",
    course: "D’abord les brûlures avant-hier, puis j’y suis allé de plus en plus souvent, et la fièvre est montée hier soir.",
    otherSymptoms: "J’ai mal entre les jambes, vers l’anus, surtout quand je m’assieds.",
    medications: "Un comprimé pour la tension le matin, de l’amlodipine 5 mg. Et du paracétamol depuis hier soir.",
    allergies: "Aucune allergie connue.",
    personalHistory: "De la tension depuis cinq ans, bien contrôlée. Jamais opéré. Depuis un an, je me lève une fois par nuit pour uriner.",
    familyHistory: "Mon père a eu un cancer de la prostate vers 75 ans. Ma mère était diabétique.",
    tobacco: "J’ai fumé un paquet par jour pendant vingt ans ; j’ai arrêté il y a dix ans.",
    alcohol: "Un ou deux verres de vin au repas du soir.",
    drugs: "Non, jamais.",
    concerns: "Mon père a eu un cancer de la prostate : est-ce que ça pourrait être ça ?",
  },
  rules: [
    { topic: "signes urinaires", keywords: URINARY, reply: "Ça brûle quand j’urine, j’y vais presque toutes les heures, même la nuit, et ça sort mal : le jet est faible, je dois pousser." },
    { topic: "douleur", keywords: [...LOCATION, "ou avez vous mal", "bas ventre", "ventre", "perine", "entre les jambes", "anus", "assis"], reply: "J’ai mal entre les jambes, vers l’anus, et un peu dans le bas du ventre. Ça me gêne pour m’asseoir." },
    { topic: "intensité", keywords: INTENSITY, reply: "Six sur dix, plus quand je m’assieds ou quand j’urine." },
    { topic: "fièvre", keywords: FEVER, reply: "39,2 °C hier soir, avec de grands frissons à claquer des dents. Et des courbatures partout." },
    { topic: "aspect des urines", keywords: URINE_ASPECT, reply: "Les urines sont troubles et sentent fort. Je n’ai pas vu de sang." },
    { topic: "dos", keywords: [...BACK, "lombes"], reply: "Non, je n’ai pas mal dans le dos." },
    { topic: "organes génitaux", keywords: ["testicul", "bourse", "ecoulement", "penis", "verge"], reply: "Non, rien aux testicules, pas d’écoulement par la verge." },
    { topic: "sexualité", keywords: ["rapport", "sexu", "partenaire", "preservatif"], reply: "Je suis marié depuis trente ans, je n’ai pas d’autre partenaire." },
    { topic: "rétention", keywords: RETENTION, reply: "J’arrive encore à uriner, mais peu à la fois, et j’ai l’impression de ne jamais bien vider." },
    { topic: "état général", keywords: GENERAL, reply: "Un peu mal au cœur hier soir, mais je n’ai pas vomi. Pas de malaise, j’ai les idées claires. Je bois bien." },
    { topic: "infections antérieures", keywords: ["infection urinaire", "deja eu", "cystite", "premiere fois"], reply: "Non, c’est la première fois que j’ai ce genre de problème en urinant." },
    { topic: "gestes urologiques", keywords: ["sonde", "biopsie", "intervention", "cystoscop", "camera"], reply: "Non, je n’ai jamais eu de sonde ni d’examen de ce genre." },
    { topic: "prostate", keywords: ["prostate", "psa$"], reply: "On ne m’a jamais rien dit sur ma prostate. Je n’ai jamais fait de contrôle." },
    { topic: "début", keywords: ONSET, reply: "Les brûlures ont commencé avant-hier, la fièvre hier soir." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 38,9 °C, FC 102/min, TA 132/80 mmHg, FR 18/min, SpO₂ 97 %. Patient fatigué, frissonnant, parfaitement orienté." },
    { topic: "toucher rectal", examiner: true, keywords: ["toucher rectal", "tr$", "palper la prostate", "examen de la prostate", "examiner la prostate", "doigt"], reply: "Prostate augmentée de volume, chaude, tendue et très douloureuse au toucher, réalisé doucement (pas de massage). Pas de sang au doigtier." },
    { topic: "abdomen", examiner: true, keywords: ["palp", "abdomen", "globe", "examen clinique", "examen physique", "je vous examine"], reply: "Abdomen souple, sensibilité sus-pubienne modérée, pas de globe vésical, pas de défense." },
    { topic: "ébranlement lombaire", examiner: true, keywords: ["ebranlement", "giordano", "fosses lombaires", "percussion lombaire", "tapote"], reply: "Ébranlement des fosses lombaires indolore des deux côtés." },
    { topic: "organes génitaux à l’examen", examiner: true, keywords: ["organes genitaux", "examen des testicules", "palpation des testicules", "palper les testicules", "scrotum", "epididym", "oge$"], reply: "Testicules et épididymes souples et indolores, pas d’écoulement urétral, orifices herniaires libres." },
    { topic: "bandelette urinaire", examiner: true, keywords: ["bandelette", "stix", "analyse d urine", "sediment"], reply: "Bandelette urinaire : leucocytes +++, nitrites positifs, sang +." },
    { topic: "culture urinaire", examiner: true, keywords: ["culture", "uroculture", "antibiogramme", "ecbu"], reply: "Urine du milieu de jet envoyée en culture avec antibiogramme ; résultat dans 48 heures." },
    planReaction("D’accord. Je peux rentrer chez moi ? Et je dois prendre les antibiotiques combien de temps ?", ["ciprofloxacine", "quinolone", "antibio", "a domicile", "a la maison", "semaines", "controle"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "toucher-rectal", label: "Toucher rectal", category: "examen", pertinent: true, topic: "toucher rectal" },
    { id: "abdomen", label: "Palpation abdominale et recherche d’un globe vésical", category: "examen", pertinent: true, topic: "abdomen", covers: ["palpation-abdominale"] },
    { id: "ebranlement", label: "Ébranlement des fosses lombaires", category: "examen", pertinent: true, topic: "ébranlement lombaire", covers: ["ebranlement-lombaire"] },
    { id: "oge", label: "Organes génitaux externes", category: "examen", pertinent: true, topic: "organes génitaux à l’examen", covers: ["oge"] },
    { id: "bandelette", label: "Bandelette urinaire", category: "complementaire", pertinent: true, topic: "bandelette urinaire" },
    { id: "culture", label: "Culture urinaire avec antibiogramme", category: "complementaire", pertinent: true, topic: "culture urinaire", covers: ["culture-urinaire"] },
    { id: "ct-abdominal", label: "CT abdominal injecté", category: "complementaire", pertinent: false, result: "Non indiqué d’emblée : à discuter seulement si la fièvre persiste après 72 h de traitement (recherche d’un abcès prostatique)." },
    { id: "ct-low-dose", label: "CT abdominal low-dose sans injection", category: "complementaire", pertinent: false, result: "Non indiqué : pas de douleur lombaire ni de colique évoquant un calcul." },
    { id: "radio-abdomen", label: "Radiographie de l’abdomen sans préparation", category: "complementaire", pertinent: false, result: "Non indiquée : elle n’apporte rien dans une infection urinaire fébrile." },
    { id: "signes-meninges", label: "Signes méningés (raideur de nuque, Kernig, Brudzinski)", category: "examen", pertinent: false, result: "Négatifs. Geste peu utile ici : pas de céphalée, patient bien orienté, foyer urinaire évident." },
  ],
  catalogResults: {
    "etat-general": "Patient fatigué et frissonnant, conscience normale, bien coloré, pas de marbrures.",
    "fsc": "Leucocytes 15,8 G/L, neutrophiles 86 %. Hémoglobine 148 g/L, thrombocytes 230 G/L.",
    "crp": "CRP 145 mg/L.",
    "procalcitonine": "Procalcitonine 0,8 µg/L.",
    "creatinine": "Créatinine 94 µmol/L, urée 6,8 mmol/L.",
    "echo-abdominale": "Reins non dilatés, vessie à paroi régulière, résidu post-mictionnel de 60 mL. Prostate augmentée de volume, sans collection visible.",
  },
  acceptable: ["fsc", "crp", "procalcitonine", "creatinine", "hemocultures", "echo-abdominale", "orifices-herniaires", "auscultation-cardiaque", "auscultation-pulmonaire"],
  diagnosisChoice: { correct: "Prostatite aiguë bactérienne", distractors: ["Pyélonéphrite aiguë", "Orchi-épididymite", "Cystite aiguë"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Caractérise le tableau",
      hint: "Début, signes urinaires (brûlures, fréquence, jet), fièvre et frissons, localisation de la douleur",
      points: 4,
      groups: [ONSET, URINARY, FEVER, PAIN],
    },
    {
      id: "associated",
      label: "Recherche les signes associés et les diagnostics à exclure",
      hint: "Aspect des urines, douleur lombaire (pyélonéphrite), testicules, écoulement et partenaires (orchi-épididymite, IST)",
      points: 3,
      groups: [URINE_ASPECT, BACK, GENITAL],
    },
    {
      id: "severity",
      label: "Recherche les signes de gravité",
      hint: "Nausées, vomissements, malaise ou confusion (sepsis) ; impossibilité d’uriner (rétention)",
      points: 2,
      groups: [GENERAL, RETENTION],
    },
    {
      id: "terrain",
      label: "Évalue le terrain et les habitudes",
      hint: "Infections urinaires ou gestes urologiques antérieurs, antécédents personnels et familiaux, tabac et alcool",
      points: 3,
      groups: [
        ["deja eu", "infection urinaire", "premiere fois", "avant$", "sonde", "biopsie", "intervention", "opere"],
        ["antecedent", "maladie", "probleme de sante", "prostate", "diabet", "famille", "pere$", "parents"],
        ["tabac", "fume", "cigarette", "alcool", "vin$", "biere"],
      ],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes, toucher rectal doux, palpation abdominale (globe), ébranlement lombaire, organes génitaux externes ; bandelette et culture urinaire",
      points: 5,
      groups: [["examen clinique", "status", "j examine", "je vous examine"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Prostatite aiguë bactérienne (infection urinaire fébrile de l’homme)",
    summary: "Homme de 56 ans avec brûlures mictionnelles, pollakiurie et dysurie depuis deux jours, puis fièvre à 39 °C avec frissons et douleur périnéale. Le toucher rectal trouve une prostate augmentée de volume, chaude et très douloureuse ; l’ébranlement lombaire et les organes génitaux sont normaux. Bandelette leucocytes et nitrites positifs. Sans signe de sepsis grave ni rétention, la prise en charge peut être ambulatoire après culture urinaire, avec une antibiothérapie prolongée à bonne diffusion prostatique.",
    keyFindings: [
      "Signes urinaires bas (brûlures, pollakiurie, dysurie, jet faible) suivis de fièvre et frissons.",
      "Douleur périnéale ; prostate augmentée de volume, chaude et très douloureuse au toucher rectal.",
      "Ébranlement lombaire indolore, testicules et épididymes normaux.",
      "Bandelette leucocytes et nitrites positifs ; pas de sepsis, pas de globe vésical.",
    ],
    redFlags: [
      "Hypotension, confusion, polypnée ou marbrures : sepsis, hospitalisation et antibiotique intraveineux.",
      "Rétention aiguë d’urine : drainage, de préférence par cathéter sus-pubien.",
      "Fièvre persistante après 72 h de traitement adapté : imagerie à la recherche d’un abcès prostatique.",
      "Immunosuppression, diabète déséquilibré ou geste urologique récent : prise en charge plus prudente.",
    ],
    management: [
      "Culture urinaire avec antibiogramme avant l’antibiotique ; hémocultures selon la gravité ; toucher rectal doux, jamais de massage prostatique.",
      "Antibiotique à bonne diffusion prostatique, par exemple ciprofloxacine 500 mg 2×/j per os, à adapter à l’antibiogramme et aux résistances locales ; durée de 2 à 4 semaines selon les recommandations et l’évolution.",
      "Traitement ambulatoire si l’état général le permet ; antipyrétique, bonne hydratation.",
      "Réévaluation clinique à 48–72 h ; échographie (résidu, abcès) si rétention ou évolution défavorable.",
      "Pas de dosage du PSA pendant l’épisode aigu (faussement élevé) ; bilan prostatique à distance si indiqué.",
    ],
    differentials: [
      "Pyélonéphrite aiguë (douleur lombaire, ébranlement positif).",
      "Orchi-épididymite (douleur et tuméfaction scrotales ; IST chez l’homme jeune).",
      "Cystite (sans fièvre ; rare et à considérer comme prostatite chez l’homme dès qu’il y a fièvre).",
      "Rétention aiguë d’urine sur hypertrophie de la prostate.",
    ],
    sources: [
      { label: "EAU Guidelines — Urological infections", url: "https://uroweb.org/guidelines/urological-infections" },
      { label: "NICE NG110 (2018) — Prostatitis (acute): antimicrobial prescribing", url: "https://www.nice.org.uk/guidance/ng110" },
    ],
    pathologySlugs: ["prostatite-aigue", "hypertrophie-benigne-prostate", "antibiotherapie-principes"],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const prostatiteAigueDiagnoses: StationDiagnoses = {
  accepted: ["prostatite"],
  differentials: [
    d("Pyélonéphrite aiguë", "pyelonephrite-aigue"),
    d("Orchi-épididymite", "orchi-epididymite"),
    d("Cystite", "cystite"),
    d("Rétention aiguë d’urine", "retention-urinaire"),
  ],
};
