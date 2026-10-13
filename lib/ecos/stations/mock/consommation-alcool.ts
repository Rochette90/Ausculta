import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { communicationCriterion, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "../shared.ts";

const SLEEP = ["dorm", "sommeil", "endor", "reveil", "insomn", "nuit"];
const FATIGUE = ["fatigu", "epuise", "energie", "forme$", "force", "creve"];
const DRINKING = ["alcool", "boire", "buvez", "boisson", "vin$", "biere", "apero"];
const QUANTITY = ["combien de verres", "combien buvez", "combien d alcool", "quelle quantite", "quantite", "par jour", "par semaine", "bouteille", "verres", "unite", "chaque jour", "tous les jours", "audit"];
const TOLERANCE = ["depuis quand buvez", "depuis combien de temps buvez", "augment", "plus qu avant", "toleran", "tenez", "supportez", "besoin de plus", "alcool fort", "spiritueux", "whisky", "liqueur", "eau de vie"];
const CUT_DOWN = ["reduire", "diminuer", "arreter de boire", "arrete de boire", "moins boire", "boire moins", "essaye", "pause", "janvier", "cage$"];
const ANNOYED = ["reproche", "critique", "votre femme", "votre epouse", "entourage", "agace", "remarque", "s inquiete", "se plaint"];
const GUILTY = ["culpab", "coupable", "honte", "regret", "vous en voulez"];
const MORNING = ["le matin", "au reveil", "a jeun", "des le matin", "trembl", "manque", "sevrage"];
const SOCIAL = ["consequence", "retentissement", "probleme au travail", "au travail", "absent", "en retard", "conduire", "conduisez", "volant", "permis", "accident", "police", "dispute", "conflit", "couple"];
const PHYSICAL = ["chute", "tombe", "cogne", "bleu", "blesse", "jaune", "ventre", "selles", "vomi", "sang$", "appetit", "poids", "maigri", "nausee", "fourmill", "engourdi", "picot", "equilibre", "memoire", "oubli", "concentr"];
const MOOD = ["moral", "triste", "deprim", "plaisir", "plus envie", "humeur", "suicid", "idees noires", "en finir"];
const MOTIVATION = ["pret a", "prete a", "envie de changer", "motiv", "importance", "important pour vous", "sur une echelle", "confiance", "avantage", "inconvenient", "changer quelque chose", "objectif", "qu en pensez vous", "ce que vous en pensez"];

export const consommationAlcool: EcosScenario = {
  slug: "consommation-alcool",
  version: 1,
  setting: "cabinet",
  patient: { name: "M. Despland", age: 52, sex: "M" },
  persona: "Homme jovial mais un peu sur la défensive au début quand on parle d’alcool (« comme tout le monde »). Il répond honnêtement si on pose les questions sans jugement, reconnaît qu’il boit trop et se montre ambivalent : il veut bien diminuer, mais doute d’y arriver.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "M. Despland, 52 ans, consulte au cabinet pour une fatigue persistante et des nuits difficiles.",
    "Menez l’anamnèse, réalisez un examen clinique ciblé (status), puis proposez votre hypothèse diagnostique et la suite.",
  ],
  opening: "Bonjour docteur. Je suis fatigué tout le temps et je dors mal depuis quelques mois. C’est ma femme qui a insisté pour que je vienne.",
  history: {
    identity: "Philippe Despland, 52 ans.",
    occupation: "Je suis représentant commercial pour du matériel de cuisine professionnelle. Je fais beaucoup de route et pas mal de repas avec les clients.",
    living: "Je vis avec ma femme à Yverdon. Nos deux enfants sont grands, ils ont quitté la maison.",
    feeling: "Fatigué, sans énergie, et un peu à cran ces temps.",
    previousEpisodes: "Fatigué, ça m’arrive comme tout le monde, mais jamais aussi longtemps.",
    course: "Ça s’est installé petit à petit depuis l’automne, depuis que les ventes vont moins bien. C’est plutôt de pire en pire.",
    otherSymptoms: "Je me réveille la nuit vers trois heures et je n’arrive plus à me rendormir.",
    medications: "Un comprimé pour la tension, de l’amlodipine. Et parfois un Dafalgan le matin pour le mal de tête.",
    allergies: "Pas d’allergie.",
    personalHistory: "Un peu de tension depuis cinq ans. Une fois, à une prise de sang pour l’assurance, on m’a dit que j’avais le foie un peu gras. Jamais opéré.",
    familyHistory: "Mon père buvait beaucoup, il est mort d’une cirrhose à 64 ans. Ma mère va bien, elle a 78 ans.",
    tobacco: "J’ai arrêté il y a dix ans. Avant, un paquet par jour pendant vingt ans.",
    alcohol: "Comme tout le monde… Un ou deux verres de vin à midi avec les clients, le soir deux ou trois bières à l’apéro, puis une demi-bouteille de vin au repas. Le week-end, plutôt plus. Jamais le matin. Ça a augmenté ces dernières années… Bon, ça fait peut-être beaucoup.",
    drugs: "Non, jamais.",
    concerns: "Ma femme dit que c’est le vin. Moi, j’ai peur d’avoir quelque chose de grave au foie, je ne veux pas finir comme mon père.",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Depuis l’automne, donc cinq ou six mois. C’est venu petit à petit." },
    { topic: "sommeil", keywords: SLEEP, reply: "Je m’endors vite, souvent devant la télé, mais je me réveille vers trois heures, en sueur, et je ne me rendors plus. Le matin, je suis vaseux." },
    { topic: "ronflement", keywords: ["ronfl", "apnee", "arrete de respirer", "arretez de respirer", "somnol", "endormez la journee"], reply: "Ma femme dit que je ronfle fort, surtout les soirs où j’ai bu. Je ne crois pas que je m’arrête de respirer. Je ne m’endors pas la journée, sauf parfois après le repas de midi." },
    { topic: "fatigue", keywords: FATIGUE, reply: "Je suis crevé dès le matin, j’ai du mal à démarrer. Ça va un peu mieux l’après-midi." },
    { topic: "quantité d’alcool", keywords: QUANTITY, reply: "En semaine, un ou deux verres de vin à midi, le soir deux ou trois bières à l’apéro et une demi-bouteille de vin au repas. Le week-end, c’est plutôt une bouteille de vin par jour, plus avec les amis. Tous les jours, en fait." },
    { topic: "évolution et tolérance", keywords: TOLERANCE, reply: "J’ai toujours bu du vin à table, mais depuis deux ou trois ans ça a augmenté, surtout depuis l’automne. Et je tiens bien : il m’en faut plus qu’avant pour sentir quelque chose. Parfois un whisky le week-end." },
    { topic: "tentatives de diminuer", keywords: CUT_DOWN, reply: "Oui, j’ai essayé de ne pas boire en janvier. J’ai tenu dix jours : j’étais nerveux, je transpirais la nuit et je dormais encore plus mal, alors j’ai repris." },
    { topic: "reproches de l’entourage", keywords: ANNOYED, reply: "Ma femme me le reproche, et ça m’énerve. C’est elle qui m’a poussé à venir." },
    { topic: "culpabilité", keywords: GUILTY, reply: "Oui, parfois le lendemain je m’en veux, surtout quand j’ai dit des bêtises à ma femme." },
    { topic: "le matin", keywords: MORNING, reply: "Non, je ne bois jamais le matin. Mais certains matins, j’ai les mains qui tremblent un peu ; ça passe dans la matinée." },
    { topic: "retentissement", keywords: SOCIAL, reply: "Au travail, je suis en retard certains matins et mon chef m’a fait une remarque. Je conduis beaucoup ; une fois, je suis rentré en voiture d’un repas client alors que je n’aurais pas dû. Pas d’accident, pas de retrait de permis. À la maison, on se dispute plus souvent." },
    { topic: "chute", keywords: ["chute", "tombe", "cogne", "bleu", "blesse", "trauma"], reply: "Il y a un mois, je suis tombé dans l’escalier en rentrant d’une soirée. Juste un bleu à la hanche, je ne me suis pas cogné la tête." },
    { topic: "foie", keywords: ["foie", "hepat", "cirrhose"], reply: "Une fois, à une prise de sang pour l’assurance, on m’a dit que j’avais le foie un peu gras. Je n’ai jamais eu de jaunisse." },
    { topic: "symptômes digestifs", keywords: ["jaune", "ventre", "selles", "vomi", "sang$", "appetit", "poids", "maigri", "nausee", "digestion"], reply: "J’ai moins faim le matin, parfois un peu la nausée. Pas de sang, pas de selles noires, je ne suis pas jaune. J’ai plutôt pris du ventre, deux ou trois kilos." },
    { topic: "symptômes neurologiques", keywords: ["fourmill", "engourdi", "picot", "pieds", "equilibre", "memoire", "oubli", "concentr"], reply: "Parfois des fourmis dans les pieds le soir. La mémoire, ça va ; je suis peut-être un peu moins concentré." },
    { topic: "humeur", keywords: [...MOOD, "votre moral", "le moral", "stress"], reply: "Je suis stressé par le travail et un peu à plat, mais j’aime toujours aller à la pêche avec mon fils. Je n’ai pas d’idées noires, je n’ai jamais pensé à en finir." },
    { topic: "motivation", keywords: [...MOTIVATION, "pret a diminuer", "pret a reduire", "pret a arreter", "envie de diminuer", "envie d arreter"], reply: "Je sais que je bois trop, je ne suis pas idiot. Diminuer, oui, je veux bien essayer. Tout arrêter, je ne sais pas si j’y arriverais. L’importance, je dirais sept sur dix ; la confiance, peut-être quatre." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 152/94 mmHg, FC 92/min régulière, FR 15/min, SpO₂ 97 % à l’air ambiant, T 36,8 °C." },
    { topic: "peau", examiner: true, keywords: ["inspection de la peau", "examine la peau", "angiome", "erytheme palmaire", "ictere"], reply: "Érythrose du visage avec varicosités sur les pommettes, deux angiomes stellaires sur le haut du thorax, érythème palmaire discret. Pas d’ictère cutané ni conjonctival. Ecchymose jaunâtre en résorption à la hanche gauche." },
    { topic: "abdomen", examiner: true, keywords: ["palpation abdominale", "palpe l abdomen", "palpe le ventre", "palpe le foie", "hepatomegal", "flot d ascite", "ascite"], reply: "Abdomen souple et indolore, sans ascite ni circulation veineuse collatérale. Foie palpable 2 cm sous le rebord costal, bord mousse, indolore. Pas de splénomégalie." },
    { topic: "neurologique", examiner: true, keywords: ["examen neuro", "reflexe", "diapason", "pallesthes", "romberg", "asterixis"], reply: "Tremblement fin des mains bras tendus. Force conservée. Réflexes achilléens faibles des deux côtés, sensibilité vibratoire diminuée aux orteils (diapason 4/8). Marche normale, Romberg négatif, pas de nystagmus ni d’ataxie, pas d’astérixis." },
    { topic: "bilan sanguin", examiner: true, keywords: ["prise de sang", "bilan sanguin", "bilan hepatique", "tests hepatiques", "gamma", "ggt", "transaminase", "formule sanguine", "vgm"], reply: "ASAT 78 U/L, ALAT 42 U/L (rapport ASAT/ALAT 1,9), gamma-GT 210 U/L, bilirubine 14 µmol/L. Hb 141 g/L, VGM 103 fL (macrocytose), plaquettes 148 G/L." },
    planReaction("D’accord… Mais vous croyez que je dois tout arrêter d’un coup ?", ["diminuer", "reduire", "objectif", "suivi", "revoir", "addictolog", "groupe", "abstinence", "consommation"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes"] },
    { id: "peau", label: "Inspection de la peau et recherche d’un ictère", category: "examen", pertinent: true, topic: "peau", covers: ["peau", "ictere"] },
    { id: "abdomen", label: "Palpation abdominale, du foie et de la rate", category: "examen", pertinent: true, topic: "abdomen", covers: ["palpation-abdominale", "foie-rate"] },
    { id: "neurologique", label: "Examen neurologique (réflexes, sensibilité, coordination)", category: "examen", pertinent: true, topic: "neurologique", covers: ["examen-neurologique", "coordination"] },
    { id: "bilan-sanguin", label: "Bilan sanguin : tests hépatiques et formule sanguine", category: "complementaire", pertinent: true, topic: "bilan sanguin", covers: ["tests-hepatiques", "fsc"] },
    { id: "ct-cerebral", label: "CT cérébral natif", category: "complementaire", pertinent: false, result: "Non indiqué : chute sans traumatisme crânien, examen neurologique sans déficit focal.", covers: ["ct-cerebral"] },
    { id: "gastroscopie", label: "Gastroscopie", category: "complementaire", pertinent: false, result: "Non indiquée d’emblée : pas d’hémorragie digestive, pas de signe d’hypertension portale ni de cirrhose à ce stade.", covers: ["gastroscopie"] },
    { id: "eeg", label: "Électroencéphalogramme", category: "complementaire", pertinent: false, result: "Non indiqué : aucune crise convulsive ni perte de connaissance.", covers: ["eeg"] },
    { id: "echocardiographie", label: "Échocardiographie", category: "complementaire", pertinent: false, result: "Non indiquée : pas de souffle, pas de signe d’insuffisance cardiaque.", covers: ["echocardiographie"] },
  ],
  catalogResults: {
    "etat-general": "Homme corpulent, visage érythrosique, bien orienté, sans signe de sevrage aigu au moment de l’examen.",
    "etat-mental": "Contact adéquat, un peu sur la défensive au début. Humeur légèrement abaissée, ambivalent vis-à-vis de sa consommation ; pas d’idée suicidaire, pas de symptôme psychotique.",
    "phq9": "PHQ-9 : 7/27, symptômes dépressifs légers, pas d’idée suicidaire.",
    "poids": "Poids 89 kg pour 178 cm (IMC 28 kg/m²), 3 kg de plus qu’il y a six mois.",
    "ferritine-b12": "Ferritine 480 µg/L, vitamine B12 dans les normes, folates abaissés (5 nmol/L).",
    "echo-abdominale": "Foie augmenté de taille, hyperéchogène (stéatose), contours réguliers ; pas d’ascite, rate de taille normale, voies biliaires non dilatées.",
  },
  acceptable: ["echo-abdominale", "etat-mental", "phq9", "poids", "crase", "ferritine-b12", "creatinine", "ionogramme", "tsh", "alcool-toxiques", "serologies", "hba1c", "ecg"],
  diagnosisChoice: { correct: "Trouble lié à l’usage d’alcool (consommation à risque avec signes de dépendance)", distractors: ["Épisode dépressif majeur", "Hypothyroïdie", "Syndrome d’apnées obstructives du sommeil"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "complaint",
      label: "Caractérise la fatigue et l’insomnie",
      hint: "Début et évolution, type d’insomnie (réveil précoce), retentissement de la fatigue",
      points: 2,
      groups: [ONSET, SLEEP, FATIGUE],
    },
    {
      id: "consumption",
      label: "Quantifie la consommation d’alcool",
      hint: "Aborde l’alcool, quantité et fréquence (AUDIT-C), évolution et tolérance",
      points: 3,
      groups: [DRINKING, QUANTITY, TOLERANCE],
    },
    {
      id: "dependence",
      label: "Recherche les signes de dépendance (CAGE)",
      hint: "Tentatives de diminuer, reproches de l’entourage, culpabilité, consommation ou tremblements le matin",
      points: 3,
      groups: [CUT_DOWN, ANNOYED, GUILTY, MORNING],
    },
    {
      id: "consequences",
      label: "Évalue le retentissement",
      hint: "Travail, conduite, couple ; chute, symptômes digestifs et neurologiques ; humeur et idées suicidaires",
      points: 2,
      groups: [SOCIAL, PHYSICAL, MOOD],
    },
    {
      id: "terrain",
      label: "Recherche les antécédents et les autres consommations",
      hint: "Antécédents personnels (hépatiques, HTA), antécédents familiaux d’alcoolisme, tabac et drogues",
      points: 1,
      groups: [
        ["antecedent", "maladie", "probleme de sante", "problemes de sante", "probleme de foie", "maladie du foie", "hepatite", "opere"],
        ["famille", "familia", "parents", "votre pere", "votre mere", "hereditaire"],
        ["fume", "fumez", "tabac", "cigarette", "drogue", "cannabis", "substance"],
      ],
    },
    treatmentsCriterion,
    {
      id: "motivation",
      label: "Évalue la motivation au changement",
      hint: "Entretien motivationnel : importance, confiance, objectif proposé par le patient",
      points: 1,
      groups: [MOTIVATION],
    },
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes, stigmates cutanés d’hépatopathie, palpation du foie, examen neurologique (polyneuropathie, tremblement) ; tests hépatiques et formule sanguine",
      points: 5,
      groups: [["stigmates"], ["hepatomegal"], ["polyneuropath"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Trouble lié à l’usage d’alcool (consommation à risque, signes de dépendance débutante) révélé par une fatigue et une insomnie",
    summary: "Homme de 52 ans qui consulte pour une fatigue et une insomnie avec réveil précoce depuis cinq mois. Il boit environ 7 à 9 verres standard par jour (davantage le week-end), avec augmentation de la tolérance, échec d’une tentative d’arrêt avec sueurs et nervosité, reproches de son épouse, culpabilité et tremblements matinaux (CAGE 3 à 4/4). Retentissement : retards au travail, conduite après consommation, conflits de couple, chute. Status : HTA, érythrose, angiomes stellaires, hépatomégalie, tremblement fin et polyneuropathie débutante ; gamma-GT et VGM élevés, rapport ASAT/ALAT supérieur à 1,5. Patient ambivalent mais prêt à diminuer.",
    keyFindings: [
      "Consommation quotidienne d’environ 70 à 90 g d’alcool, bien au-dessus des repères à faible risque.",
      "Signes de dépendance : tolérance, échec de l’arrêt avec symptômes de sevrage, tremblements matinaux, poursuite malgré les conséquences.",
      "Stigmates d’hépatopathie alcoolique (angiomes stellaires, érythème palmaire, hépatomégalie) sans signe de décompensation.",
      "Gamma-GT 210 U/L, ASAT/ALAT 1,9, macrocytose : marqueurs d’une consommation chronique.",
    ],
    redFlags: [
      "Arrêt brutal chez un patient dépendant : risque de sevrage sévère (convulsions, délirium tremens) ; sevrage encadré si l’abstinence est visée.",
      "Ictère, ascite, saignement digestif, confusion : hépatopathie décompensée, bilan urgent.",
      "Conduite sous l’influence de l’alcool, idées suicidaires : à aborder directement.",
      "Confusion, troubles de la marche ou oculomoteurs : encéphalopathie de Wernicke, thiamine sans délai.",
    ],
    management: [
      "Restituer les résultats sans jugement (lien entre alcool, fatigue, sommeil, tension et foie) ; entretien motivationnel et objectif choisi avec le patient (réduction ou abstinence).",
      "Thiamine par voie orale ; si arrêt envisagé, sevrage encadré (benzodiazépine à doses dégressives en ambulatoire ou hospitalier selon le risque).",
      "Compléter le bilan : échographie abdominale, crase, sérologies hépatites ; réévaluer la tension après réduction.",
      "Suivi rapproché au cabinet dans deux à quatre semaines, proposer un accompagnement spécialisé en addictologie ; parler de la conduite.",
    ],
    differentials: [
      "Épisode dépressif majeur (fréquemment associé ; réévaluer après réduction de la consommation).",
      "Cause organique de fatigue : hypothyroïdie, anémie, diabète, syndrome d’apnées du sommeil (ronflements).",
      "Hépatopathie d’une autre cause (hépatites virales, stéatose métabolique, hémochromatose).",
      "Trouble de l’adaptation lié au stress professionnel.",
    ],
    sources: [
      { label: "NICE CG115 (2011) — Alcohol-use disorders: diagnosis, assessment and management of harmful drinking and alcohol dependence", url: "https://www.nice.org.uk/guidance/cg115" },
      { label: "OMS (2001) — AUDIT : The Alcohol Use Disorders Identification Test, guidelines for use in primary care", url: "https://www.who.int/publications/i/item/WHO-MSD-MSB-01.6a" },
    ],
    pathologySlugs: ["cirrhose", "troubles-de-humeur"],
  },
};

export const consommationAlcoolDiagnoses: StationDiagnoses = {
  accepted: ["trouble-usage-alcool"],
  differentials: [
    { label: "Épisode dépressif majeur", ids: ["episode-depressif-majeur"] },
    { label: "Cause organique de fatigue (hypothyroïdie, anémie)", ids: ["hypothyroidie", "anemie"] },
    { label: "Hépatopathie évoluée (hépatite, cirrhose)", ids: ["hepatite-aigue", "cirrhose-decompensee"] },
    { label: "Trouble de l’adaptation", ids: ["trouble-adaptation"] },
  ],
};
