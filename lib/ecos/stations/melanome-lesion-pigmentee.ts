import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "./shared.ts";

const CHANGE = ["change", "evolu", "grandi", "grossi", "modifi", "depuis toujours", "nouveau", "apparu", "remarque"];
const SIZE_SHAPE = ["taille", "diametre", "millim", "centim", "forme", "bord", "contour", "regulier", "asymetr", "relief", "bosse", "sureleve"];
const COLOUR = ["couleur", "fonce", "noir", "brun", "marron", "bleu", "gris", "teinte"];
const SYMPTOMS = ["saign", "demang", "gratte", "croute", "suinte", "fait mal", "douloureu"];
const SUN = ["soleil", "coup de soleil", "coups de soleil", "bronz", "uv$", "solarium", "plage", "exposition", "expose", "creme solaire"];
const PHOTOTYPE = ["peau claire", "type de peau", "votre peau", "cheveux", "yeux", "roux", "rousse", "blond", "rousseur", "phototype", "rougi"];
const NEVI = ["grains de beaute", "combien de grain", "beaucoup de grain", "naevus", "nevus", "autres taches", "autres grains"];
const FAMILY = ["famille", "familia", "votre pere", "votre mere", "vos parents", "frere", "soeur", "hereditaire", "cancer de la peau"];
const GENERAL = ["poids", "maigri", "fatigu", "ganglion", "boule", "toux", "appetit"];

