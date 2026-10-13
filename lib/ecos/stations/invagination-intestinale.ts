import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, FEVER, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "./shared.ts";

const EPISODES = ["toutes les", "combien de fois", "combien de crises", "reviennent", "revient", "par crises", "par acces", "intervalle", "frequence des", "regulier", "combien de temps", "combien de temps durent", "combien de temps dure", "durent", "duree", "dure$", "a dure"];
const BEHAVIOUR = ["entre les crises", "entre les acces", "entre deux", "pendant les crises", "pendant les pleurs", "calme", "pale", "paleur", "replie", "jambes", "blanche", "somnol", "endormi", "molle", "mou$", "reactiv", "eveill", "comportement", "console"];
const VOMITING = ["vomi", "regurgit", "rejet", "bile", "vert"];
const STOOLS = ["selles", "selle$", "caca", "sang", "glaire", "diarrh", "transit", "constip"];
const FEEDING = ["biberon", "boire", "boit", "bu$", "manger", "mange", "appetit", "teter", "allait", "pipi", "urine", "mouill"];
const RECENT_ILLNESS = ["rhume", "malade", "virus", "creche", "toux", "nez", "infection", "otite"];
const BACKGROUND = ["antecedent", "naissance", "ne a terme", "terme", "accouchement", "vaccin", "developpement", "croissance", "courbe", "hospitalis", "opere"];

