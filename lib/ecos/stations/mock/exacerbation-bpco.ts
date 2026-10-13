import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { communicationCriterion, DYSPNEA, FEVER, LABS, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "../shared.ts";

const BREATHLESSNESS = [...DYSPNEA, "effort", "escalier", "marche", "etage", "au repos"];
const SPUTUM = ["crach", "expector", "glaire", "mucos", "secretion"];
const SPUTUM_ASPECT = ["couleur", "vert", "jaune", "purulen", "aspect", "quantite", "plus que d habitude", "epais"];
const CHEST_PAIN = ["poitrine", "douleur thoracique", "mal au thorax", "douleur", "serre", "oppress"];
const HEART_FAILURE = ["chevill", "gonfl", "enfl", "jambe", "mollet", "pieds"];
const PAST_EXACERBATIONS = ["deja eu", "crise", "exacerbation", "hospitalis", "l hiver dernier", "combien de fois", "par an", "cortison", "deja arrive", "auparavant"];
const INHALERS = ["inhal", "pompe", "spray", "aerosol", "ventoline", "spiriva", "technique", "dispositif", "puff"];
const VACCINES = ["vaccin", "pneumocoque"];
const TOBACCO = ["fume", "fumez", "fumeur", "tabac", "cigarette", "paquet"];

export const exacerbationBpco: EcosScenario = {
  slug: "exacerbation-bpco",
  version: 1,
  setting: "cabinet",
  patient: { name: "M. Chappuis", age: 66, sex: "M" },
  persona: "Retraité bourru mais coopératif, qui tousse souvent pendant l’entretien et parle par phrases un peu courtes à cause de l’essoufflement. Il minimise sa consommation de tabac au début mais répond honnêtement si on insiste.",
  brief: [
    "Vous êtes médecin assistant·e dans un cabinet de médecine de famille.",
    "M. Chappuis, 66 ans, consulte au cabinet pour une toux qui s’aggrave et un essoufflement depuis quelques jours.",
    "Menez l’anamnèse, réalisez le status et les examens utiles, puis donnez votre hypothèse diagnostique et la suite.",
  ],
  opening: "Bonjour docteur. Depuis trois jours, je tousse et je crache encore plus que d’habitude, et je suis vite à bout de souffle.",
  history: {
    identity: "Gérard Chappuis, 66 ans.",
    occupation: "Je suis retraité. J’étais mécanicien sur poids lourds pendant quarante ans.",
    living: "Je vis avec ma femme dans une maison à Bulle. On se débrouille bien tous les deux.",
    feeling: "Pas terrible. Je suis fatigué et je n’arrive plus à faire grand-chose.",
    previousEpisodes: "L’hiver dernier, j’ai eu la même chose : le médecin m’avait donné des antibiotiques et de la cortisone pendant cinq jours. Jamais hospitalisé.",
    course: "Ça a commencé par un rhume il y a cinq jours, puis depuis trois jours le souffle et les crachats empirent chaque jour.",
    otherSymptoms: "Ça siffle dans ma poitrine, surtout la nuit.",
    medications: "Le Spiriva, une inhalation tous les matins, et la Ventoline quand je manque d’air. Et un comprimé pour la tension, l’amlodipine.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "On m’a dit que j’avais une BPCO il y a quatre ans, après un test du souffle. J’ai aussi de la tension. Sinon, une opération de la hernie il y a longtemps.",
    familyHistory: "Mon père est mort d’un cancer du poumon, il fumait beaucoup. Ma mère avait du diabète.",
    tobacco: "Je fume encore, un paquet par jour depuis l’âge de 18 ans. J’ai essayé d’arrêter deux fois.",
    alcohol: "Un verre de vin au repas, parfois deux.",
    drugs: "Non, jamais.",
    concerns: "J’ai peur que ce soit une pneumonie ou qu’on doive m’hospitaliser.",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Il y a cinq jours, j’ai attrapé un rhume. Depuis trois jours, je suis de plus en plus essoufflé et je crache beaucoup plus." },
    { topic: "essoufflement", keywords: BREATHLESSNESS, reply: "D’habitude je monte mon étage tranquillement. Là, je dois m’arrêter au milieu de l’escalier. Assis sans bouger, ça va à peu près." },
    { topic: "crachats", keywords: SPUTUM, reply: "Je crache tous les matins depuis des années, mais là c’est beaucoup plus, toute la journée." },
    { topic: "aspect des crachats", keywords: [...SPUTUM_ASPECT, "du sang", "hemopty"], reply: "C’est devenu vert-jaune et épais, alors que d’habitude c’est blanc. Pas de sang." },
    { topic: "toux", keywords: ["toux", "tousse"], reply: "Je tousse beaucoup plus qu’avant, surtout la nuit et le matin." },
    { topic: "sifflements", keywords: ["siffl", "bruit quand", "bruit en respirant"], reply: "Oui, ça siffle dans la poitrine, surtout la nuit et le matin." },
    { topic: "fièvre", keywords: FEVER, reply: "Hier soir j’avais 38,2 °C, avec un peu de frissons." },
    { topic: "douleur thoracique", keywords: CHEST_PAIN, reply: "Pas de vraie douleur. Juste les côtes un peu endolories à force de tousser. Rien qui serre." },
    { topic: "œdèmes", keywords: HEART_FAILURE, reply: "Non, mes jambes ne sont pas gonflées, mes chaussures vont comme d’habitude." },
    { topic: "décubitus", keywords: ["oreiller", "dormir", "allong", "couch", "a plat"], reply: "Je dors mal à cause de la toux, mais je peux m’allonger à plat, ce n’est pas ça qui me gêne." },
    { topic: "état général", keywords: ["poids", "maigri", "appetit", "sueur", "manger"], reply: "Je mange un peu moins depuis trois jours, mais je n’ai pas maigri ces derniers mois. Pas de sueurs la nuit." },
    { topic: "exacerbations antérieures", keywords: PAST_EXACERBATIONS, reply: "L’hiver dernier, une fois, la même chose : antibiotiques et cortisone pendant cinq jours chez mon médecin. Jamais hospitalisé, jamais d’oxygène." },
    { topic: "inhalateurs", keywords: INHALERS, reply: "Le Spiriva tous les matins, je ne l’oublie pas. La Ventoline d’habitude deux fois par semaine ; là, je la prends six ou huit fois par jour et ça m’aide moins." },
    { topic: "vaccins", keywords: VACCINES, reply: "Je n’ai pas fait le vaccin de la grippe cette année. Pour le pneumocoque, je ne sais plus, je ne crois pas." },
    { topic: "oxygène", keywords: ["oxygene", "bouteille"], reply: "Non, je n’ai pas d’oxygène à la maison." },
    { topic: "exposition", keywords: ["exposition", "expose", "poussiere", "garage", "produits", "fumees"], reply: "Au garage, il y avait les gaz d’échappement et les solvants, sans masque à l’époque." },
    { topic: "entourage", keywords: ["entourage malade", "contage", "autour de vous", "votre femme", "petits enfants"], reply: "Mes petits-enfants étaient enrhumés la semaine passée, je les ai gardés." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 38,0 °C, FC 98/min, TA 142/84 mmHg, FR 22/min, SpO₂ 91 % à l’air ambiant (94 % habituellement selon le dossier). Patient conscient, orienté, parle par phrases complètes." },
    { topic: "auscultation pulmonaire", examiner: true, keywords: ["auscultation pulmonaire", "ausculte les poumons", "ausculter les poumons", "murmure", "sibilance", "rale", "ronchi"], reply: "Murmure vésiculaire diminué de façon diffuse et symétrique, expiration prolongée, sibilances expiratoires diffuses et ronchi aux deux bases, qui se modifient à la toux. Pas de crépitants localisés ni de souffle tubaire." },
    { topic: "percussion", examiner: true, keywords: ["percussion", "percute", "vibrations vocales", "distension"], reply: "Thorax distendu en tonneau, hypersonorité diffuse et symétrique, vibrations vocales diminuées symétriquement. Pas de matité." },
    { topic: "signes de lutte", examiner: true, keywords: ["tirage", "signes de lutte", "levres pincees", "cyanose", "muscles accessoires"], reply: "Expiration à lèvres pincées, léger tirage sus-claviculaire, pas de respiration paradoxale. Pas de cyanose, pas de confusion." },
    { topic: "signes droits", examiner: true, keywords: ["oedeme", "jugulaire", "reflux hepato"], reply: "Pas d’œdème des membres inférieurs, pas de turgescence jugulaire, reflux hépato-jugulaire négatif." },
    { topic: "radiographie", examiner: true, keywords: ["radio", "radiographie", "cliche"], reply: "Radiographie du thorax : poumons distendus, coupoles aplaties, épaississements bronchiques. Pas de foyer de condensation, pas d’épanchement, pas de pneumothorax. Silhouette cardiaque normale." },
    { topic: "bilan sanguin", examiner: true, keywords: LABS, reply: "Leucocytes 12,4 G/L, CRP 38 mg/L, créatinine 88 µmol/L, kaliémie 4,1 mmol/L." },
    planReaction("Je peux rester chez moi ? Ma femme peut s’occuper de moi. C’est encore la cortisone et les antibiotiques ?", ["antibio", "cortison", "prednison", "ventoline", "salbutamol", "a la maison", "48", "72"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "auscultation-pulmonaire", label: "Auscultation pulmonaire", category: "examen", pertinent: true, topic: "auscultation pulmonaire" },
    { id: "percussion-thoracique", label: "Percussion et vibrations vocales", category: "examen", pertinent: true, topic: "percussion" },
    { id: "signes-lutte", label: "Signes de lutte respiratoire et cyanose", category: "examen", pertinent: true, topic: "signes de lutte", covers: ["signes-lutte"] },
    { id: "signes-droits", label: "Œdèmes des membres inférieurs et jugulaires", category: "examen", pertinent: true, topic: "signes droits", covers: ["oedemes", "jugulaires"] },
    { id: "radio-thorax", label: "Radiographie du thorax", category: "complementaire", pertinent: true, topic: "radiographie", image: { src: "/ecos/imagerie/blanc-02-radio-thorax.jpg", alt: "Radiographie du thorax de face", credit: { author: "O’Dea", license: "CC BY-SA 3.0" } } },
    { id: "bilan-sanguin", label: "Bilan sanguin (FSC, CRP, créatinine)", category: "complementaire", pertinent: true, topic: "bilan sanguin", covers: ["fsc", "crp", "creatinine"], key: ["fsc", "crp"] },
    { id: "spirometrie", label: "Spirométrie", category: "complementaire", pertinent: false, result: "Non indiquée pendant une exacerbation : à réaliser à distance, en phase stable." },
    { id: "ct-thoracique", label: "Angio-CT thoracique", category: "complementaire", pertinent: false, result: "Non indiqué : tableau typique d’exacerbation infectieuse, sans douleur pleurétique ni signe de thrombose ; la radiographie suffit.", covers: ["ct-thoracique"] },
    { id: "d-dimeres", label: "D-dimères", category: "complementaire", pertinent: false, result: "Non indiqués : pas de suspicion clinique d’embolie pulmonaire, et souvent élevés en contexte infectieux." },
    { id: "palpation-abdominale", label: "Palpation abdominale", category: "examen", pertinent: false, result: "Abdomen souple et indolore ; n’apporte rien ici." },
  ],
  catalogResults: {
    "etat-general": "Patient conscient et orienté, parle par phrases complètes, toux grasse fréquente, expiration à lèvres pincées ; pas de cyanose ni de marbrures.",
    "auscultation-cardiaque": "Bruits du cœur réguliers, un peu assourdis par la distension thoracique, sans souffle.",
    "fsc": "Leucocytes 12,4 G/L (neutrophiles 9,8 G/L), hémoglobine 158 g/L, plaquettes 290 G/L.",
    "crp": "CRP 38 mg/L.",
    "creatinine": "Créatinine 88 µmol/L, urée normale.",
    "gazometrie": "Gazométrie artérielle à l’air ambiant : pH 7,38, pCO₂ 6,3 kPa, pO₂ 8,0 kPa, bicarbonates 28 mmol/L : hypoxémie modérée, hypercapnie compensée (chronique).",
    "dep": "DEP 190 L/min, difficile à interpréter sans valeur de référence personnelle.",
    "ecg": "Tachycardie sinusale à 98/min, axe normal, pas de trouble de la repolarisation.",
    "procalcitonine": "Procalcitonine 0,18 µg/L.",
    "d-dimeres": "D-dimères 0,9 mg/L, peu spécifiques dans un contexte infectieux.",
  },
  acceptable: ["auscultation-cardiaque", "gazometrie", "dep", "ecg", "nt-probnp", "trachee", "mollets", "examen-orl", "crb65", "procalcitonine", "antigenes-urinaires", "ionogramme"],
  diagnosisChoice: { correct: "Exacerbation de BPCO d’origine infectieuse", distractors: ["Pneumonie communautaire", "Insuffisance cardiaque décompensée", "Embolie pulmonaire"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Caractérise l’aggravation",
      hint: "Début et déclencheur, essoufflement (effort, repos), quantité et aspect des crachats (critères d’Anthonisen)",
      points: 4,
      groups: [ONSET, BREATHLESSNESS, SPUTUM, SPUTUM_ASPECT],
    },
    {
      id: "alarm",
      label: "Recherche signes associés et diagnostics à exclure",
      hint: "Fièvre, douleur thoracique, jambes gonflées (insuffisance cardiaque, thrombose)",
      points: 3,
      groups: [FEVER, CHEST_PAIN, HEART_FAILURE],
    },
    {
      id: "disease",
      label: "Évalue la BPCO connue",
      hint: "Exacerbations et hospitalisations antérieures, utilisation des inhalateurs, vaccinations",
      points: 3,
      groups: [PAST_EXACERBATIONS, INHALERS, VACCINES],
    },
    {
      id: "habits",
      label: "Évalue le tabagisme",
      hint: "Tabagisme actif, quantité (paquets-années)",
      points: 1,
      groups: [TOBACCO],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes avec saturation, auscultation et percussion pulmonaires, signes de lutte, œdèmes et jugulaires, radiographie du thorax, FSC et CRP",
      points: 5,
      groups: [["j examine le patient"]],
    },
    {
      id: "management",
      label: "Propose une suite simple",
      hint: "Bronchodilatateur, corticoïde oral et antibiotique ; contrôle à 48–72 h avec consignes de reconsultation",
      points: 1,
      groups: [["antibio", "cortison", "corticoide", "prednison", "bronchodilat", "salbutamol", "ventoline", "controle", "revoir", "revenir", "reconsult", "48", "72"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Exacerbation modérée de BPCO, d’origine infectieuse probable",
    summary: "Homme de 66 ans, fumeur actif (environ 48 paquets-années), BPCO connue sous tiotropium, qui présente après une infection des voies respiratoires hautes une majoration de l’essoufflement, du volume et de la purulence des crachats (trois critères d’Anthonisen), avec fébricule. Sibilances diffuses, distension, SpO₂ 91 % sans signe de gravité, radiographie sans foyer : exacerbation infectieuse de BPCO, traitable en ambulatoire sous surveillance rapprochée.",
    keyFindings: [
      "BPCO connue, tabagisme actif d’environ 48 paquets-années, une exacerbation l’hiver précédent.",
      "Majoration de l’essoufflement, du volume et de la purulence des crachats après un rhume (Anthonisen type 1).",
      "Sibilances et ronchi diffus, expiration prolongée, distension thoracique ; pas de crépitant localisé ni d’œdème.",
      "SpO₂ 91 % (94 % habituellement), FR 22/min, phrases complètes ; radiographie sans foyer, CRP 38 mg/L.",
    ],
    redFlags: [
      "Dyspnée de repos, FR > 25–30/min, tirage marqué, respiration paradoxale, cyanose : hospitalisation.",
      "SpO₂ < 88 % malgré l’oxygène, confusion ou somnolence (hypercapnie, acidose respiratoire) : urgences.",
      "Foyer radiologique (pneumonie), pneumothorax, insuffisance cardiaque ou embolie pulmonaire associés.",
      "Échec du traitement ambulatoire, comorbidités lourdes, isolement social.",
    ],
    management: [
      "Bronchodilatateurs de courte durée d’action à dose augmentée (salbutamol ± ipratropium), en vérifiant la technique d’inhalation.",
      "Prednisone 40 mg/j pendant 5 jours.",
      "Antibiotique devant la purulence des crachats : par exemple amoxicilline-clavulanate 1 g 2×/j pendant 5 jours (doxycycline ou clarithromycine si allergie), selon les recommandations locales.",
      "Contrôle clinique à 48–72 h avec consignes de reconsultation ; à distance : arrêt du tabac, vaccinations grippe, pneumocoque et COVID-19, réadaptation respiratoire, spirométrie en phase stable et réévaluation du traitement de fond.",
    ],
    differentials: [
      "Pneumonie communautaire (crépitants localisés, foyer radiologique).",
      "Insuffisance cardiaque décompensée (orthopnée, œdèmes, turgescence jugulaire, NT-proBNP).",
      "Embolie pulmonaire (douleur pleurétique, hypoxémie disproportionnée, facteurs de risque).",
      "Pneumothorax, cancer bronchique (hémoptysie, amaigrissement).",
    ],
    sources: [
      { label: "GOLD — Global Strategy for Prevention, Diagnosis and Management of COPD (rapport annuel)", url: "https://goldcopd.org/" },
      { label: "NICE NG114 — Chronic obstructive pulmonary disease (acute exacerbation): antimicrobial prescribing", url: "https://www.nice.org.uk/guidance/ng114" },
      { label: "NICE NG115 — Chronic obstructive pulmonary disease in over 16s: diagnosis and management", url: "https://www.nice.org.uk/guidance/ng115" },
    ],
    pathologySlugs: ["bpco", "exacerbation-asthme-bpco"],
  },
};

export const exacerbationBpcoDiagnoses: StationDiagnoses = {
  accepted: ["exacerbation-bpco"],
  differentials: [
    { label: "Pneumonie communautaire", ids: ["pneumonie-communautaire"] },
    { label: "Insuffisance cardiaque décompensée", ids: ["insuffisance-cardiaque-decompensee"] },
    { label: "Embolie pulmonaire", ids: ["embolie-pulmonaire"] },
    { label: "Pneumothorax ou cancer bronchique", ids: ["pneumothorax", "cancer-bronchique"] },
  ],
};
