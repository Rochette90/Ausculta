import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, LABS, ONSET, planReaction, presentationCriterion, SYNCOPE, treatmentsCriterion, VITALS } from "./shared.ts";

const STOOLS = ["selles", "noir", "goudron", "melena", "couleur", "caca", "aller a selle", "aller aux toilettes", "transit"];
const HEMATEMESIS = ["vomi", "vomissement", "rendu", "marc de cafe", "sang rouge", "cracher du sang", "crache du sang", "nausee"];
const ANEMIA = ["fatigu", "pale", "palpit", "coeur bat", "soif", "froid", "essouffl", "douleur thoracique", "poitrine"];
const NSAID = ["anti inflammatoire", "ibuprofene", "ains", "voltaren", "diclofenac", "brufen", "algifor", "irfen"];
const ANTITHROMBOTIC = ["aspirine", "aspegic", "anticoag", "sintrom", "xarelto", "eliquis", "lixiana", "clopidogrel", "plavix", "sang fluide", "fluidifi"];
const LIVER_ULCER = ["alcool", "boire", "boisson", "verre", "foie", "cirrhose", "hepatite", "ulcere", "helicobacter", "gastroscopie", "deja saigne"];
const PAIN = ["douleur", "mal au ventre", "ventre", "estomac", "brulure", "crampe", "aigreur"];