export const melanomeLesionPigmentee: EcosScenario = {
  slug: "melanome-lesion-pigmentee",
  version: 1,
  setting: "cabinet",
  patient: { name: "Mme Brunner", age: 52, sex: "F" },
  persona: "Patiente calme et organisée, venue surtout parce que son mari a insisté. Elle minimise un peu au début, mais s’inquiète vite si on parle de cancer sans lui expliquer la suite. Elle apprécie qu’on soit clair et concret.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "Mme Brunner, 52 ans, consulte au cabinet pour un grain de beauté du dos qui a changé d’aspect.",
    "Menez l’anamnèse, décrivez l’examen clinique et les examens utiles, posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. C’est mon mari qui m’envoie : il trouve qu’un grain de beauté dans mon dos a changé ces derniers mois.",
  history: {
    identity: "Claudia Brunner, 52 ans.",
    occupation: "Je suis enseignante au secondaire, en biologie.",
    living: "Je vis avec mon mari ; nos deux enfants sont adultes et ont quitté la maison.",
    feeling: "Je me sens bien, honnêtement. C’est surtout mon mari qui s’inquiète.",
    previousEpisodes: "Non, on ne m’a jamais rien enlevé sur la peau, et je n’ai jamais fait contrôler mes grains de beauté.",
    course: "Mon mari dit qu’il a grossi et foncé ces trois ou quatre derniers mois. Il l’a pris en photo en juin puis la semaine passée, et on voit la différence.",
    otherSymptoms: "Ça me gratte un peu de temps en temps à cet endroit.",
    medications: "Rien de régulier, parfois de l’ibuprofène quand j’ai mal au dos.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Rien de particulier : une appendicectomie à 15 ans, deux accouchements sans problème. Je suis ménopausée depuis deux ans.",
    familyHistory: "Mon père s’est fait enlever un mélanome sur le bras à 65 ans ; il va bien. Ma mère a de l’hypertension.",
    tobacco: "J’ai arrêté il y a vingt ans, je fumais peu.",
    alcohol: "Un verre de vin le week-end.",
    drugs: "Non.",
    concerns: "Est-ce que c’est un cancer, comme mon père ? Et si oui, est-ce que c’est déjà parti ailleurs ?",
  },
  rules: [
    { topic: "localisation", keywords: ["ou se trouve", "ou est ce", "ou exactement", "localis", "endroit", "montrez", "montrer", "dos", "omoplate"], reply: "Dans le dos, à gauche, sous l’omoplate. Je ne le vois pas moi-même, c’est mon mari qui l’a remarqué." },
    { topic: "évolution", keywords: CHANGE, reply: "J’ai ce grain de beauté depuis des années, il était petit, rond et brun. Mon mari dit qu’il a nettement grossi et foncé ces trois ou quatre derniers mois." },
    { topic: "taille et forme", keywords: SIZE_SHAPE, reply: "Il est maintenant presque de la taille d’un petit pois, alors qu’avant il était tout petit. Sur les photos, il n’est plus rond, les bords sont comme découpés, et au toucher il y a un petit bout en relief." },
    { topic: "couleur", keywords: COLOUR, reply: "Il est devenu plus foncé, presque noir par endroits, avec du brun clair autour et une petite zone un peu grise." },
    { topic: "symptômes locaux", keywords: SYMPTOMS, reply: "Ça me gratte de temps en temps, et il a saigné une fois il y a deux semaines, quand l’agrafe du soutien-gorge a frotté dessus. Ça ne fait pas mal." },
    { topic: "photos", keywords: ["photo", "image", "comparer", "comparaison"], reply: "Oui, mon mari l’a pris en photo en juin et la semaine passée, je peux vous montrer : il a clairement grandi et foncé." },
    { topic: "exposition solaire", keywords: SUN, reply: "Enfant, j’ai pris de gros coups de soleil, avec des cloques, en vacances au bord de la mer. Vers vingt ans, je faisais du solarium avant l’été. Maintenant je mets de la crème, mais pas toujours." },
    { topic: "phototype", keywords: PHOTOTYPE, reply: "J’ai la peau très claire, des taches de rousseur et les yeux bleus ; j’étais blond vénitien. Je rougis toujours au soleil, je ne bronze presque pas." },
    { topic: "nombre de grains de beauté", keywords: NEVI, reply: "J’en ai beaucoup, surtout sur le dos et les bras, peut-être une cinquantaine. Mais aucun autre n’a changé, à ma connaissance." },
    { topic: "antécédents familiaux", keywords: FAMILY, reply: "Mon père s’est fait enlever un mélanome sur le bras à 65 ans. Il va bien. Personne d’autre, à ma connaissance." },
    { topic: "état général", keywords: GENERAL, reply: "Non, mon poids est stable, je ne suis pas spécialement fatiguée, je n’ai senti aucune boule sous les bras ni au cou. Pas de toux." },
    { topic: "début", keywords: ONSET, reply: "Mon mari l’a remarqué en juin, il y a environ quatre mois. Avant, je n’y avais jamais fait attention." },
    { topic: "immunosuppression", keywords: ["immun", "greffe", "cortison", "chimio"], reply: "Non, je n’ai jamais pris de traitement qui baisse les défenses." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 128/80 mmHg, FC 72/min, T 36,7 °C, SpO₂ 98 %. Poids 64 kg, stable selon la patiente." },
    { topic: "examen de la peau", examiner: true, keywords: ["inspect", "peau", "lesion", "regarde", "tout le corps", "deshabill", "examin", "j examine", "je vous examine", "examen clinique", "examen physique"], reply: "Région scapulaire gauche : lésion pigmentée de 9 × 7 mm, asymétrique, à bords irréguliers et encochés, de plusieurs couleurs (brun clair, brun foncé, noir, petite zone gris-bleuté), avec une partie légèrement surélevée et une petite croûte en surface. Elle se distingue nettement des autres grains de beauté (signe du vilain petit canard). Reste du tégument, cuir chevelu, ongles et muqueuses compris : une cinquantaine de nævus réguliers, homogènes, de moins de 5 mm, nombreuses éphélides sur les épaules ; pas d’autre lésion suspecte, pas de nodule autour de la lésion. Peau claire de phototype II." },
    { topic: "ganglions", examiner: true, keywords: ["ganglion", "adenopath", "aisselle", "axillaire", "inguinal", "sus clavicul"], reply: "Pas d’adénopathie axillaire, cervicale, sus-claviculaire ni inguinale palpable, des deux côtés." },
    { topic: "dermatoscopie", examiner: true, keywords: ["dermatoscop", "dermoscop", "loupe"], reply: "Dermatoscopie de la lésion scapulaire gauche : structure asymétrique sur deux axes, réseau pigmentaire atypique et irrégulier, points et globules de taille et de répartition irrégulières, stries irrégulières en périphérie, voile bleu-blanc dans la partie surélevée. Les autres nævus examinés ont un réseau régulier et symétrique." },
    planReaction("Il faut l’enlever, alors ? Ça veut dire que c’est un cancer ? Et on le fait quand ?", ["enlever", "retirer", "exerese", "excision", "biopsie", "analyse", "histolog", "dermatolog", "specialiste"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales et poids", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes", "poids"], key: ["constantes"] },
    { id: "tegument", label: "Inspection de la lésion et de l’ensemble du tégument", category: "examen", pertinent: true, topic: "examen de la peau", covers: ["peau"] },
    { id: "ganglions", label: "Palpation des aires ganglionnaires", category: "examen", pertinent: true, topic: "ganglions", covers: ["adenopathies"] },
    { id: "dermatoscopie", label: "Dermatoscopie de la lésion", category: "complementaire", pertinent: true, topic: "dermatoscopie", covers: ["dermatoscopie"] },
    { id: "radio-thorax", label: "Radiographie du thorax", category: "complementaire", pertinent: false, covers: ["radio-thorax"], result: "Non indiquée : le bilan d’extension ne se discute qu’après l’histologie, selon l’épaisseur de la tumeur (indice de Breslow) et le stade." },
    { id: "ct-thoraco-abdominal", label: "CT thoraco-abdominal injecté", category: "complementaire", pertinent: false, covers: ["ct-thoracique", "ct-abdominal"], result: "Non indiqué avant le diagnostic histologique : réservé aux stades avancés après l’exérèse." },
    { id: "echo-abdominale", label: "Échographie abdominale", category: "complementaire", pertinent: false, covers: ["echo-abdominale"], result: "Non indiquée : aucun signe d’appel, et le bilan d’extension dépend de l’histologie." },
    { id: "bilan-sanguin", label: "Formule sanguine et tests hépatiques", category: "complementaire", pertinent: false, covers: ["fsc", "tests-hepatiques"], result: "Dans les normes, et sans intérêt pour le diagnostic d’une lésion pigmentée : seule l’histologie tranche." },
    { id: "frottis-cutane", label: "Frottis bactériologique de la lésion", category: "complementaire", pertinent: false, covers: ["prelevement-cutane"], result: "Non indiqué : la lésion n’a pas l’aspect d’une infection. Il faut une analyse histologique de la lésion entière, pas un frottis." },
  ],
  acceptable: ["palpation-abdominale", "foie-rate", "auscultation-pulmonaire"],
  diagnosisChoice: { correct: "Mélanome à extension superficielle (suspicion clinique)", distractors: ["Nævus atypique (dysplasique)", "Kératose séborrhéique", "Carcinome basocellulaire pigmenté"] },
  criteria: [
    presentationCriterion,
    {
      id: "lesion",
      label: "Caractérise la lésion et son évolution",
      hint: "Changement récent, taille et forme (bords, relief), couleur, démangeaison ou saignement",
      points: 4,
      groups: [CHANGE, SIZE_SHAPE, COLOUR, SYMPTOMS],
    },
    {
      id: "risk-factors",
      label: "Recherche les facteurs de risque",
      hint: "Exposition solaire et coups de soleil, type de peau, nombre de grains de beauté, antécédents familiaux de mélanome",
      points: 4,
      groups: [SUN, PHOTOTYPE, NEVI, FAMILY],
    },
    {
      id: "extension",
      label: "Recherche des signes d’extension",
      hint: "Perte de poids, fatigue, ganglions perçus par la patiente",
      points: 1,
      groups: [GENERAL],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen et examens ciblés",
      hint: "Examen de toute la peau (vilain petit canard), palpation des ganglions, dermatoscopie",
      points: 3,
      groups: [["peau", "tout le corps", "deshabill", "inspect"], ["ganglion", "adenopath", "aisselle"], ["dermatoscop", "dermoscop"]],
    },
    {
      id: "management",
      label: "Propose l’exérèse complète et le suivi",
      hint: "Exérèse-biopsie complète de la lésion, analyse histologique (épaisseur), prise en charge dermatologique rapide, protection solaire et auto-examen",
      points: 4,
      groups: [
        ["exerese", "excision", "enlever", "retirer", "biopsie", "ablation", "operer"],
        ["histolog", "anatomopath", "analyse", "laboratoire", "breslow", "epaisseur", "microscope"],
        ["dermatolog", "specialiste", "rapidement", "rendez vous", "urgent"],
        ["protection solaire", "proteger du soleil", "creme", "eviter le soleil", "auto examen", "autoexamen", "surveill", "controle", "suivi"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Lésion pigmentée suspecte de mélanome à extension superficielle du dos (région scapulaire gauche)",
    summary: "Femme de 52 ans, de phototype clair, avec de nombreux nævus, des coups de soleil graves dans l’enfance, une exposition aux UV artificiels et un père opéré d’un mélanome, chez qui un nævus ancien du dos a grandi, foncé et changé de forme en quelques mois, avec prurit et un saignement. La lésion remplit tous les critères ABCDE, se distingue des autres nævus (vilain petit canard) et présente des critères dermatoscopiques de malignité. Sans adénopathie ni autre lésion suspecte, il faut une exérèse-biopsie complète rapide pour l’histologie, qui fixera la suite.",
    keyFindings: [
      "Critères ABCDE : asymétrie, bords irréguliers et encochés, couleurs multiples, diamètre de 9 mm, évolution rapide.",
      "Signe du vilain petit canard : lésion différente de tous les autres nævus de la patiente.",
      "Dermatoscopie : réseau atypique, points et globules irréguliers, stries périphériques, voile bleu-blanc.",
      "Facteurs de risque : phototype II, une cinquantaine de nævus, coups de soleil avec cloques dans l’enfance, solarium, antécédent familial au premier degré.",
      "Pas d’adénopathie régionale palpable ni d’autre lésion suspecte.",
    ],
    redFlags: [
      "Lésion qui change (taille, forme, couleur), saigne ou démange : exérèse rapide, pas de simple surveillance.",
      "Partie nodulaire ou surélevée : risque d’une tumeur plus épaisse, délai à réduire au minimum.",
      "Adénopathie régionale, nodules autour de la lésion ou le long du drainage lymphatique, symptômes généraux : extension probable, bilan rapide.",
    ],
    management: [
      "Exérèse-biopsie complète de la lésion, avec une marge de 1 à 2 mm, dans les jours à quelques semaines (par le ou la dermatologue ou la chirurgie) ; éviter la biopsie partielle et le rasage (shaving), qui gênent la mesure de l’épaisseur.",
      "Analyse histologique : diagnostic, indice de Breslow, ulcération, marges. La reprise chirurgicale (marges de 0,5 à 2 cm selon l’épaisseur) et la biopsie du ganglion sentinelle (à partir de 0,8 mm ou si ulcération) en dépendent.",
      "Pas d’imagerie ni de bilan sanguin avant l’histologie : le bilan d’extension se décide selon le stade.",
      "Expliquer honnêtement la suspicion, rassurer sur le pronostic excellent des mélanomes fins enlevés tôt, et prévoir le rendez-vous pour le résultat.",
      "Prévention et suivi : protection solaire, pas de solarium, auto-examen de la peau, suivi dermatologique régulier ; proposer un contrôle cutané aux apparentés au premier degré.",
    ],
    differentials: [
      "Nævus atypique (dysplasique) : asymétrie et couleurs moins marquées, évolution lente ; seule l’histologie tranche.",
      "Kératose séborrhéique : lésion « posée » sur la peau, surface verruqueuse, kystes de milium et pseudo-comédons en dermatoscopie.",
      "Carcinome basocellulaire pigmenté : lésion perlée, télangiectasies arborescentes, sans réseau pigmentaire.",
      "Angiome thrombosé ou hématome : lacunes rouge-noir en dermatoscopie, apparition brutale.",
    ],
    sources: [
      { label: "EADO 2022 — European consensus-based interdisciplinary guideline for melanoma. Part 1: Diagnostics", url: "https://doi.org/10.1016/j.ejca.2022.03.008" },
      { label: "NICE NG14 — Melanoma: assessment and management", url: "https://www.nice.org.uk/guidance/ng14" },
    ],
    pathologySlugs: [],
  },
};

/**
 * Les différentiels attendus (nævus atypique, kératose séborrhéique,
 * carcinome basocellulaire) n'existent pas encore dans la liste commune
 * (`lib/ecos/diagnosis-catalog.ts`) : ids proposés, à y ajouter.
 */
export const melanomeLesionPigmenteeDiagnoses: StationDiagnoses = {
  accepted: ["melanome"],
  differentials: [
    { label: "Nævus atypique (dysplasique)", ids: ["naevus-atypique"] },
    { label: "Kératose séborrhéique", ids: ["keratose-seborrheique"] },
    { label: "Carcinome basocellulaire pigmenté", ids: ["carcinome-basocellulaire"] },
  ],
};
