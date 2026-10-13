import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { communicationCriterion, DYSPNEA, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "../shared.ts";

const DURATION = ["duree", "dure$", "durent", "dure combien", "minutes", "longtemps", "combien de temps dure", "combien de temps durent"];
const TRIGGER = ["declench", "circonstance", "que faisiez", "faisiez vous", "au repos", "dans quelle situation", "dans quelles situations", "ou etiez", "la nuit", "quel moment", "dans quelles"];
const FREQUENCY = ["combien de crises", "combien de fois", "frequen", "souvent", "par semaine", "nombre", "plusieurs"];
const PALPITATIONS = ["palpit", "coeur qui bat", "coeur bat", "battement", "regulier", "irregulier", "s emballe", "rapide", "vite$"];
const CHEST = ["oppress", "serre", "poitrine", "douleur", "mal au thorax", ...DYSPNEA];
const AUTONOMIC = ["transpir", "sueur", "trembl", "fourmill", "picot", "engourdi", "autour de la bouche", "vertige", "tete qui tourne", "irreel", "nausee"];
const FEAR = ["peur", "mourir", "fou$", "folle", "perdre le controle", "angoiss", "panique"];
const CARDIAC_RED_FLAGS = ["malaise", "evanoui", "perte de connaissance", "connaissance", "syncope", "effort", "sport"];
const THYROID_SIGNS = ["maigri", "perdu du poids", "poids", "chaleur", "chaud", "transit", "diarrh", "goitre"];
const SUBSTANCES = ["cafe", "cafeine", "energisant", "boisson energ", "stimul", "drogue", "cannabis", "cocaine", "substance", "amphet", "alcool"];
const AVOIDANCE = ["evit", "anticip", "recommence", "prochaine", "entre les crises", "metro", "transport", "sortir"];
const MOOD = ["moral", "triste", "deprim", "plaisir", "plus envie", "humeur", "suicid", "idees noires", "en finir"];
const STRESS = ["stress", "evenement", "changement", "pression", "difficult", "soucis"];

export const troublePanique: EcosScenario = {
  slug: "trouble-panique",
  version: 1,
  setting: "cabinet",
  patient: { name: "Mme Perrin", age: 26, sex: "F" },
  persona: "Jeune femme tendue, qui parle un peu vite et s’excuse de « faire des histoires ». Elle a peur d’avoir une maladie du cœur, mais elle répond volontiers et en détail aux questions posées simplement. Elle se détend quand on l’écoute et qu’on lui explique.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "Mme Perrin, 26 ans, consulte au cabinet pour des crises où son cœur s’emballe et où elle se sent oppressée.",
    "Menez l’anamnèse, réalisez un examen clinique ciblé (status), puis proposez votre hypothèse diagnostique et la suite.",
  ],
  opening: "Bonjour docteur. Depuis deux mois, j’ai des crises où mon cœur s’emballe, je me sens oppressée et j’ai l’impression que je vais mourir.",
  history: {
    identity: "Sophie Perrin, 26 ans.",
    occupation: "Je suis comptable dans une fiduciaire à Lausanne, j’ai commencé il y a quatre mois.",
    living: "J’habite avec mon copain depuis cet été, dans un appartement à Renens.",
    feeling: "Là, ça va, mais j’ai un peu peur qu’une crise arrive ici.",
    previousEpisodes: "Avant ces deux derniers mois, jamais. Petite, j’étais déjà assez stressée avant les examens, mais rien de pareil.",
    course: "Les crises sont de plus en plus fréquentes, et maintenant j’ai peur toute la journée qu’il y en ait une autre.",
    otherSymptoms: "Entre les crises, je suis tendue et j’ai peur que ça revienne.",
    medications: "Seulement la pilule. Pas d’autre médicament, ni de spray pour le nez ou pour respirer.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Rien de particulier, je n’ai jamais été malade. Pas d’asthme, jamais opérée.",
    familyHistory: "Ma mère est très anxieuse, elle a pris un traitement pour les nerfs pendant des années. Mon père a de la tension. Personne n’est mort jeune ou subitement dans la famille.",
    tobacco: "Non, je n’ai jamais fumé.",
    alcohol: "Un ou deux verres le week-end, pas plus. Par contre, je bois trois ou quatre cafés par jour.",
    drugs: "J’ai essayé le cannabis deux ou trois fois vers 18 ans, plus rien depuis. Jamais de cocaïne ni d’autre chose.",
    concerns: "J’ai peur d’avoir quelque chose au cœur que les urgences n’ont pas vu, ou de mourir pendant une crise.",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "La première, c’était il y a deux mois, dans le métro, le matin en allant au travail. D’un coup, mon cœur s’est emballé. J’ai cru que je faisais une crise cardiaque." },
    { topic: "durée", keywords: DURATION, reply: "Ça monte très vite, c’est au pire au bout de cinq ou dix minutes, et en un quart d’heure, vingt minutes, ça passe. Après, je suis vidée." },
    { topic: "circonstances", keywords: TRIGGER, reply: "N’importe quand : dans le métro, au supermarché, mais aussi tranquille sur le canapé, et une fois ça m’a réveillée la nuit. Jamais pendant le sport." },
    { topic: "fréquence", keywords: FREQUENCY, reply: "Six ou sept en deux mois. Maintenant, c’est à peu près deux par semaine." },
    { topic: "palpitations", keywords: PALPITATIONS, reply: "Mon cœur bat très vite et très fort, régulier je crois. Ça monte et ça redescend progressivement, ça ne s’arrête pas d’un coup comme un interrupteur." },
    { topic: "oppression", keywords: ["oppress", "serre", "poitrine", "douleur", "mal au thorax", "thorax"], reply: "C’est une oppression dans la poitrine, comme si on me serrait, plus qu’une vraie douleur. Ça ne va pas dans le bras ni dans la mâchoire." },
    { topic: "respiration", keywords: DYSPNEA, reply: "J’ai l’impression de ne pas avoir assez d’air et je respire très vite. Entre les crises, je respire normalement, même au volley." },
    { topic: "signes associés", keywords: AUTONOMIC, reply: "Je transpire, je tremble, j’ai des fourmis dans les mains et autour de la bouche, la tête qui tourne, et parfois l’impression que tout est irréel autour de moi." },
    { topic: "peur", keywords: FEAR, reply: "Pendant la crise, j’ai vraiment peur de mourir, ou de devenir folle, de perdre le contrôle." },
    { topic: "malaise et effort", keywords: CARDIAC_RED_FLAGS, reply: "Je n’ai jamais perdu connaissance. Au volley, deux fois par semaine, je n’ai jamais eu de crise ni de douleur, je cours sans problème." },
    { topic: "thyroïde", keywords: [...THYROID_SIGNS, "thyro", "nerveu", "agitee"], reply: "Mon poids est stable, je n’ai pas spécialement chaud, le transit est normal. Entre les crises, je suis inquiète, mais pas agitée." },
    { topic: "café et stimulants", keywords: ["cafe", "cafeine", "energisant", "boisson energ", "stimul", "the$", "coca"], reply: "Trois ou quatre cafés par jour, un peu plus en période de bouclement. Pas de boissons énergisantes." },
    { topic: "repas", keywords: ["repas", "manger", "mange", "faim", "sucre", "jeun"], reply: "Ça n’a rien à voir avec les repas, j’en ai même eu juste après avoir mangé." },
    { topic: "anticipation et évitement", keywords: AVOIDANCE, reply: "Entre les crises, j’ai tout le temps peur que ça recommence. Je ne prends plus le métro, je prends le bus, et j’évite les grandes surfaces quand je suis seule." },
    { topic: "humeur", keywords: [...MOOD, "votre moral", "le moral"], reply: "Le moral, ça va : je profite encore de mes week-ends et de mes amis. Je n’ai jamais eu d’idées noires ni pensé à en finir." },
    { topic: "sommeil", keywords: ["dorm", "sommeil", "endor", "reveil", "insomn"], reply: "Je m’endors bien. Une seule fois une crise m’a réveillée la nuit, sinon je dors correctement." },
    { topic: "stress et contexte", keywords: [...STRESS, "stress au travail", "stresse au travail", "pression au travail"], reply: "Pas mal de changements : nouveau travail il y a quatre mois, avec beaucoup de pression en ce moment, et on a emménagé ensemble cet été. Mais rien de grave, ça se passe bien avec mon copain." },
    { topic: "consultation aux urgences", keywords: ["urgence", "deja consulte", "deja vu un medecin", "deja fait des examens", "electro"], reply: "Après la première crise, je suis allée aux urgences. On m’a fait un électrocardiogramme et une prise de sang, tout était normal. On m’a dit que c’était sûrement le stress." },
    { topic: "contraception", keywords: ["regles", "enceinte", "grossesse", "pilule", "contracep"], reply: "Je prends la pilule sans oubli, mes règles sont régulières." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 124/78 mmHg, FC 86/min régulière, FR 16/min, SpO₂ 99 % à l’air ambiant, T 36,7 °C. Patiente un peu tendue, en bon état général." },
    { topic: "auscultation cardiaque", examiner: true, keywords: ["auscult", "bruits du coeur", "souffle au coeur"], reply: "Bruits du cœur réguliers à 86/min, sans souffle, sans frottement ni bruit surajouté." },
    { topic: "auscultation pulmonaire", examiner: true, keywords: ["auscultation pulmonaire", "ausculte les poumons", "murmure"], reply: "Murmure vésiculaire symétrique, sans sibilance ni crépitant. Pas de signe de lutte respiratoire." },
    { topic: "thyroïde (examen)", examiner: true, keywords: ["palpe la thyroide", "palpation de la thyroide", "examen de la thyroide", "palpe le cou", "palpation du cou"], reply: "Thyroïde non palpable, sans nodule ni goitre. Pas de tremblement fin des extrémités, pas d’exophtalmie." },
    { topic: "état mental", examiner: true, keywords: ["etat mental", "etat psychique", "examen psy"], reply: "Patiente orientée, bon contact, discours cohérent et un peu rapide. Anxiété visible, humeur globalement préservée, pas d’idée suicidaire, pas de symptôme psychotique." },
    { topic: "ECG", examiner: true, keywords: ["ecg", "electrocardiogramme"], reply: "ECG : rythme sinusal à 84/min, PR 150 ms, QRS fins, QTc 410 ms, pas d’onde delta, pas de trouble de la repolarisation." },
    { topic: "TSH", examiner: true, keywords: ["tsh", "bilan thyroidien"], reply: "TSH 1,8 mU/L (norme 0,3–4,0)." },
    planReaction("Donc ce n’est pas le cœur ? Et qu’est-ce que je peux faire quand une crise arrive ?", ["respir", "psychoth", "therapie", "cognitiv", "tcc", "antidepress", "isrs", "revoir", "controle", "rendez vous"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes"] },
    { id: "auscultation-cardiaque", label: "Auscultation cardiaque", category: "examen", pertinent: true, topic: "auscultation cardiaque", covers: ["auscultation-cardiaque"] },
    { id: "auscultation-pulmonaire", label: "Auscultation pulmonaire", category: "examen", pertinent: true, topic: "auscultation pulmonaire", covers: ["auscultation-pulmonaire"] },
    { id: "thyroide", label: "Palpation de la thyroïde", category: "examen", pertinent: true, topic: "thyroïde (examen)", covers: ["thyroide"] },
    { id: "etat-mental", label: "Examen de l’état mental", category: "examen", pertinent: true, topic: "état mental", covers: ["etat-mental"] },
    { id: "ecg", label: "ECG 12 dérivations", category: "complementaire", pertinent: true, topic: "ECG", covers: ["ecg"], image: { src: "/ecos/ecg/blanc-09.svg", alt: "ECG 12 dérivations, avec DII long" } },
    { id: "tsh", label: "TSH", category: "complementaire", pertinent: true, topic: "TSH", covers: ["tsh"] },
    { id: "echocardiographie", label: "Échocardiographie", category: "complementaire", pertinent: false, result: "Non indiquée en première intention : pas de souffle, ECG normal, aucun symptôme à l’effort.", covers: ["echocardiographie"] },
    { id: "angio-ct", label: "Angio-CT pulmonaire", category: "complementaire", pertinent: false, result: "Non indiqué : aucun facteur de risque thromboembolique, crises brèves et récidivantes, respiration normale entre les crises.", covers: ["ct-thoracique"] },
    { id: "d-dimeres", label: "D-dimères", category: "complementaire", pertinent: false, result: "Non indiqués : pas de suspicion clinique d’embolie pulmonaire.", covers: ["d-dimeres"] },
    { id: "eeg", label: "Électroencéphalogramme", category: "complementaire", pertinent: false, result: "Non indiqué : aucune perte de connaissance ni mouvement anormal, conscience conservée pendant les crises.", covers: ["eeg"] },
  ],
  catalogResults: {
    "etat-general": "Jeune femme en bon état général, un peu tendue, sans pâleur ni sueurs au repos.",
    "phq9": "PHQ-9 : 6/27, symptômes dépressifs légers, pas d’idée suicidaire.",
    "poids": "Poids 61 kg pour 168 cm, stable selon la patiente.",
  },
  acceptable: ["fsc", "ionogramme", "phq9", "alcool-toxiques", "poids", "examen-neurologique", "pouls-peripheriques"],
  diagnosisChoice: { correct: "Trouble panique (attaques de panique récidivantes)", distractors: ["Tachycardie jonctionnelle", "Hyperthyroïdie", "Trouble anxieux généralisé"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "attacks",
      label: "Caractérise les crises",
      hint: "Début, durée et pic, circonstances (spontanées, au repos, la nuit), fréquence",
      points: 3,
      groups: [ONSET, DURATION, TRIGGER, FREQUENCY],
    },
    {
      id: "symptoms",
      label: "Recherche les symptômes de la crise",
      hint: "Palpitations (régulières, début progressif), oppression et sensation de manque d’air, sueurs, tremblements, paresthésies, peur de mourir",
      points: 3,
      groups: [PALPITATIONS, CHEST, AUTONOMIC, FEAR],
    },
    {
      id: "organic",
      label: "Écarte une cause organique",
      hint: "Malaise ou symptôme à l’effort (cause cardiaque), signes d’hyperthyroïdie, café, drogues et stimulants",
      points: 3,
      groups: [CARDIAC_RED_FLAGS, THYROID_SIGNS, SUBSTANCES],
    },
    {
      id: "context",
      label: "Explore le retentissement et le contexte",
      hint: "Anxiété anticipatoire et évitement, humeur et idées suicidaires, facteurs de stress",
      points: 2,
      groups: [AVOIDANCE, MOOD, STRESS],
    },
    {
      id: "terrain",
      label: "Recherche les antécédents",
      hint: "Antécédents personnels, familiaux (anxiété, mort subite), tabac",
      points: 1,
      groups: [
        ["antecedent", "maladie", "probleme de sante", "problemes de sante", "asthme", "deja ete malade", "opere"],
        ["famille", "familia", "parents", "votre pere", "votre mere", "hereditaire", "mort subite"],
        ["fume", "fumez", "tabac", "cigarette"],
      ],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes, auscultation cardiaque et pulmonaire, palpation de la thyroïde, état mental ; ECG et TSH",
      points: 5,
      groups: [["status cardio pulmonaire"], ["goitre"], ["etat psychique"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Trouble panique : attaques de panique récidivantes et inattendues avec anxiété anticipatoire et évitement",
    summary: "Femme de 26 ans qui présente depuis deux mois des crises brèves (pic en quelques minutes, résolution en 15 à 20 minutes), parfois au repos ou la nuit, avec palpitations régulières à début et fin progressifs, oppression, sensation de manque d’air, sueurs, tremblements, paresthésies et peur de mourir. Entre les crises, elle craint la suivante et évite le métro. Pas de malaise ni de symptôme à l’effort, pas de signe d’hyperthyroïdie, pas de drogue. Status, ECG et TSH normaux : trouble panique, sur un terrain de stress professionnel et d’antécédent familial anxieux.",
    keyFindings: [
      "Crises récidivantes et inattendues, au moins quatre symptômes physiques, pic en moins de dix minutes.",
      "Anxiété anticipatoire et évitement (métro, grandes surfaces) depuis plus d’un mois.",
      "Absence de syncope, de symptôme à l’effort et d’antécédent familial de mort subite ; palpitations régulières à début progressif.",
      "Status normal, ECG sinusal sans pré-excitation ni QT long, TSH normale.",
    ],
    redFlags: [
      "Syncope, palpitations ou douleur à l’effort, antécédent familial de mort subite : bilan cardiologique (arythmie, cardiomyopathie).",
      "Début et fin brusques « comme un interrupteur », fréquence très élevée : rechercher une tachycardie supraventriculaire (ECG pendant la crise, Holter).",
      "Perte de poids, intolérance à la chaleur, tremblement permanent : hyperthyroïdie.",
      "Idées suicidaires ou consommation de substances pour se calmer (alcool, benzodiazépines) : évaluer et prendre en charge.",
    ],
    management: [
      "Expliquer le mécanisme de la crise et son caractère non dangereux (psychoéducation), en validant la réalité des symptômes.",
      "Techniques de respiration et de gestion de la crise ; réduire le café.",
      "Thérapie cognitivo-comportementale en première intention ; ISRS (sertraline ou escitalopram, à faible dose au début) si les symptômes persistent ou sont invalidants.",
      "Éviter les benzodiazépines au long cours ; revoir la patiente dans deux à quatre semaines.",
    ],
    differentials: [
      "Tachycardie supraventriculaire (début et fin brusques, ECG pendant la crise).",
      "Hyperthyroïdie (TSH), hypoglycémie, phéochromocytome (rare : HTA paroxystique, céphalées).",
      "Prise de substances : café en excès, stimulants, cannabis, cocaïne, sevrage d’alcool.",
      "Trouble anxieux généralisé ou épisode dépressif associé.",
    ],
    sources: [
      { label: "NICE CG113 (2011, mise à jour 2020) — Generalised anxiety disorder and panic disorder in adults: management", url: "https://www.nice.org.uk/guidance/cg113" },
      { label: "NICE CKS — Panic disorder", url: "https://cks.nice.org.uk/topics/panic-disorder/" },
    ],
    pathologySlugs: ["troubles-anxieux", "tachycardies-supraventriculaires", "hyperthyroidie"],
  },
};

export const troublePaniqueDiagnoses: StationDiagnoses = {
  accepted: ["attaque-panique"],
  differentials: [
    { label: "Trouble du rythme : tachycardie jonctionnelle, fibrillation auriculaire", ids: ["tachycardie-jonctionnelle", "fibrillation-auriculaire"] },
    { label: "Hyperthyroïdie", ids: ["hyperthyroidie"] },
    { label: "Hypoglycémie ou prise de substances", ids: ["hypoglycemie", "intoxication"] },
    { label: "Trouble anxieux généralisé, épisode dépressif", ids: ["trouble-anxieux", "episode-depressif-majeur"] },
  ],
};