export const hemorragieDigestiveHaute: EcosScenario = {
  slug: "hemorragie-digestive-haute",
  version: 1,
  setting: "urgences",
  patient: { name: "M. Clerc", age: 64, sex: "M" },
  persona: "Patient pâle, un peu inquiet et fatigué, qui parle volontiers mais n’imagine pas que ses « pilules pour le dos » puissent être en cause. Il ne mentionne l’ibuprofène que si on lui demande ses médicaments ou ce qu’il a pris ces derniers temps.",
  brief: [
    "Vous êtes médecin assistant·e au service des urgences.",
    "M. Clerc, 64 ans, se présente aux urgences pour des selles noires et un malaise ce matin.",
    "Menez l’anamnèse, décrivez l’examen clinique et les examens utiles, posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. Depuis deux jours, mes selles sont toutes noires, et ce matin je suis tombé dans la salle de bains. Ma femme a eu très peur.",
  history: {
    identity: "Jean-Pierre Clerc, 64 ans.",
    occupation: "Je suis encore employé de commune, aux travaux publics, jusqu’à la retraite l’an prochain.",
    living: "Je vis avec ma femme dans un appartement, à Yverdon. Nos deux enfants sont grands.",
    feeling: "Je me sens faible, tout pâle, et j’ai la tête qui tourne quand je me lève.",
    previousEpisodes: "Non, je n’ai jamais eu de selles comme ça, ni de saignement.",
    course: "Avant-hier, des selles noires et collantes, puis encore trois fois depuis. Ce matin, en me levant, j’ai vu noir et je me suis retrouvé par terre.",
    otherSymptoms: "J’ai des brûlures à l’estomac depuis une dizaine de jours.",
    medications: "De l’aspirine cardio tous les jours depuis mon stent, de l’atorvastatine et du lisinopril pour la tension. Et de l’ibuprofène pour le dos depuis deux semaines.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Un petit infarctus il y a cinq ans, on m’a posé un stent. De la tension. Un lumbago depuis deux semaines.",
    familyHistory: "Mon père a eu un cancer de l’intestin à 75 ans.",
    tobacco: "J’ai arrêté de fumer après l’infarctus. Avant, un paquet par jour.",
    alcohol: "Un verre de vin au repas du soir, pas plus.",
    drugs: "Non.",
    concerns: "Est-ce que je saigne de l’intérieur ? J’ai peur que ce soit un cancer, comme mon père.",
  },
  rules: [
    { topic: "selles", keywords: STOOLS, reply: "Toutes noires, comme du goudron, collantes, et ça sent très fort. Quatre fois en deux jours. Pas de sang rouge." },
    { topic: "vomissements", keywords: HEMATEMESIS, reply: "Un peu de nausée ce matin, mais je n’ai pas vomi. Ni sang, ni rien de brun." },
    { topic: "malaise", keywords: SYNCOPE, reply: "Ce matin, je me suis levé pour aller aux toilettes, j’ai vu noir et je me suis retrouvé assis par terre. Ma femme dit que je n’ai pas répondu pendant quelques secondes. Depuis, j’ai la tête qui tourne dès que je me lève." },
    { topic: "blessure", keywords: ["blesse", "cogne", "la tete", "traumat", "fait mal en tombant"], reply: "Non, je ne me suis pas fait mal, je suis tombé assis." },
    { topic: "signes d’anémie", keywords: ANEMIA, reply: "Je suis très fatigué, j’ai soif et froid, et le cœur bat vite quand je marche. Pas de douleur dans la poitrine." },
    { topic: "douleur", keywords: PAIN, reply: "Des brûlures au creux de l’estomac depuis une dizaine de jours, surtout quand j’ai le ventre vide. Trois sur dix, pas plus." },
    { topic: "anti-inflammatoires", keywords: NSAID, reply: "Ah oui, pour le dos, le pharmacien m’a donné de l’ibuprofène : 400 mg trois fois par jour depuis deux semaines. Je ne pensais pas que ça comptait comme un médicament." },
    { topic: "antithrombotiques", keywords: ANTITHROMBOTIC, reply: "L’aspirine cardio, 100 mg tous les jours depuis le stent. Pas d’autre médicament pour fluidifier le sang." },
    { topic: "foie et alcool", keywords: LIVER_ULCER, reply: "Un verre de vin le soir, jamais plus. On ne m’a jamais parlé de problème de foie ni d’ulcère. Je n’ai jamais eu de gastroscopie." },
    { topic: "transit et poids", keywords: ["poids", "maigri", "appetit", "coloscopie", "constip", "diarrh"], reply: "L’appétit est bon, je n’ai pas maigri. Le transit était normal avant. On ne m’a jamais fait de coloscopie." },
    { topic: "début", keywords: ONSET, reply: "Les selles noires depuis avant-hier. Le malaise, c’était ce matin vers 7 heures." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 98/60 mmHg couché, FC 112/min régulière, FR 20/min, SpO₂ 97 % à l’air ambiant, T 36,4 °C. Glasgow 15. Patient pâle, extrémités fraîches, temps de recoloration 3 secondes, muqueuses pâles." },
    { topic: "abdomen", examiner: true, keywords: ["palp", "abdomen", "ventre", "j examine", "je vous examine", "examen clinique", "examen physique"], reply: "Abdomen souple, légère sensibilité épigastrique à la palpation profonde, pas de défense ni de contracture. Pas d’hépatosplénomégalie, pas de circulation veineuse collatérale, pas d’ascite, pas d’angiome stellaire." },
    { topic: "toucher rectal", examiner: true, keywords: ["toucher rectal", "tr$", "doigtier"], reply: "Toucher rectal : selles noires, goudronneuses et nauséabondes au doigtier (méléna). Pas de sang rouge, pas de masse palpable." },
    { topic: "bilan sanguin", examiner: true, keywords: [...LABS, "hemoglobine", "uree", "inr", "crase", "coagulation"], reply: "Hb 82 g/L (145 g/L il y a six mois), VGM 90 fL, plaquettes 260 G/L, leucocytes 9,8 G/L. Urée 16,5 mmol/L, créatinine 98 µmol/L, sodium 138 mmol/L, potassium 4,4 mmol/L. INR 1,0, aPTT normal." },
    { topic: "groupe sanguin", examiner: true, keywords: ["groupe", "rai$", "anticorps irregulier", "compatibilit", "test de compatibilite", "cross match"], reply: "Groupe sanguin A Rh positif, recherche d’anticorps irréguliers négative. Deux concentrés érythrocytaires réservés." },
    { topic: "score de Glasgow-Blatchford", examiner: true, keywords: ["blatchford", "glasgow blatchford", "score de risque", "rockall"], reply: "Score de Glasgow-Blatchford à 16 : urée 16,5 mmol/L (4), Hb 82 g/L chez un homme (6), TA systolique 98 mmHg (2), FC ≥ 100/min (1), méléna (1), syncope (2). Haut risque : hospitalisation, endoscopie dans les 24 heures après stabilisation." },
    { topic: "gastroscopie", examiner: true, keywords: ["gastroscop", "endoscop", "oesogastro", "fibroscop", "ogd$"], reply: "Gastroscopie à 14 heures, après remplissage et transfusion : ulcère de 12 mm de la face postérieure du bulbe duodénal, avec un vaisseau visible non hémorragique (Forrest IIa). Hémostase endoscopique combinée (injection d’adrénaline diluée et deux clips). Estomac et œsophage sans varices ni autre lésion. Biopsies antrales pour Helicobacter pylori." },
    planReaction("Il faut que je reste à l’hôpital ? Et l’aspirine, je dois l’arrêter ? Le cardiologue m’avait dit de ne jamais l’arrêter.", ["transfus", "perfusion", "ipp", "pantoprazole", "gastroscop", "endoscop", "aspirine", "ibuprofene"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales, état de conscience et perfusion périphérique", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes", "glasgow", "etat-general", "hydratation"], key: ["constantes"] },
    { id: "abdomen", label: "Examen du ventre et recherche de signes de maladie du foie", category: "examen", pertinent: true, topic: "abdomen", covers: ["palpation-abdominale", "signes-peritoneaux", "foie-rate", "ictere"], key: ["palpation-abdominale", "signes-peritoneaux", "foie-rate"] },
    { id: "toucher-rectal", label: "Toucher rectal", category: "examen", pertinent: true, topic: "toucher rectal", covers: ["toucher-rectal"] },
    { id: "bilan-sanguin", label: "Bilan sanguin (FSC, urée, créatinine, électrolytes, INR et aPTT)", category: "complementaire", pertinent: true, topic: "bilan sanguin", covers: ["fsc", "creatinine", "ionogramme", "crase"], key: ["fsc"] },
    { id: "groupe", label: "Groupe sanguin et recherche d’anticorps irréguliers", category: "complementaire", pertinent: true, topic: "groupe sanguin", covers: ["groupe"] },
    { id: "gastroscopie", label: "Gastroscopie", category: "complementaire", pertinent: true, topic: "gastroscopie", covers: ["gastroscopie"] },
    { id: "ct-abdominal", label: "CT abdominal injecté", category: "complementaire", pertinent: false, result: "Non indiqué en première intention : la gastroscopie est à la fois diagnostique et thérapeutique ; l’angio-CT se discute seulement si l’endoscopie ne trouve pas la source ou si le saignement ne peut être contrôlé.", covers: ["ct-abdominal"] },
    { id: "radio-abdomen", label: "Radiographie de l’abdomen sans préparation", category: "complementaire", pertinent: false, result: "Non contributive : elle ne montre pas une source de saignement et l’abdomen est souple, sans signe de perforation ni d’occlusion.", covers: ["radio-abdomen"] },
    { id: "lipase", label: "Lipase", category: "complementaire", pertinent: false, result: "Non indiquée : brûlures épigastriques modestes et abdomen souple, sans tableau de pancréatite ; le problème est le saignement.", covers: ["lipase"] },
  ],
  catalogResults: {
    "constantes": "TA 98/60 mmHg couché, FC 112/min régulière, FR 20/min, SpO₂ 97 % à l’air ambiant, T 36,4 °C.",
    "glasgow": "Glasgow 15.",
    "etat-general": "Patient pâle, conscient et orienté, extrémités fraîches, muqueuses conjonctivales pâles.",
    "hydratation": "Muqueuses sèches et pâles, temps de recoloration 3 secondes.",
    "fsc": "Hb 82 g/L (145 g/L il y a six mois), VGM 90 fL, plaquettes 260 G/L, leucocytes 9,8 G/L.",
    "creatinine": "Urée 16,5 mmol/L, créatinine 98 µmol/L : rapport urée/créatinine élevé, évocateur d’un saignement digestif haut.",
    "ionogramme": "Sodium 138 mmol/L, potassium 4,4 mmol/L.",
    "crase": "INR 1,0, aPTT normal.",
    "ecg": "Tachycardie sinusale à 112/min, axe normal, QRS fins, ondes Q en inférieur (séquelle connue), pas de sus- ni de sous-décalage du segment ST.",
    "troponine": "Troponine hs 9 ng/L, stable à 1 heure.",
    "lactate": "Lactate 2,6 mmol/L.",
    "gazometrie": "pH 7,36, pCO₂ 4,6 kPa, bicarbonates 20 mmol/L, lactate 2,6 mmol/L.",
    "auscultation-abdominale": "Bruits intestinaux présents, un peu augmentés.",
    "ferritine-b12": "Ferritine 140 µg/L, vitamine B12 et folates dans les normes : pas de carence ancienne.",
  },
  acceptable: ["ecg", "troponine", "lactate", "gazometrie", "tests-hepatiques", "auscultation-abdominale", "auscultation-cardiaque", "ferritine-b12", "radio-thorax"],
  diagnosisChoice: { correct: "Hémorragie digestive haute sur ulcère duodénal (AINS et aspirine)", distractors: ["Rupture de varices œsophagiennes", "Hémorragie digestive basse diverticulaire", "Syncope vasovagale"] },
  criteria: [
    presentationCriterion,
    {
      id: "bleeding",
      label: "Caractérise le saignement",
      hint: "Début, aspect et nombre des selles noires, vomissements de sang ou marc de café",
      points: 3,
      groups: [ONSET, STOOLS, HEMATEMESIS],
    },
    {
      id: "severity",
      label: "Recherche les signes de gravité",
      hint: "Malaise ou syncope, signes d’anémie ou d’hypovolémie, douleur thoracique (coronarien connu)",
      points: 2,
      groups: [SYNCOPE, ANEMIA],
    },
    {
      id: "terrain",
      label: "Cherche la cause et le terrain",
      hint: "AINS, antiagrégant ou anticoagulant, alcool, maladie du foie ou ulcère connus",
      points: 3,
      groups: [NSAID, ANTITHROMBOTIC, LIVER_ULCER],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen et examens ciblés",
      hint: "Constantes et perfusion, abdomen et signes d’hépatopathie, toucher rectal, hémoglobine, urée, crase, groupe et anticorps irréguliers, gastroscopie",
      points: 3,
      groups: [["toucher rectal", "doigtier"], ["hemoglobine", "fsc", "formule sanguine", "uree"], ["groupe", "gastroscop", "endoscop"]],
    },
    {
      id: "management",
      label: "Stabilise, évalue le risque et organise l’endoscopie",
      hint: "Deux voies veineuses, remplissage et transfusion (cible Hb 80–100 g/L chez un coronarien), IPP intraveineux, score de Glasgow-Blatchford et hospitalisation, gastroscopie dans les 24 heures, arrêt de l’ibuprofène",
      points: 5,
      groups: [
        ["voie veineuse", "voies veineuses", "perfusion", "remplissage", "cristalloide", "ringer", "nacl", "transfus", "culot", "concentre erythro"],
        ["ipp", "pantoprazole", "esomeprazole", "omeprazole", "pompe a protons", "proteger l estomac"],
        ["gastroscop", "endoscop", "camera"],
        ["blatchford", "score", "hospitalis", "soins continus", "soins intensifs", "surveillance"],
        ["arret", "arreter", "stop", "plus d ibuprofene", "plus d anti inflammatoire", "ne plus prendre"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Hémorragie digestive haute sur ulcère duodénal (Forrest IIa), favorisée par l’ibuprofène et l’aspirine, avec retentissement hémodynamique (Glasgow-Blatchford 16)",
    summary: "Homme de 64 ans, coronarien sous aspirine, qui prend de l’ibuprofène depuis deux semaines pour un lumbago sans protection gastrique. Méléna depuis deux jours, brûlures épigastriques et syncope ce matin. Tachycarde à 112/min, TA 98/60 mmHg, pâle ; méléna au toucher rectal ; Hb 82 g/L et urée élevée. Score de Glasgow-Blatchford 16 : réanimation (voies veineuses, remplissage, transfusion), IPP intraveineux, gastroscopie dans les 24 heures qui montre un ulcère bulbaire à vaisseau visible traité par voie endoscopique.",
    keyFindings: [
      "Méléna depuis deux jours, confirmé au toucher rectal, sans hématémèse.",
      "Syncope, tachycardie à 112/min, TA systolique 98 mmHg, pâleur et extrémités fraîches : hypovolémie.",
      "Hb 82 g/L (145 g/L six mois avant), urée 16,5 mmol/L avec créatinine normale.",
      "Ibuprofène 1 200 mg/j sans IPP associé à l’aspirine ; pas d’argument pour une hépatopathie.",
    ],
    redFlags: [
      "Instabilité hémodynamique (choc), hématémèse de sang rouge ou récidive du saignement : réanimation et endoscopie en urgence.",
      "Cirrhose ou signes d’hypertension portale : suspicion de varices (terlipressine, antibioprophylaxie, endoscopie dans les 12 heures).",
      "Douleur thoracique ou modification ECG chez un coronarien anémié : ischémie myocardique.",
      "Score de Glasgow-Blatchford > 1 : pas de prise en charge ambulatoire.",
    ],
    management: [
      "Deux voies veineuses de bon calibre, remplissage prudent par cristalloïdes, surveillance rapprochée (constantes, diurèse).",
      "Transfusion de concentrés érythrocytaires : seuil Hb 80 g/L et cible 100 g/L chez un coronarien (70 g/L chez un patient sans maladie cardiovasculaire).",
      "IPP intraveineux à haute dose (par exemple pantoprazole 80 mg en bolus puis 40 mg deux fois par jour, ou perfusion continue) ; érythromycine intraveineuse avant l’endoscopie selon le protocole local.",
      "Score de Glasgow-Blatchford (16) : hospitalisation, gastroscopie dans les 24 heures après stabilisation, avec hémostase endoscopique des lésions à haut risque.",
      "Arrêt définitif de l’ibuprofène ; aspirine en prévention secondaire : brève interruption puis reprise rapide (dans les jours qui suivent l’hémostase), en accord avec le cardiologue ; IPP au long cours ; recherche et éradication d’Helicobacter pylori.",
    ],
    differentials: [
      "Rupture de varices œsophagiennes (cirrhose, alcool, signes d’hypertension portale).",
      "Syndrome de Mallory-Weiss (hématémèse après vomissements répétés), œsophagite ou cancer gastrique.",
      "Hémorragie digestive basse à transit rapide (diverticule, angiodysplasie, cancer colorectal) : sang rouge ou rouge foncé plutôt que méléna.",
      "Syncope d’une autre cause (réflexe, arythmie) : l’anémie et le méléna orientent vers le saignement.",
    ],
    sources: [
      { label: "ESGE 2021 — Endoscopic diagnosis and management of nonvariceal upper gastrointestinal hemorrhage", url: "https://doi.org/10.1055/a-1496-8969" },
      { label: "NICE CG141 — Acute upper gastrointestinal bleeding in over 16s: management", url: "https://www.nice.org.uk/guidance/cg141" },
    ],
    pathologySlugs: ["hemorragie-digestive", "ulcere-gastroduodenal", "transfusion-produits-sanguins", "etat-de-choc-approche"],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const hemorragieDigestiveHauteDiagnoses: StationDiagnoses = {
  accepted: ["hemorragie-digestive-haute"],
  differentials: [
    d("Rupture de varices œsophagiennes sur cirrhose", "cirrhose-decompensee"),
    d("Hémorragie digestive basse (cancer colorectal)", "cancer-colorectal"),
    d("Ulcère perforé", "ulcere-perfore"),
    d("Syncope d’une autre cause", "syncope-vasovagale", "hypotension-orthostatique"),
  ],
};