export const invaginationIntestinale: EcosScenario = {
  slug: "invagination-intestinale",
  version: 1,
  setting: "urgences",
  patient: { name: "Mia", age: 0, sex: "F", ageLabel: "9 mois" },
  proxy: true,
  voiceSex: "M",
  painful: true,
  persona: "C’est le père de Mia, M. Baumann, qui répond. Il est inquiet et fatigué après une nuit blanche, parfois un peu sec parce qu’il a peur qu’on ne le prenne pas au sérieux. Il décrit précisément ce qu’il a vu ; il ne parle du sang dans la couche que si on l’interroge sur les selles.",
  brief: [
    "Vous êtes médecin assistant·e au service des urgences pédiatriques.",
    "M. Baumann, 34 ans, se présente aux urgences avec sa fille Mia, 9 mois, qui pleure par crises et vomit depuis cette nuit.",
    "Mia ne parle pas : son père répond. Menez l’anamnèse et l’examen clinique ciblés, demandez les examens complémentaires utiles et interprétez-les, puis posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. Ma fille pleure par crises depuis cette nuit, comme si elle avait très mal, et elle vomit tout. Ce n’est pas du tout elle.",
  history: {
    identity: "Elle s’appelle Mia Baumann, elle a neuf mois. Je suis son papa, Thomas.",
    occupation: "Elle va à la crèche deux jours par semaine. Moi je suis électricien.",
    living: "Elle vit avec sa maman, moi et son grand frère de quatre ans, à Yverdon.",
    feeling: "Elle est épuisée, elle somnole entre les crises. Moi, je suis inquiet, ça ne lui ressemble pas.",
    previousEpisodes: "Non, jamais. Elle a eu des coliques les premiers mois, mais rien à voir.",
    course: "Les crises reviennent depuis 3 heures du matin, environ toutes les vingt minutes. Entre les crises, elle est de plus en plus molle.",
    otherSymptoms: "Elle a fait une selle bizarre il y a une heure, avec des glaires et du sang.",
    medications: "Rien de régulier, juste de la vitamine D. Je lui ai mis un suppositoire de paracétamol vers 5 heures.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Née à terme, grossesse et accouchement sans problème. Ses vaccins sont à jour. Elle grandit bien d’après le pédiatre ; on a commencé les purées il y a trois mois.",
    familyHistory: "Rien de particulier dans la famille.",
    tobacco: "Personne ne fume à la maison.",
    alcohol: "Non.",
    drugs: "Non.",
    concerns: "Qu’est-ce qu’elle a ? Est-ce qu’il va falloir l’opérer ?",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Ça a commencé vers 3 heures cette nuit : elle s’est réveillée en hurlant d’un coup. Hier soir, elle allait très bien." },
    { topic: "crises", keywords: EPISODES, reply: "Chaque crise dure deux ou trois minutes, et ça revient à peu près toutes les quinze à vingt minutes. Je dirais une douzaine de crises depuis cette nuit." },
    { topic: "comportement", keywords: BEHAVIOUR, reply: "Pendant les crises, elle hurle, elle replie les jambes sur le ventre et elle devient toute pâle. Entre les crises, au début elle se calmait et jouait un peu ; maintenant elle reste molle et somnolente." },
    { topic: "douleur", keywords: ["douleur", "mal au ventre", "a mal", "ou a t elle mal", "ventre"], reply: "On dirait qu’elle a mal au ventre : elle replie les jambes et elle se tortille, puis ça passe d’un coup." },
    { topic: "vomissements", keywords: VOMITING, reply: "Elle a vomi quatre fois. D’abord son lait, et le dernier, il y a une heure, était jaune-vert." },
    { topic: "selles", keywords: STOOLS, reply: "Elle a fait une selle à peu près normale ce matin. Puis il y a une heure, dans la couche, il y avait des glaires avec du sang rouge, comme de la confiture de groseille. Pas de diarrhée." },
    { topic: "alimentation", keywords: FEEDING, reply: "Elle refuse le biberon depuis ce matin, elle a juste pris quelques gorgées d’eau. Elle a eu une seule couche mouillée depuis cette nuit." },
    { topic: "fièvre", keywords: FEVER, reply: "Non, pas de fièvre. 37,3 °C cette nuit." },
    { topic: "infection récente", keywords: RECENT_ILLNESS, reply: "Elle a eu un rhume la semaine passée, attrapé à la crèche. C’était fini depuis trois ou quatre jours." },
    { topic: "antécédents", keywords: BACKGROUND, reply: "Née à terme, 3,3 kilos, sans problème. Ses vaccins sont à jour, elle grandit bien sur sa courbe. Jamais hospitalisée, jamais opérée." },
    { topic: "traumatisme", keywords: ["tombe", "chute", "cogne", "choc", "trauma", "secou"], reply: "Non, elle n’est pas tombée. Elle était dans son lit, elle s’est réveillée en pleurant." },
    { topic: "respiration", keywords: ["respir", "souffle", "essouffl"], reply: "Non, elle respire normalement." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "Poids 8,6 kg. T 37,4 °C, FC 148/min (entre deux crises), FR 34/min, SpO₂ 99 % à l’air ambiant, TA 88/54 mmHg. Temps de recoloration 2 secondes. Muqueuses un peu sèches, fontanelle légèrement déprimée." },
    { topic: "état général", examiner: true, keywords: ["etat general", "inspect", "coloration", "aspect", "je regarde l enfant"], reply: "Nourrisson pâle, hypotonique et somnolente entre les crises, réveillable et réactive à la stimulation. Pendant l’observation, survient une crise de pleurs de deux minutes avec flexion des cuisses, puis retour au calme. Pas de purpura, pas de lésion cutanée suspecte." },
    { topic: "examen du ventre", examiner: true, keywords: ["palp", "examen abdominal", "examen du ventre", "j examine le ventre", "examiner le ventre", "defense", "masse"], reply: "Abdomen peu distendu, souple entre les crises, sans défense. Masse allongée, mobile et sensible palpée sous le rebord costal droit, dans le flanc droit ; fosse iliaque droite qui paraît vide à la palpation. Bruits intestinaux présents." },
    { topic: "orifices herniaires", examiner: true, keywords: ["hernie", "herniaire", "aine", "inguinal", "organes genitaux", "vulve"], reply: "Orifices herniaires libres des deux côtés, pas de tuméfaction inguinale. Organes génitaux externes normaux. Sang et glaires visibles dans la couche." },
    planReaction("D’accord… et si le lavement ne marche pas, vous allez devoir l’ouvrir ? On peut rester avec elle ?", ["lavement", "reduction", "chirurg", "perfusion", "hospitalis", "a jeun"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales, poids et état d’hydratation", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes", "hydratation", "poids"], key: ["constantes", "hydratation"] },
    { id: "etat-general", label: "Inspection et observation de l’enfant", category: "constantes", pertinent: true, topic: "état général", covers: ["etat-general", "peau"], key: ["etat-general"] },
    { id: "ventre", label: "Palpation du ventre", category: "examen", pertinent: true, topic: "examen du ventre", covers: ["palpation-abdominale", "signes-peritoneaux", "auscultation-abdominale"], key: ["palpation-abdominale", "signes-peritoneaux"] },
    { id: "orifices", label: "Orifices herniaires et organes génitaux externes", category: "examen", pertinent: true, topic: "orifices herniaires", covers: ["orifices-herniaires", "oge"] },
    { id: "echographie", label: "Échographie abdominale", category: "complementaire", pertinent: true, result: "Échographie abdominale : dans le flanc droit, sous le foie, image arrondie de 3,5 cm de diamètre en coupe transversale, faite d’anneaux concentriques alternativement hypo- et hyperéchogènes, avec en son centre de la graisse hyperéchogène et quelques ganglions mésentériques ; en coupe longitudinale, image en sandwich de 6 cm de long. Flux Doppler présent dans la paroi de cette image. Anses grêles d’amont modérément dilatées. Fosse iliaque droite sans structure digestive habituelle. Pas de liquide libre, pas d’air extradigestif.", covers: ["echo-abdominale"], image: { src: "/ecos/imagerie/station-33-echo-abdominale.jpg", alt: "Échographie abdominale, coupe transversale du flanc droit", credit: { author: "Kalumet", license: "CC BY-SA 3.0" } } },
    { id: "radio-abdomen", label: "Radiographie de l’abdomen sans préparation", category: "complementaire", pertinent: false, result: "Pauvreté gazeuse du flanc et de la fosse iliaque droits, sans niveau hydro-aérique ni air libre. Peu utile : elle ne fait pas le diagnostic et irradie ; l’échographie est l’examen de première intention.", covers: ["radio-abdomen"] },
    { id: "ct-abdominal", label: "CT abdominal injecté", category: "complementaire", pertinent: false, result: "Non indiqué : irradiant chez un nourrisson, l’échographie suffit et guide le traitement.", covers: ["ct-abdominal"] },
    { id: "ponction-lombaire", label: "Ponction lombaire", category: "complementaire", pertinent: false, result: "Non indiquée : pas de fièvre, pas de signe méningé ; la somnolence entre les crises s’explique par la douleur et l’atteinte digestive.", covers: ["ponction-lombaire"] },
    { id: "eeg", label: "Électroencéphalogramme", category: "complementaire", pertinent: false, result: "Non indiqué : ces accès de pleurs avec pâleur ne sont pas des crises épileptiques.", covers: ["eeg"] },
  ],
  catalogResults: {
    "fsc": "Leucocytes 12,8 G/L, hémoglobine 114 g/L, plaquettes 390 G/L.",
    "crp": "CRP 9 mg/L.",
    "ionogramme": "Na 135 mmol/L, K 4,2 mmol/L, Cl 101 mmol/L : pas de trouble électrolytique.",
    "glycemie": "Glycémie capillaire 4,6 mmol/L.",
    "examen-neurologique": "Nourrisson somnolente mais réveillable, tonus globalement diminué entre les crises, motricité symétrique, pupilles réactives, pas de signe de focalisation.",
    "signes-meninges": "Pas de raideur de nuque, fontanelle légèrement déprimée, non bombante.",
  },
  acceptable: ["fsc", "crp", "ionogramme", "creatinine", "groupe", "crase", "lactate", "gazometrie", "bandelette", "examen-orl", "examen-neurologique", "signes-meninges", "auscultation-cardiaque", "auscultation-pulmonaire"],
  diagnosisChoice: { correct: "Invagination intestinale aiguë iléo-colique", distractors: ["Gastro-entérite aiguë", "Hernie inguinale étranglée", "Volvulus sur malrotation intestinale"] },
  criteria: [
    presentationCriterion,
    {
      id: "episodes",
      label: "Caractérise les accès de pleurs",
      hint: "Début, durée et périodicité des accès, comportement pendant et entre les accès (pâleur, jambes repliées, somnolence)",
      points: 3,
      groups: [ONSET, EPISODES, BEHAVIOUR],
    },
    {
      id: "digestive",
      label: "Recherche les signes digestifs et de déshydratation",
      hint: "Vomissements et leur aspect (bilieux), selles glaireuses ou sanglantes, alimentation et diurèse",
      points: 3,
      groups: [VOMITING, STOOLS, FEEDING],
    },
    {
      id: "context",
      label: "Situe l’enfant",
      hint: "Fièvre et infection récente, antécédents, vaccins et croissance",
      points: 2,
      groups: [[...FEVER, ...RECENT_ILLNESS], BACKGROUND],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen ciblé",
      hint: "Constantes et hydratation, observation de l’enfant, palpation du ventre, orifices herniaires, échographie",
      points: 2,
      groups: [VITALS, ["palp", "ventre", "hernie"]],
    },
    {
      id: "analysis",
      label: "Interprète l’échographie",
      hint: "Image en cible ou en sandwich dans le flanc droit, invagination iléo-colique, flux Doppler conservé sans liquide ni air libre",
      points: 3,
      groups: [
        ["cible", "cocarde", "anneaux", "pseudo rein", "sandwich", "target"],
        ["invagin", "boudin", "ileo col", "ileo caec"],
        ["doppler", "vascularis", "flux", "pas de liquide", "pas d epanchement", "pas de perforation", "pas d air", "pas de pneumoperitoine"],
      ],
    },
    {
      id: "management",
      label: "Propose une prise en charge adaptée",
      hint: "Voie veineuse et remplissage, à jeun, antalgie ; avis chirurgical pédiatrique ; réduction par lavement sous contrôle échographique ou radioscopique",
      points: 3,
      groups: [
        ["voie veineuse", "perfus", "remplissage", "bolus", "nacl", "a jeun", "antalg", "sonde gastrique"],
        ["chirurg", "avis chir"],
        ["lavement", "reduction", "reduire", "desinvagin", "hydrostatique", "pneumatique", "insufflation"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Invagination intestinale aiguë iléo-colique chez un nourrisson de 9 mois, sans signe de perforation, avec une déshydratation légère",
    summary: "Nourrisson de 9 mois, au décours d’une rhinopharyngite, qui présente depuis la nuit des accès de pleurs paroxystiques avec pâleur et jambes repliées, séparés d’intervalles libres de plus en plus somnolents, des vomissements devenus bilieux, un refus du biberon et une selle glaireuse et sanglante. L’examen trouve une masse du flanc droit et une fosse iliaque droite vide. L’échographie montre une image en cible dans le flanc droit avec un flux Doppler conservé, sans liquide ni air libre. Après réhydratation IV et avis chirurgical, la réduction par lavement sous contrôle d’imagerie est le traitement de première intention.",
    keyFindings: [
      "Âge typique (3 mois à 3 ans, pic vers 6 à 12 mois), souvent après une infection virale (hyperplasie lymphoïde).",
      "Accès de pleurs paroxystiques avec pâleur et jambes repliées, intervalles libres puis somnolence et hypotonie.",
      "Vomissements devenus bilieux et selle glaireuse sanglante « gelée de groseille » : signe tardif d’une souffrance de la muqueuse.",
      "Masse allongée du flanc droit, fosse iliaque droite vide ; déshydratation légère (muqueuses sèches, fontanelle déprimée, une seule couche mouillée).",
    ],
    redFlags: [
      "Défense, distension marquée, fièvre élevée ou air libre : péritonite ou perforation, contre-indication au lavement, chirurgie.",
      "Signes de choc (tachycardie, TRC allongé, hypotension, léthargie profonde) : remplissage immédiat avant tout geste.",
      "Vomissements bilieux chez le nourrisson : occlusion, à évaluer en urgence (volvulus à éliminer).",
    ],
    management: [
      "À jeun, voie veineuse, bolus de NaCl 0,9 % 10 à 20 mL/kg si déshydratation, puis perfusion d’entretien ; antalgie (paracétamol IV, morphinique si besoin) ; sonde gastrique si vomissements répétés.",
      "Avis chirurgical pédiatrique dès le diagnostic, présent ou joignable pendant la réduction.",
      "Réduction non chirurgicale par lavement, hydrostatique sous contrôle échographique ou pneumatique sous radioscopie, en l’absence de péritonite, de perforation ou de choc ; succès dans environ 80 % des cas.",
      "Chirurgie (réduction manuelle, résection si nécrose) en cas d’échec, de contre-indication ou de récidive multiple ; surveillance après réduction (récidive possible, environ 10 %, surtout dans les 24 à 72 premières heures).",
      "Expliquer aux parents le diagnostic, le geste de réduction et les signes de récidive qui doivent faire reconsulter.",
    ],
    differentials: [
      "Gastro-entérite aiguë (diarrhée abondante, pas d’intervalle libre douloureux, pas de masse).",
      "Volvulus sur malrotation (vomissements bilieux d’emblée, urgence chirurgicale).",
      "Hernie inguinale étranglée (tuméfaction inguinale irréductible).",
      "Cause extradigestive de pleurs : infection urinaire, otite, traumatisme non accidentel.",
    ],
    examReading: [
      "Image en cible (cocarde) de 3,5 cm dans le flanc droit en coupe transversale, en sandwich (pseudo-rein) en coupe longitudinale : invagination, de type iléo-colique par sa localisation sous-hépatique et sa taille.",
      "Graisse et ganglions mésentériques au centre de l’image : mésentère entraîné dans le boudin, ganglions souvent en cause (hyperplasie lymphoïde post-virale).",
      "Flux Doppler conservé dans la paroi, pas de liquide libre ni d’air extradigestif : pas d’argument pour une ischémie ou une perforation, réduction par lavement possible.",
      "Anses grêles d’amont dilatées et fosse iliaque droite vide : retentissement occlusif débutant, cohérent avec la clinique.",
    ],
    sources: [
      { label: "Radiopaedia — Intussusception", url: "https://radiopaedia.org/articles/intussusception" },
      { label: "StatPearls — Intussusception (NCBI Bookshelf)", url: "https://www.ncbi.nlm.nih.gov/books/NBK431078/" },
    ],
    pathologySlugs: ["occlusion-intestinale"],
  },
};

export const invaginationIntestinaleDiagnoses: StationDiagnoses = {
  accepted: ["invagination"],
  differentials: [
    { label: "Gastro-entérite aiguë", ids: ["gastro-enterite"] },
    { label: "Volvulus sur malrotation ou autre occlusion", ids: ["occlusion-intestinale"] },
    { label: "Hernie inguinale étranglée", ids: ["hernie-etranglee"] },
    { label: "Cause extradigestive : infection urinaire, otite, maltraitance", ids: ["pyelonephrite-aigue", "otite-moyenne", "maltraitance"] },
  ],
};
