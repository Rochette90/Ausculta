import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { CHARACTER, communicationCriterion, FEVER, INTENSITY, LOCATION, NAUSEA, ONSET, planReaction, presentationCriterion, RADIATION, SYNCOPE, treatmentsCriterion, VITALS } from "./shared.ts";

const PERIODS = ["regles", "dernieres regles", "ddr", "cycle", "retard", "regulier"];
const BLEEDING = ["saign", "pertes", "metrorr", "sang$", "spotting", "garniture", "serviette", "tampon"];
const PREGNANCY = ["contracept", "pilule", "sterilet", "preservatif", "enceinte", "grossesse", "test de grossesse", "bebe", "desir d enfant", "rapports"];
const GYN_HISTORY = ["infection", "chlamydia", "ist$", "mst$", "salpingite", "gonocoque", "gyneco", "deja ete enceinte", "fausse couche", "opere", "operation", "chirurg", "antecedent"];
const SMOKING = ["fum", "tabac", "cigarette"];
const SHOULDER = ["epaule", "irrad", "mal a l epaule", "douleur a l epaule", "douleur dans l epaule"];

export const grossesseExtraUterine: EcosScenario = {
  slug: "grossesse-extra-uterine",
  version: 1,
  setting: "urgences",
  patient: { name: "Mme Rey", age: 31, sex: "F" },
  painful: true,
  persona: "Jeune femme inquiète, un peu tendue, qui se tient le bas du ventre à droite. Elle répond clairement mais ne parle de son retard de règles et de son ancienne infection que si on lui pose la question. Elle espère une grossesse et a peur de la perdre.",
  brief: [
    "Vous êtes médecin assistant·e au service des urgences.",
    "Mme Rey, 31 ans, se présente aux urgences pour des saignements et une douleur dans le bas du ventre à droite depuis hier.",
    "Menez l’anamnèse et l’examen clinique ciblés, demandez les examens complémentaires utiles et interprétez-les, puis posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. Depuis hier j’ai mal en bas du ventre, du côté droit, et je saigne un peu. Ça m’inquiète.",
  history: {
    identity: "Laura Rey, 31 ans.",
    occupation: "Je suis employée de commerce dans une agence de voyages.",
    living: "Je vis avec mon compagnon à Morges, en appartement.",
    feeling: "Pas très bien, j’ai mal et j’ai peur que ce soit grave.",
    previousEpisodes: "Non, je n’ai jamais eu ce genre de douleur.",
    course: "La douleur a commencé hier après-midi, elle est plus forte depuis ce matin. Les saignements, c’est depuis trois jours.",
    otherSymptoms: "J’ai un peu mal au cœur depuis quelques jours.",
    medications: "Rien de régulier. J’ai pris un comprimé de paracétamol hier soir, ça n’a pas beaucoup aidé.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "J’ai eu une infection à chlamydia vers 24 ans, traitée par antibiotiques. Sinon rien, jamais opérée, jamais été enceinte.",
    familyHistory: "Rien de particulier dans la famille.",
    tobacco: "Oui, une dizaine de cigarettes par jour depuis mes vingt ans.",
    alcohol: "Un verre de vin de temps en temps, rien depuis quelques semaines.",
    drugs: "Non.",
    concerns: "Est-ce que je suis enceinte ? Et si oui, est-ce que je suis en train de perdre le bébé ?",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "La douleur a commencé hier vers 15 heures, progressivement. Les petits saignements ont commencé il y a trois jours." },
    { topic: "localisation", keywords: [...LOCATION, "douleur", "avez vous mal", "ca fait mal"], reply: "C’est en bas du ventre, à droite, juste au-dessus de l’aine. Je peux le montrer avec un doigt." },
    { topic: "type de douleur", keywords: CHARACTER, reply: "C’est une douleur sourde, continue, avec des moments où ça serre plus fort." },
    { topic: "intensité", keywords: INTENSITY, reply: "Là, je dirais 6 sur 10. Hier c’était plutôt 3." },
    { topic: "irradiation", keywords: [...RADIATION, ...SHOULDER], reply: "Non, ça reste en bas à droite. Pas de douleur dans l’épaule." },
    { topic: "règles", keywords: PERIODS, reply: "Mes dernières règles remontent à sept semaines, le 25 août. D’habitude je suis réglée toutes les quatre semaines, très régulièrement." },
    { topic: "saignements", keywords: BLEEDING, reply: "Ce sont de petits saignements brunâtres, moins que des règles. Une serviette par jour suffit. Pas de caillots, rien d’autre." },
    { topic: "grossesse et contraception", keywords: PREGNANCY, reply: "J’ai arrêté la pilule il y a quatre mois, on aimerait avoir un enfant. Je n’ai pas encore fait de test de grossesse, j’attendais d’être sûre." },
    { topic: "antécédents gynécologiques", keywords: GYN_HISTORY, reply: "J’ai eu une infection à chlamydia à 24 ans, traitée par antibiotiques. Jamais été enceinte, jamais opérée du ventre." },
    { topic: "malaise", keywords: SYNCOPE, reply: "Non, je n’ai pas fait de malaise. La tête ne tourne pas." },
    { topic: "nausées", keywords: NAUSEA, reply: "J’ai un peu mal au cœur le matin depuis une semaine, mais je n’ai pas vomi." },
    { topic: "fièvre", keywords: FEVER, reply: "Non, pas de fièvre, pas de frissons." },
    { topic: "urines", keywords: ["urin", "pipi", "brulure en urinant", "brulures en urinant"], reply: "Non, rien de particulier quand j’urine." },
    { topic: "transit", keywords: ["selles", "selle$", "transit", "diarrh", "constip", "toilettes"], reply: "Depuis ce matin j’ai souvent envie d’aller à selle, mais il ne se passe rien. Pas de diarrhée." },
    { topic: "pertes", keywords: ["pertes vaginales", "odeur", "demangeaison"], reply: "Non, pas de pertes inhabituelles à part ces saignements." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 118/74 mmHg, FC 84/min, FR 14/min, SpO₂ 99 % à l’air ambiant, T 36,9 °C. Patiente consciente, un peu pâle, sans marbrures." },
    { topic: "examen du ventre", examiner: true, keywords: ["palp", "examen abdominal", "examen du ventre", "j examine le ventre", "examiner le ventre", "defense", "blumberg", "rebond", "mcburney"], reply: "Abdomen souple, sensible en fosse iliaque droite et dans l’hypogastre, sans défense ni contracture. Blumberg négatif. Bruits intestinaux présents. Pas de masse palpable." },
    { topic: "examen gynécologique", examiner: true, keywords: ["speculum", "toucher vaginal", "examen gyneco", "examen gynecologique", "col de l uterus"], reply: "Spéculum : petit saignement brunâtre provenant de l’orifice cervical, col fermé, pas de tissu dans le col. Toucher vaginal : utérus légèrement augmenté de volume et mou, douleur à la mobilisation du col vers la gauche, zone latéro-utérine droite très sensible avec une masse mal limitée, cul-de-sac de Douglas sensible." },
    planReaction("Donc je vais devoir être opérée ? Et pour le bébé, il n’y a vraiment rien à faire ?", ["methotrexate", "coelioscop", "laparoscop", "operation", "chirurg", "gynecologue", "anti d"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes", "etat-general"], key: ["constantes"] },
    { id: "ventre", label: "Palpation du ventre et recherche d’une défense", category: "examen", pertinent: true, topic: "examen du ventre", covers: ["palpation-abdominale", "signes-peritoneaux", "mcburney"], key: ["palpation-abdominale", "signes-peritoneaux"] },
    { id: "examen-gyneco", label: "Examen au spéculum et toucher vaginal", category: "examen", pertinent: true, topic: "examen gynécologique", covers: ["examen-gyneco"] },
    { id: "beta-hcg", label: "Dosage quantitatif de la β-hCG plasmatique", category: "complementaire", pertinent: true, result: "β-hCG plasmatique quantitative : 2 400 UI/L.", covers: ["beta-hcg"] },
    { id: "echo-endovaginale", label: "Échographie endovaginale", category: "complementaire", pertinent: true, result: "Échographie endovaginale : utérus antéversé de taille normale, cavité utérine vide, sans sac gestationnel ; endomètre épaissi à 11 mm. En région latéro-utérine droite, entre l’utérus et l’ovaire droit et distincte de celui-ci, masse ovalaire hétérogène de 24 × 18 mm, entourée d’un anneau hyperéchogène avec une vascularisation périphérique au Doppler, sans embryon ni activité cardiaque visible. Ovaire droit contenant un corps jaune de 18 mm ; ovaire gauche sans particularité. Petite quantité de liquide échogène dans le cul-de-sac de Douglas, de 15 mm de hauteur. Pas de liquide dans l’espace hépato-rénal.", covers: ["echo-pelvienne", "echo-abdominale"] },
    { id: "groupe", label: "Groupe sanguin, rhésus et anticorps irréguliers", category: "complementaire", pertinent: true, result: "Groupe O, rhésus D négatif. Recherche d’anticorps irréguliers négative.", covers: ["groupe"] },
    { id: "fsc", label: "Formule sanguine complète (hémoglobine)", category: "complementaire", pertinent: true, result: "Hémoglobine 124 g/L, leucocytes 9,1 G/L, plaquettes 245 G/L.", covers: ["fsc"] },
    { id: "ct-abdominal", label: "CT abdomino-pelvien injecté", category: "complementaire", pertinent: false, result: "Non indiqué : irradiant chez une femme possiblement enceinte, et l’échographie endovaginale est l’examen de référence ici.", covers: ["ct-abdominal"] },
    { id: "radio-abdomen", label: "Radiographie de l’abdomen sans préparation", category: "complementaire", pertinent: false, result: "Non indiquée : pas de signe d’occlusion ni de perforation, irradiation inutile chez une femme possiblement enceinte.", covers: ["radio-abdomen"] },
    { id: "lipase", label: "Dosage de la lipase", category: "complementaire", pertinent: false, result: "Lipase 32 U/L, normale. Rien n’oriente vers le pancréas : douleur basse, latéralisée à droite.", covers: ["lipase"] },
  ],
  catalogResults: {
    "bandelette": "Bandelette urinaire : sang +++ (contamination par les saignements), leucocytes et nitrites négatifs.",
    "toucher-rectal": "Douleur à la pression du cul-de-sac de Douglas, pas de sang au doigtier.",
  },
  acceptable: ["bandelette", "crase", "creatinine", "tests-hepatiques", "crp", "ionogramme", "toucher-rectal", "culture-urinaire", "auscultation-abdominale"],
  diagnosisChoice: { correct: "Grossesse extra-utérine tubaire droite", distractors: ["Fausse couche spontanée", "Rupture d’un kyste hémorragique du corps jaune", "Appendicite aiguë"] },
  criteria: [
    presentationCriterion,
    {
      id: "pain",
      label: "Caractérise la douleur",
      hint: "Début et évolution, localisation, type et intensité",
      points: 2,
      groups: [ONSET, [...LOCATION, ...CHARACTER, ...INTENSITY]],
    },
    {
      id: "gynecology",
      label: "Mène l’anamnèse gynécologique",
      hint: "Date des dernières règles, caractéristiques des saignements, contraception ou possibilité de grossesse",
      points: 3,
      groups: [PERIODS, BLEEDING, PREGNANCY],
    },
    {
      id: "risk",
      label: "Recherche les facteurs de risque",
      hint: "Antécédent d’infection génitale ou de chirurgie tubaire, tabagisme",
      points: 2,
      groups: [GYN_HISTORY, SMOKING],
    },
    {
      id: "severity",
      label: "Recherche des signes de saignement interne",
      hint: "Malaise, vertiges, douleur irradiant à l’épaule",
      points: 2,
      groups: [SYNCOPE, SHOULDER],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen ciblé et bilan initial",
      hint: "Constantes, palpation du ventre, examen au spéculum et toucher vaginal, β-hCG, échographie endovaginale, groupe et hémoglobine",
      points: 2,
      groups: [VITALS, ["palp", "speculum", "toucher vaginal"]],
    },
    {
      id: "analysis",
      label: "Interprète la β-hCG et l’échographie",
      hint: "β-hCG au-dessus du seuil de visibilité avec un utérus vide, masse latéro-utérine droite, liquide dans le Douglas",
      points: 3,
      groups: [
        ["uterus vide", "vacuite", "cavite vide", "pas de sac", "absence de sac", "sans sac", "aucun sac", "pas de grossesse intra"],
        ["masse latero uterine", "masse annex", "masse tub", "masse droite", "anneau", "tubaire", "geu$", "extra uterine", "ectopique"],
        ["liquide", "epanchement", "douglas", "hemoperitoine"],
      ],
    },
    {
      id: "management",
      label: "Propose une prise en charge adaptée",
      hint: "Avis gynécologique urgent, méthotrexate ou cœlioscopie selon les critères, immunoglobulines anti-D chez une patiente rhésus négatif",
      points: 2,
      groups: [
        ["avis gyn", "gynecologue", "methotrexate", "coelioscop", "laparoscop", "salpingectom", "salpingotom", "bloc"],
        ["anti d", "immunoglobuline", "rhophylac", "rhesus negatif", "rh negatif"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Grossesse extra-utérine tubaire droite non rompue, avec un petit épanchement dans le Douglas, chez une patiente hémodynamiquement stable et rhésus négatif",
    summary: "Femme de 31 ans, aménorrhée de sept semaines, métrorragies peu abondantes et douleur de la fosse iliaque droite, avec antécédent de chlamydia et tabagisme. Elle est stable. La β-hCG est à 2 400 UI/L, au-dessus du seuil où une grossesse intra-utérine devrait être visible, et l’échographie endovaginale montre un utérus vide, une masse latéro-utérine droite distincte de l’ovaire et un peu de liquide dans le Douglas. Avis gynécologique urgent : méthotrexate ou cœlioscopie selon les critères, et immunoglobulines anti-D car elle est rhésus négatif.",
    keyFindings: [
      "Triade retard de règles, métrorragies et douleur pelvienne latéralisée chez une femme en âge de procréer : toute douleur pelvienne impose une β-hCG.",
      "Facteurs de risque : antécédent d’infection à chlamydia (atteinte tubaire) et tabagisme.",
      "Toucher vaginal : douleur et masse latéro-utérine droite, Douglas sensible ; col fermé.",
      "Hémodynamique stable (FC 84/min, TA 118/74 mmHg, Hb 124 g/L), sans douleur scapulaire.",
    ],
    redFlags: [
      "Tachycardie, hypotension, malaise ou pâleur marquée : rupture tubaire avec hémopéritoine, urgence chirurgicale.",
      "Douleur irradiant à l’épaule (irritation diaphragmatique) ou défense : hémopéritoine abondant.",
      "Liquide dans l’espace hépato-rénal (Morison) à l’échographie : saignement important.",
    ],
    management: [
      "Voie veineuse, patiente à jeun, surveillance rapprochée des constantes, antalgie ; FSC, groupe et anticorps irréguliers, créatinine et tests hépatiques (bilan avant méthotrexate).",
      "Avis gynécologique urgent : chez cette patiente stable, β-hCG < 5 000 UI/L, masse < 35 mm sans activité cardiaque et peu de liquide, le méthotrexate IM (50 mg/m², dose unique) est une option si elle accepte un suivi rapproché ; sinon cœlioscopie (salpingectomie, ou salpingotomie si l’autre trompe est atteinte).",
      "Suivi après méthotrexate : β-hCG à J4 et J7 (baisse d’au moins 15 % attendue), puis chaque semaine jusqu’à négativation ; contraception et pas de grossesse pendant au moins 3 mois.",
      "Rhésus D négatif : immunoglobulines anti-D dans les 72 heures, selon le protocole local.",
      "Expliquer avec empathie que cette grossesse n’est pas évolutive et donner les signes d’alerte qui imposent un retour immédiat.",
    ],
    differentials: [
      "Fausse couche spontanée (grossesse intra-utérine, saignement plus abondant, col parfois ouvert).",
      "Rupture ou hémorragie d’un kyste du corps jaune (β-hCG possible, mais masse ovarienne).",
      "Torsion d’annexe (douleur brutale, ovaire augmenté de volume).",
      "Appendicite aiguë ou salpingite (fièvre, syndrome inflammatoire).",
    ],
    examReading: [
      "β-hCG à 2 400 UI/L : au-dessus de la zone discriminante (environ 1 500 à 3 500 UI/L), une grossesse intra-utérine devrait être visible en endovaginal.",
      "Utérus vide avec endomètre épaissi : absence de grossesse intra-utérine, donc grossesse de localisation anormale jusqu’à preuve du contraire.",
      "Masse latéro-utérine droite distincte de l’ovaire, avec un anneau hyperéchogène vascularisé : sac ectopique tubaire droit, sans embryon visible.",
      "Liquide échogène modéré dans le Douglas, sans liquide dans l’espace hépato-rénal : petit hémopéritoine, sans signe de rupture massive.",
      "Groupe O rhésus négatif : indication aux immunoglobulines anti-D ; Hb 124 g/L, pas d’anémie aiguë.",
    ],
    sources: [
      { label: "NICE NG126 — Ectopic pregnancy and miscarriage: diagnosis and initial management", url: "https://www.nice.org.uk/guidance/ng126" },
      { label: "Radiopaedia — Ectopic pregnancy", url: "https://radiopaedia.org/articles/ectopic-pregnancy" },
    ],
    pathologySlugs: [],
  },
};

export const grossesseExtraUterineDiagnoses: StationDiagnoses = {
  accepted: ["grossesse-extra-uterine"],
  differentials: [
    { label: "Fausse couche spontanée", ids: ["fausse-couche"] },
    { label: "Kyste ovarien compliqué (rupture d’un kyste du corps jaune)", ids: ["kyste-ovarien"] },
    { label: "Torsion d’annexe", ids: ["torsion-annexe"] },
    { label: "Appendicite aiguë ou salpingite", ids: ["appendicite", "salpingite"] },
  ],
};
