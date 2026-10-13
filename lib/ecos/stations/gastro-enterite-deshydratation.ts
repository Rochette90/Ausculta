import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, FEVER, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "./shared.ts";

const VOMITING = ["vomi", "renvoi", "rendu", "recrach", "garde"];
const STOOLS = ["diarrh", "selle", "caca", "couche sale", "couches sales"];
const INTAKE = ["boire", "boit", "biberon", "bu$", "soif", "liquide", "manger", "mange", "appetit", "lait"];
const DIURESIS = ["couche", "pipi", "urin", "mouill"];
const WEIGHT = ["poids", "pese", "kilo", "maigri", "perdu du poids"];
const BLOOD = ["sang", "glaire", "rouge", "noir"];
const BILE = ["vert$", "verts$", "verte$", "bile", "bilieu", "couleur des vomi", "jaune"];
const LETHARGY = ["somnol", "endormi", "dort", "mou$", "lethar", "reveil", "apathi", "reagit", "comportement", "eveille", "joue", "irritable", "grognon"];

export const gastroEnteriteDeshydratation: EcosScenario = {
  slug: "gastro-enterite-deshydratation",
  version: 1,
  setting: "urgences",
  patient: { name: "Elio", age: 1, sex: "M", ageLabel: "18 mois" },
  proxy: true,
  voiceSex: "F",
  persona: "C’est la mère d’Elio, Mme Ferrari, qui répond. Fatiguée par deux nuits blanches et inquiète, elle parle vite mais décrit précisément ce qu’elle a vu. Elle se sent un peu coupable de ne pas être venue plus tôt et se calme quand on lui explique concrètement quoi faire.",
  brief: [
    "Vous êtes médecin assistant·e aux urgences pédiatriques.",
    "Elio, 18 mois, accompagné de sa mère, Mme Ferrari, 32 ans, se présente aux urgences pour des vomissements et de la diarrhée depuis deux jours.",
    "L’enfant ne parle pas encore : sa mère répond. Menez l’anamnèse, décrivez l’examen clinique et les examens utiles, posez un diagnostic et expliquez la prise en charge.",
  ],
  opening: "Bonjour docteur. Elio vomit et il a la diarrhée depuis deux jours, il ne garde presque rien et il est tout fatigué. J’ai peur qu’il se déshydrate.",
  history: {
    identity: "Il s’appelle Elio Ferrari, il a dix-huit mois. Je suis sa maman, Giulia Ferrari, j’ai 32 ans.",
    occupation: "Il va à la crèche quatre jours par semaine. Moi, je suis employée de commerce.",
    living: "Il vit avec son papa et moi, c’est notre seul enfant.",
    feeling: "Il est fatigué et grognon, il n’est pas comme d’habitude. Moi, je n’ai presque pas dormi depuis deux nuits.",
    previousEpisodes: "Il a déjà eu une petite diarrhée l’hiver dernier, mais ça avait passé en deux jours, rien à voir avec ça.",
    course: "Avant-hier soir il a commencé à vomir, beaucoup hier, puis la diarrhée a suivi. Aujourd’hui il vomit moins, mais la diarrhée continue et il est de plus en plus fatigué.",
    otherSymptoms: "Il a un peu de fièvre depuis hier.",
    medications: "Rien de régulier. Je lui ai donné un suppositoire de paracétamol hier soir pour la fièvre.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Né à terme, grossesse sans problème. Jamais hospitalisé, pas de maladie chronique. Il grandit bien selon le pédiatre.",
    familyHistory: "Pas de maladie particulière dans la famille. Par contre, mon mari a aussi la diarrhée depuis hier soir.",
    tobacco: "Personne ne fume à la maison.",
    alcohol: "Non, rien de ce côté-là.",
    drugs: "Non.",
    concerns: "Est-ce qu’il faut le mettre sous perfusion ? J’ai peur qu’il se déshydrate et je ne sais pas quoi lui donner à boire.",
  },
  rules: [
    { topic: "vomissements", keywords: VOMITING, reply: "Il a vomi six ou sept fois hier, surtout ce qu’il venait de boire ou de manger. Depuis ce matin, deux fois seulement, quand il boit trop vite. Ce n’était jamais vert, et il n’y avait pas de sang." },
    { topic: "aspect des vomissements", keywords: BILE, reply: "Non, ce n’était pas vert, c’était du lait ou ce qu’il avait mangé, puis juste un peu de liquide clair." },
    { topic: "diarrhée", keywords: [...STOOLS, "liquide$"], reply: "Depuis hier matin, au moins huit selles très liquides, jaunâtres, qui débordent de la couche. Encore deux depuis ce matin." },
    { topic: "sang dans les selles", keywords: BLOOD, reply: "Non, pas de sang ni de glaires dans les selles, j’ai bien regardé." },
    { topic: "fièvre", keywords: FEVER, reply: "38,6 °C hier soir, et 38,2 °C ce matin. Je lui ai donné un suppositoire de paracétamol hier soir." },
    { topic: "apports", keywords: INTAKE, reply: "Il réclame à boire, mais s’il boit beaucoup d’un coup, il vomit. Je lui ai surtout donné de l’eau et un peu de jus de pomme. Il ne mange presque plus rien depuis hier." },
    { topic: "diurèse", keywords: DIURESIS, reply: "Ses couches sont beaucoup moins mouillées : depuis ce matin à six heures, une seule couche à peine humide, avec un pipi foncé." },
    { topic: "poids", keywords: WEIGHT, reply: "Chez le pédiatre, il y a trois semaines, il pesait 11,3 kilos. Je ne l’ai pas pesé depuis." },
    { topic: "larmes et bouche", keywords: ["larme", "bouche", "levre", "langue", "yeux", "cerne", "creux", "salive"], reply: "Il pleure presque sans larmes, ses lèvres sont sèches et il a les yeux cernés." },
    { topic: "comportement", keywords: LETHARGY, reply: "Il est fatigué et grognon, il dort plus que d’habitude, mais il se réveille facilement, il me reconnaît et il a joué un peu avec mes clés dans la salle d’attente." },
    { topic: "douleurs abdominales", keywords: ["ventre", "douleur", "crampe", "plie", "crise de pleurs", "crises de pleurs", "hurle", "tortille", "pale", "palit"], reply: "Il se tient parfois le ventre et pleure un peu juste avant les selles, mais entre deux il est calme. Il ne fait pas de grosses crises où il devient tout pâle." },
    { topic: "contage", keywords: ["creche", "contact", "contag", "malade autour", "d autres enfants", "votre mari", "son papa", "son pere"], reply: "À la crèche, plusieurs enfants ont eu la gastro la semaine dernière. Et mon mari a la diarrhée depuis hier soir." },
    { topic: "voyage et alimentation", keywords: ["voyage", "etranger", "restaurant", "aliment", "nourriture", "eau du robinet", "puits"], reply: "Non, pas de voyage. Il mange à la maison et à la crèche, rien d’inhabituel." },
    { topic: "autres foyers", keywords: ["toux", "tousse", "nez", "rhume", "oreille", "gorge", "bouton", "eruption", "tache", "respir"], reply: "Non, pas de rhume ni de toux, il ne se touche pas les oreilles et il n’a pas de boutons sur la peau." },
    { topic: "vaccins", keywords: ["vaccin", "carnet"], reply: "Tous ses vaccins sont à jour, j’ai le carnet avec moi." },
    { topic: "développement", keywords: ["developpement", "marche", "parle", "mots", "croissance", "courbe"], reply: "Il marche depuis ses 13 mois et dit une dizaine de mots. Le pédiatre dit qu’il suit bien sa courbe." },
    { topic: "début", keywords: ONSET, reply: "Ça a commencé avant-hier soir par des vomissements, et la diarrhée a suivi hier matin." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 38,1 °C, FC 148/min, FR 30/min, TA 92/58 mmHg, SpO₂ 99 % à l’air ambiant." },
    { topic: "hydratation", examiner: true, keywords: ["hydratation", "deshydrat", "muqueuse", "recoloration", "trc", "pli cutane", "fontanelle", "extremites"], reply: "Enfant fatigué mais éveillé, réactif et consolable, suit du regard. Muqueuses sèches, yeux légèrement enfoncés et cernés, pleurs avec peu de larmes. Temps de recoloration 2 à 3 secondes, extrémités tièdes, pli cutané s’effaçant lentement mais pas persistant. Fontanelle antérieure fermée, non contributive à cet âge. Pas de marbrures." },
    { topic: "examen abdominal", examiner: true, keywords: ["palp", "abdomen", "ventre", "auscult", "bruits", "defense", "masse", "boudin", "examen clinique", "examen physique", "je l examine"], reply: "Abdomen souple, non distendu, légèrement sensible de façon diffuse sans défense. Bruits intestinaux augmentés. Pas de masse palpable, pas d’hépatosplénomégalie. Érythème fessier discret." },
    { topic: "méninges et peau", examiner: true, keywords: ["meninge", "nuque", "kernig", "brudzinski", "purpura", "vitropression", "peau"], reply: "Pas de raideur de nuque. Peau sans purpura ni éruption." },
    { topic: "glycémie", examiner: true, keywords: ["glycemie", "sucre", "dextro", "glucose"], reply: "Glycémie capillaire 4,3 mmol/L." },
    planReaction("D’accord… mais s’il vomit ce que vous lui donnez ? Et je lui donne quoi, exactement, à la maison ?", ["rehydrat", "solution", "sachet", "seringue", "cuillere", "ondansetron", "perfusion", "rentrer", "a la maison"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "pesee", label: "Pesée de l’enfant", category: "constantes", pertinent: true, covers: ["poids"], result: "Poids 10,6 kg, déshabillé. Il pesait 11,3 kg il y a trois semaines chez le pédiatre : perte d’environ 0,7 kg, soit environ 6 %." },
    { id: "deshydratation", label: "Signes de déshydratation et état général", category: "constantes", pertinent: true, topic: "hydratation", covers: ["hydratation", "etat-general"], key: ["hydratation"] },
    { id: "abdomen", label: "Examen de l’abdomen et du siège", category: "examen", pertinent: true, topic: "examen abdominal", covers: ["palpation-abdominale", "auscultation-abdominale", "signes-peritoneaux"], key: ["palpation-abdominale"] },
    { id: "meninges-peau", label: "Signes méningés et inspection de la peau", category: "examen", pertinent: true, topic: "méninges et peau", covers: ["signes-meninges", "peau"] },
    { id: "glycemie", label: "Glycémie capillaire", category: "complementaire", pertinent: true, topic: "glycémie" },
    { id: "radio-abdomen", label: "Radiographie de l’abdomen sans préparation", category: "complementaire", pertinent: false, covers: ["radio-abdomen"], result: "Non indiquée : abdomen souple, non distendu, vomissements non bilieux ; aucun signe d’occlusion." },
    { id: "echo-abdominale", label: "Échographie abdominale", category: "complementaire", pertinent: false, covers: ["echo-abdominale"], result: "Non indiquée ici : pas de crises douloureuses paroxystiques avec pâleur, pas de masse, pas de sang dans les selles. À demander si l’on suspecte une invagination." },
    { id: "bilan-inflammatoire", label: "Formule sanguine et CRP", category: "complementaire", pertinent: false, covers: ["fsc", "crp"], result: "Leucocytes 11,8 G/L, CRP 12 mg/L : n’apportent rien à la décision. Non nécessaires dans une diarrhée aiguë sans sang, sans signe de sepsis, chez un enfant réhydraté par voie orale." },
  ],
  catalogResults: {
    "bandelette": "Bandelette urinaire (poche) : cétones ++, densité 1,030, pas de leucocytes ni de nitrites.",
    "cetonemie": "Cétonémie capillaire 1,8 mmol/L.",
    "gazometrie": "Gazométrie veineuse : pH 7,34, pCO₂ 4,3 kPa, bicarbonates 18 mmol/L, excès de base −6 mmol/L : acidose métabolique légère.",
    "creatinine": "Créatinine 34 µmol/L, urée 7,1 mmol/L (légèrement augmentée).",
    "ionogramme": "Na 137 mmol/L, K 3,8 mmol/L, Cl 106 mmol/L, Ca et Mg dans les normes.",
  },
  acceptable: ["bandelette", "cetonemie", "ionogramme", "gazometrie", "creatinine", "examen-orl"],
  diagnosisChoice: { correct: "Gastro-entérite aiguë avec déshydratation modérée", distractors: ["Invagination intestinale aiguë", "Sténose hypertrophique du pylore", "Infection urinaire fébrile"] },
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Caractérise les symptômes digestifs",
      hint: "Début, vomissements (nombre, évolution), diarrhée (nombre, aspect), fièvre",
      points: 4,
      groups: [ONSET, VOMITING, STOOLS, FEVER],
    },
    {
      id: "dehydration",
      label: "Évalue l’hydratation à l’anamnèse",
      hint: "Apports (ce qu’il boit et garde), diurèse (couches mouillées), poids antérieur",
      points: 3,
      groups: [INTAKE, DIURESIS, WEIGHT],
    },
    {
      id: "red-flags",
      label: "Recherche les signes d’alarme",
      hint: "Sang dans les selles, vomissements verts (bilieux), somnolence ou léthargie",
      points: 3,
      groups: [BLOOD, BILE, LETHARGY],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen et examens ciblés",
      hint: "Constantes, pesée, signes de déshydratation (muqueuses, temps de recoloration), examen abdominal, glycémie",
      points: 3,
      groups: [VITALS, ["hydrat", "muqueuse", "recoloration", "pese"], ["abdomen", "ventre", "palp"]],
    },
    {
      id: "management",
      label: "Explique la réhydratation orale et la surveillance",
      hint: "Solution de réhydratation orale, en petites quantités fréquentes, poursuite de l’alimentation, signes qui doivent faire reconsulter",
      points: 3,
      groups: [
        ["solution de rehydratation", "solute de rehydratation", "rehydratation orale", "sro$", "oralpaedon", "oralpadon", "normolytoral", "sachet"],
        ["petites quantites", "petite quantite", "petites gorgees", "cuillere", "seringue", "5 ml", "toutes les", "fractionn", "petit a petit"],
        ["alimentation", "continuer a manger", "continuer de manger", "realiment", "repas", "manger normalement", "son lait"],
        ["reconsult", "revenir", "revenez", "signes d alarme", "reevalu", "surveill", "rappeler", "s il ne boit", "s il vomit"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Gastro-entérite aiguë, probablement virale, avec déshydratation modérée (environ 6 %)",
    summary: "Garçon de 18 mois, gardé en crèche avec contage, qui présente depuis deux jours des vomissements puis une diarrhée liquide abondante, sans sang, avec une fièvre modérée. Il a perdu environ 6 % de son poids, a peu uriné depuis le matin, a des muqueuses sèches, peu de larmes, un temps de recoloration de 2 à 3 s et une tachycardie, mais reste éveillé et réactif : déshydratation modérée, sans signe de choc ni d’alarme chirurgicale. La réhydratation orale par solution de réhydratation, donnée en petites quantités fréquentes, est le traitement de première intention.",
    keyFindings: [
      "Vomissements puis diarrhée aqueuse aiguë, fièvre modérée, contage en crèche et dans la famille.",
      "Perte de poids d’environ 0,7 kg (6 %), diurèse diminuée, muqueuses sèches, peu de larmes, yeux cernés.",
      "Temps de recoloration 2 à 3 s, tachycardie à 148/min, mais enfant éveillé, réactif, extrémités tièdes : pas de choc.",
      "Pas de sang dans les selles, vomissements non bilieux, abdomen souple sans masse ; glycémie normale.",
    ],
    redFlags: [
      "Léthargie, enfant difficile à réveiller, temps de recoloration > 3 s, extrémités froides, marbrures ou pouls filant : déshydratation sévère ou choc, réhydratation intraveineuse en urgence.",
      "Vomissements verts (bilieux), ventre distendu ou crises de douleur avec pâleur : occlusion ou invagination, avis chirurgical et échographie.",
      "Sang dans les selles, pâleur, oligo-anurie : diarrhée bactérienne invasive ou syndrome hémolytique et urémique, bilan sanguin et rénal.",
      "Fièvre élevée, purpura, raideur de nuque, âge < 6 mois ou échec de la réhydratation orale : surveillance hospitalière.",
    ],
    management: [
      "Réhydratation orale avec une solution de réhydratation orale hypo-osmolaire (p. ex. Oralpädon, Normolytoral) : environ 50 à 100 mL/kg sur 4 heures, soit ici 500 à 1000 mL, par 5 mL toutes les 1 à 2 minutes à la seringue ou à la cuillère ; puis compenser les pertes (environ 10 mL/kg par selle liquide, 2 mL/kg par vomissement).",
      "Pas d’eau seule, de jus ni de sodas pour réhydrater ; poursuivre l’alimentation habituelle dès que les vomissements cèdent, sans régime restrictif.",
      "Si les vomissements empêchent la réhydratation orale : une dose unique d’ondansétron (0,15 mg/kg, ici environ 1,6 mg) avant la reprise de la réhydratation ; sonde nasogastrique ou voie intraveineuse en cas d’échec.",
      "Réévaluer aux urgences après la réhydratation (poids, diurèse, état général) avant le retour à domicile ; pas d’antidiarrhéique type lopéramide, pas d’antibiotique.",
      "Consignes écrites aux parents : reconsulter si l’enfant ne boit plus ou vomit tout, n’urine plus, devient somnolent, a du sang dans les selles ou des vomissements verts ; hygiène des mains et des couches pour limiter la transmission.",
    ],
    differentials: [
      "Invagination intestinale aiguë (crises douloureuses paroxystiques avec pâleur, selles sanglantes, masse abdominale).",
      "Infection extradigestive avec vomissements : infection urinaire, otite moyenne, méningite.",
      "Appendicite (rare à cet âge, souvent perforée), occlusion intestinale.",
      "Acidocétose diabétique inaugurale (polyurie, polydipsie, respiration ample ; glycémie normale ici).",
    ],
    sources: [
      { label: "ESPGHAN/ESPID 2014 — Evidence-based guidelines for the management of acute gastroenteritis in children in Europe", url: "https://doi.org/10.1097/MPG.0000000000000375" },
      { label: "NICE CG84 — Diarrhoea and vomiting caused by gastroenteritis in under 5s: diagnosis and management", url: "https://www.nice.org.uk/guidance/cg84" },
    ],
    pathologySlugs: ["gastro-enterite-aigue", "diarrhees-enfant", "vomissements-enfant"],
  },
};

export const gastroEnteriteDeshydratationDiagnoses: StationDiagnoses = {
  accepted: ["gastro-enterite", "deshydratation"],
  differentials: [
    { label: "Invagination intestinale aiguë ou occlusion", ids: ["invagination", "occlusion-intestinale"] },
    { label: "Infection extradigestive : infection urinaire, otite, méningite", ids: ["pyelonephrite-aigue", "cystite", "otite-moyenne", "meningite-bacterienne"] },
    { label: "Appendicite", ids: ["appendicite"] },
    { label: "Acidocétose diabétique inaugurale", ids: ["acidocetose-diabetique"] },
  ],
};
