import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { CHARACTER, communicationCriterion, FEVER, INTENSITY, ONSET, planReaction, presentationCriterion, RADIATION, treatmentsCriterion, VITALS } from "./shared.ts";

const MECHANISM = ["comment c est arrive", "que s est il passe", "qu est ce qui s est passe", "racontez", "soulev", "porte", "portiez", "charge lourde", "effort", "faux mouvement", "tour de rein", "en vous penchant", "bloque"];
const LEG = [...RADIATION, "jambe", "cuisse", "mollet", "pied", "orteil", "jusqu ou", "jusqu a"];
const IMPULSIVE = ["tousse", "toux", "eternu", "pousse", "impulsi", "effort de defecation", "en allant a la selle"];
const SADDLE = ["selle$", "en selle", "anesthesie en selle", "au niveau de la selle", "entre les jambes", "sensibilite perineale", "sensibilite du perine", "sensibilite autour de l anus", "insensibilite", "perine", "entrejambe", "parties intimes", "anus", "papier toilette", "sensibilite autour", "organes genitaux"];
const SPHINCTERS = ["urin", "vessie", "pipi", "incontin", "fuite", "retenir", "sphinct", "selles", "transit", "constip", "sexuel", "erection"];
const WEAKNESS = ["faibless", "force", "paralys", "pied tombant", "pied qui accroche", "pointe des pieds", "sur les talons", "deficit", "lache", "trebuch"];
const CANCER = ["cancer", "tumeur", "perte de poids", "maigri", "amaigr", "la nuit", "nocturne", "au repos", "fatigue"];
const WORK = ["travail", "metier", "profession", "emploi", "boulot", "arret de travail", "demenag", "employeur"];

export const hernieDiscaleSciatique: EcosScenario = {
  slug: "hernie-discale-sciatique",
  version: 1,
  setting: "cabinet",
  patient: { name: "M. Roulin", age: 44, sex: "M" },
  painful: true,
  persona: "Déménageur robuste, un peu bourru, fatigué d’avoir mal et inquiet pour son travail. Il reste debout ou se tient raide sur sa chaise, penché vers la droite. Il répond franchement mais brièvement, et ne parle de ses fourmillements au pied que si on lui pose la question.",
  brief: [
    "Vous êtes médecin assistant·e dans un cabinet de médecine de famille.",
    "M. Roulin, 44 ans, consulte au cabinet pour une douleur dans le bas du dos qui descend dans la jambe gauche depuis plusieurs semaines.",
    "Menez l’anamnèse et l’examen clinique ciblés, demandez les examens complémentaires utiles et interprétez-les, puis posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. J’ai mal dans le bas du dos depuis presque deux mois, et surtout ça descend dans la jambe gauche. Ça ne passe pas, je ne peux plus travailler.",
  history: {
    identity: "Patrick Roulin, 44 ans.",
    occupation: "Je suis déménageur depuis vingt ans. Je porte des meubles et des cartons toute la journée.",
    living: "Je vis avec ma femme et nos deux ados dans une maison à Échallens.",
    feeling: "Fatigué d’avoir mal, et ça commence à me miner de rester à la maison.",
    previousEpisodes: "J’ai eu des tours de reins avant, une ou deux fois par an, mais ça passait en quelques jours. Jamais dans la jambe comme ça.",
    course: "Le dos va un peu mieux qu’au début, mais la jambe, ça ne bouge pas vraiment, malgré la physio et les médicaments.",
    otherSymptoms: "J’ai des fourmis sur le bord extérieur du pied gauche.",
    medications: "De l’ibuprofène 400 mg trois fois par jour et du paracétamol 1 g trois fois par jour, depuis le début. Rien d’autre.",
    allergies: "Pas d’allergie.",
    personalHistory: "Rien de spécial. Un peu de surpoids, et une appendicite opérée quand j’étais gamin.",
    familyHistory: "Mon père avait aussi mal au dos, c’était un maçon.",
    tobacco: "Oui, un paquet de 20 dure deux jours, depuis mes vingt ans.",
    alcohol: "Deux ou trois bières le week-end.",
    drugs: "Non.",
    concerns: "Est-ce qu’il faut m’opérer ? Et est-ce que je vais pouvoir refaire mon métier ?",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Il y a sept semaines, au travail. Deux jours après, la douleur est descendue dans la jambe gauche." },
    { topic: "mécanisme", keywords: MECHANISM, reply: "On soulevait une machine à laver dans un escalier. J’étais penché en avant en tournant, et j’ai senti un coup dans le bas du dos. Je suis resté bloqué." },
    { topic: "trajet de la douleur", keywords: LEG, reply: "Ça part de la fesse gauche, ça descend derrière la cuisse, derrière le mollet, jusque sous la cheville et le bord extérieur du pied, vers le petit orteil." },
    { topic: "localisation", keywords: ["ou avez vous mal", "ou est ce", "ou ca", "ou exactement", "localis", "endroit", "montrez moi", "dos$", "lombaire"], reply: "En bas du dos, un peu à gauche. Mais maintenant c’est surtout la jambe gauche qui me fait souffrir, plus que le dos." },
    { topic: "caractère", keywords: CHARACTER, reply: "Dans la jambe, c’est comme une décharge électrique, ou une brûlure. Dans le dos, plutôt une barre." },
    { topic: "intensité", keywords: INTENSITY, reply: "La jambe, 6 sur 10 la plupart du temps, 8 quand je tousse. Le dos, 3 sur 10." },
    { topic: "impulsivité", keywords: IMPULSIVE, reply: "Oui, quand je tousse ou que j’éternue, ça me fait une décharge jusqu’au pied. Pareil quand je pousse aux toilettes." },
    { topic: "facteurs modifiants", keywords: ["calme", "soulage", "aggrave", "position", "assis", "debout", "marche", "couche", "allonge", "pencher"], reply: "Assis longtemps, c’est le pire, en voiture aussi. Ça va mieux couché sur le côté droit, les genoux pliés. Je marche un peu, ça va." },
    { topic: "fourmillements", keywords: ["fourmi", "engourdi", "picote", "paresthes", "sensibilite", "insensible", "sens moins"], reply: "Oui, des fourmis sur le bord extérieur du pied gauche et sous le talon. Je sens un peu moins bien à cet endroit." },
    { topic: "selle", keywords: SADDLE, reply: "Non, je sens normalement quand je m’essuie, rien d’endormi entre les jambes." },
    { topic: "sphincters", keywords: SPHINCTERS, reply: "Non, j’urine normalement, pas de fuite, pas de difficulté. Les selles, normal. Et de ce côté-là, au lit, tout fonctionne." },
    { topic: "faiblesse", keywords: WEAKNESS, reply: "Non, la jambe ne lâche pas, je ne trébuche pas. C’est la douleur qui me freine, pas la force." },
    { topic: "fièvre", keywords: FEVER, reply: "Non, pas de fièvre, pas de frissons." },
    { topic: "cancer et douleur nocturne", keywords: CANCER, reply: "Pas de cancer, je n’ai pas maigri, au contraire. La nuit, ça me réveille quand je me retourne, mais sur le côté avec un coussin entre les genoux, je dors." },
    { topic: "traumatisme et terrain", keywords: ["chute", "tombe", "accident", "cortison", "osteopor", "drogue", "injection", "immuno"], reply: "Non, pas de chute ni d’accident. Jamais eu de cortisone ni d’injections." },
    { topic: "travail", keywords: WORK, reply: "Je suis en arrêt à 100 % depuis cinq semaines. Mon patron est compréhensif, mais il me demande quand je reviens. Je ne me vois pas porter un frigo comme ça." },
    { topic: "traitements essayés", keywords: ["physio", "kine", "exercices", "qu avez vous essaye", "deja vu un medecin", "deja consulte", "deja fait"], reply: "Le médecin de garde m’a donné les anti-inflammatoires au début. J’ai fait six séances de physio, des exercices que je fais encore à la maison. Le dos va mieux, la jambe pas vraiment." },
    { topic: "imagerie antérieure", keywords: ["radio", "irm", "scanner", "imagerie"], reply: "Non, on ne m’a fait aucune radio. Le médecin de garde m’a dit qu’au début ça ne servait à rien." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 36,8 °C, FC 74/min, TA 134/84 mmHg, FR 14/min, SpO₂ 98 %. Poids 94 kg, taille 1,80 m." },
    { topic: "examen du rachis", examiner: true, keywords: ["inspect", "palpe", "palpation", "examine le dos", "examen du dos", "examen du rachis", "colonne", "schober", "doigts sol", "percussion des epineuses"], reply: "Attitude antalgique en inflexion latérale droite (le tronc penche vers la droite). Contracture des muscles paravertébraux lombaires gauches. Pas de douleur à la percussion des épineuses. Flexion du tronc limitée, distance doigts-sol 40 cm, déclenchant la douleur dans la jambe gauche." },
    { topic: "examen neurologique", examiner: true, keywords: ["lasegue", "reflex", "achille", "rotulien", "babinski", "examen neurologique", "testing", "dermatome", "bragard"], reply: "Lasègue gauche positif à 35°, reproduisant la douleur jusqu’au bord latéral du pied ; manœuvre de Bragard positive à gauche. Lasègue droit et Lasègue croisé négatifs. Force 5/5 aux deux membres inférieurs : flexion de hanche, extension du genou, releveurs du pied et du gros orteil, fléchisseurs plantaires (dix montées sur la pointe du pied gauche). Réflexe achilléen gauche diminué, droit normal ; réflexes rotuliens vifs et symétriques. Hypoesthésie au tact et à la piqûre du bord latéral et de la plante du pied gauche. Babinski négatif des deux côtés." },
    { topic: "périnée", examiner: true, keywords: ["toucher rectal", "tonus anal", "sensibilite perineale", "sensibilite du perine", "examen du perine"], reply: "Sensibilité périnéale et péri-anale conservée et symétrique. Toucher rectal : tonus sphinctérien et contraction volontaire normaux." },
    planReaction("Donc on ne m’opère pas tout de suite ? Et je reprends le travail quand ?", ["physio", "irm", "infiltration", "chirurg", "operation", "neurochirurg", "antalg", "anti inflammatoire"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "rachis", label: "Inspection, palpation et mobilité de la colonne lombaire", category: "examen", pertinent: true, topic: "examen du rachis", covers: ["rachis"] },
    { id: "neurologique", label: "Examen neurologique des membres inférieurs avec manœuvres d’étirement radiculaire", category: "examen", pertinent: true, topic: "examen neurologique", covers: ["examen-neurologique"] },
    { id: "perinee", label: "Sensibilité périnéale et toucher rectal", category: "examen", pertinent: true, topic: "périnée", covers: ["toucher-rectal"] },
    { id: "irm", label: "IRM de la colonne lombaire", category: "complementaire", pertinent: true, result: "IRM lombaire, séquences sagittales T1 et T2, axiales T2, sans injection. Lordose conservée, alignement normal, pas de listhésis. Disque L5-S1 en hyposignal T2, de hauteur légèrement diminuée ; les disques sus-jacents sont normaux. En L5-S1, saillie focale de matériel discal postéro-latérale gauche, d’environ 8 mm dans le plan antéro-postérieur, occupant le récessus latéral gauche : elle refoule en arrière la racine S1 gauche, épaissie, et efface la graisse autour d’elle. Racine S1 droite libre. Pas de fragment migré. Canal lombaire de calibre normal, sac dural sans compression significative ; cône médullaire de signal normal, terminé en regard de L1. Foramens L4-L5 et L5-S1 libres. Signal normal de la moelle osseuse des corps vertébraux et des plateaux, pas de collection paravertébrale ni épidurale, pas de lésion osseuse focale.", covers: ["irm-lombaire"] },
    { id: "bilan-sanguin", label: "Bilan sanguin (FSC, CRP)", category: "complementaire", pertinent: false, result: "Leucocytes 7,2 G/L, CRP 3 mg/L. Sans fièvre, sans antécédent de cancer ni autre drapeau rouge, ce bilan n’est pas indiqué.", covers: ["fsc", "crp"] },
    { id: "bandelette", label: "Bandelette urinaire", category: "complementaire", pertinent: false, result: "Négative. Sans symptôme urinaire ni douleur de la fosse lombaire, elle n’apporte rien.", covers: ["bandelette"] },
    { id: "radio-bassin", label: "Radiographie du bassin et des hanches", category: "complementaire", pertinent: false, result: "Pas de lésion osseuse, interlignes coxo-fémoraux conservés. Non indiquée : les hanches sont libres et la douleur suit un trajet radiculaire.", covers: ["radio-bassin-hanche"] },
    { id: "echo-abdominale", label: "Échographie abdominale", category: "complementaire", pertinent: false, result: "Sans particularité, aorte abdominale de calibre normal. Non indiquée : douleur mécanique et radiculaire chez un homme de 44 ans, sans signe abdominal ni vasculaire.", covers: ["echo-abdominale"] },
  ],
  catalogResults: {
    "coordination": "Marche avec une boiterie antalgique à gauche. Marche sur les talons et sur la pointe des pieds possible des deux côtés.",
    "neurovasculaire-distal": "Pouls distaux présents. Hypoesthésie du bord latéral et de la plante du pied gauche ; motricité des orteils conservée.",
    "membres-inferieurs": "Membres inférieurs symétriques, sans amyotrophie, sans rougeur ni tuméfaction.",
  },
  acceptable: ["hanche", "pouls-peripheriques", "neurovasculaire-distal", "coordination", "membres-inferieurs"],
  diagnosisChoice: { correct: "Hernie discale L5-S1 gauche avec radiculopathie S1", distractors: ["Lombalgie commune", "Syndrome de la queue de cheval", "Coxarthrose gauche"] },
  criteria: [
    presentationCriterion,
    {
      id: "pain",
      label: "Caractérise une douleur radiculaire",
      hint: "Début et mécanisme, trajet dans la jambe jusqu’au pied, impulsivité à la toux",
      points: 3,
      groups: [[...ONSET, ...MECHANISM], LEG, IMPULSIVE],
    },
    {
      id: "red-flags",
      label: "Recherche les drapeaux rouges",
      hint: "Anesthésie en selle, troubles sphinctériens, déficit moteur, fièvre, cancer ou amaigrissement",
      points: 4,
      groups: [SADDLE, SPHINCTERS, WEAKNESS, FEVER, CANCER],
    },
    {
      id: "work",
      label: "Évalue le retentissement professionnel",
      hint: "Métier physique, arrêt de travail",
      points: 1,
      groups: [WORK],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen ciblé du rachis et neurologique",
      hint: "Constantes, rachis, Lasègue, force, réflexes, sensibilité, périnée",
      points: 2,
      groups: [VITALS, ["lasegue", "reflex", "examen neurologique"]],
    },
    {
      id: "analysis",
      label: "Interprète l’IRM lombaire",
      hint: "Hernie discale L5-S1 postéro-latérale gauche, conflit avec la racine S1 gauche, pas de compression de la queue de cheval ni de lésion infectieuse ou tumorale",
      points: 3,
      groups: [
        ["hernie", "discal", "disque", "protrusion", "extrusion"],
        ["l5 s1", "l5s1", "lombo sacr", "l5 sacr"],
        ["racine s1", "s1$", "radicul", "conflit"],
        ["queue de cheval", "canal libre", "canal de calibre", "canal normal", "pas de compression du sac", "pas de lesion osseuse", "pas de spondylodiscite", "pas de collection", "cone"],
      ],
    },
    {
      id: "management",
      label: "Propose une prise en charge adaptée",
      hint: "Traitement conservateur (antalgie, physiothérapie, rester actif), avis du chirurgien du rachis pour une radiculalgie persistante, consignes de reconsultation en urgence",
      points: 3,
      groups: [
        ["antalg", "anti inflammatoire", "ains", "ibuprof", "naproxen", "paracetamol", "physio", "rester actif", "activite", "eviter le repos", "kine"],
        ["chirurg", "neurochirurg", "infiltration", "orthoped", "avis specialis", "specialiste du dos", "specialiste du rachis", "operer", "operation"],
        ["en urgence", "reconsult", "revenir", "si vous avez", "si vous ne sentez", "signes d alarme", "signe d alarme", "aux urgences"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Lombosciatique gauche par hernie discale L5-S1 postéro-latérale gauche, radiculopathie S1 sans déficit moteur, sans syndrome de la queue de cheval",
    summary: "Déménageur de 44 ans, fumeur, avec une douleur lombaire apparue lors d’un port de charge en flexion-rotation, puis une douleur radiculaire de la fesse au bord latéral du pied gauche, impulsive à la toux. Pas de drapeau rouge : sensibilité périnéale et sphincters normaux, force conservée, pas de fièvre ni de cancer. Lasègue gauche positif, achilléen gauche diminué et hypoesthésie du bord latéral du pied : radiculopathie S1. L’imagerie n’est pas urgente sans drapeau rouge ; ici, la radiculalgie invalidante persiste au-delà de six semaines malgré un traitement conservateur bien conduit, ce qui justifie l’IRM et un avis du chirurgien du rachis. L’IRM montre une hernie L5-S1 postéro-latérale gauche en conflit avec la racine S1 gauche.",
    keyFindings: [
      "Douleur de topographie S1 : fesse, face postérieure de la cuisse et du mollet, jusqu’au bord latéral du pied et au petit orteil.",
      "Douleur radiculaire plus forte que la douleur lombaire, impulsive à la toux et à l’éternuement, aggravée en position assise.",
      "Lasègue gauche positif à 35°, réflexe achilléen gauche diminué, hypoesthésie du bord latéral et de la plante du pied gauche, force conservée.",
      "Aucun drapeau rouge : pas d’anesthésie en selle, pas de trouble sphinctérien, pas de déficit moteur, pas de fièvre ni de cancer.",
    ],
    redFlags: [
      "Anesthésie en selle, rétention ou incontinence urinaire ou fécale, troubles sexuels, atteinte bilatérale : syndrome de la queue de cheval, IRM et avis chirurgical en urgence.",
      "Déficit moteur (cotation 3/5 ou moins, ou qui progresse) : avis chirurgical rapide.",
      "Fièvre, toxicomanie IV, immunosuppression : spondylodiscite ou abcès épidural.",
      "Antécédent de cancer, amaigrissement, douleur nocturne non mécanique, âge > 50 ans : métastase vertébrale.",
      "Traumatisme important ou ostéoporose, corticothérapie : fracture vertébrale.",
    ],
    management: [
      "Expliquer le bon pronostic : la plupart des radiculalgies par hernie discale régressent en 6 à 12 semaines, la hernie se résorbant souvent spontanément.",
      "Rester actif, éviter le repos au lit ; antalgie par AINS à la dose minimale efficace sur une durée limitée (protection gastrique si besoin) et paracétamol, opioïdes faibles seulement brièvement ; physiothérapie active.",
      "Pas d’imagerie urgente sans drapeau rouge. IRM lombaire si les symptômes persistent au-delà de 6 semaines malgré le traitement conservateur et qu’un geste invasif est envisagé, comme ici.",
      "Avis du chirurgien du rachis (neurochirurgie ou orthopédie) : infiltration épidurale ou péri-radiculaire de corticoïdes, ou microdiscectomie pour une radiculalgie invalidante persistante concordante avec l’IRM.",
      "Consignes claires : reconsulter en urgence en cas d’anesthésie en selle, de trouble urinaire ou fécal, ou de faiblesse de la jambe. Arrêt de travail adapté, puis reprise progressive ; arrêt du tabac.",
    ],
    differentials: [
      "Lombalgie commune avec douleur référée (sans topographie radiculaire, sans signe neurologique, Lasègue négatif).",
      "Syndrome de la queue de cheval (anesthésie en selle, troubles sphinctériens) : urgence chirurgicale.",
      "Sténose foraminale ou canal lombaire étroit (sujet plus âgé, claudication neurogène).",
      "Spondylodiscite, métastase vertébrale ou fracture (drapeaux rouges).",
      "Coxarthrose, artériopathie des membres inférieurs ou zona (douleur non radiculaire, éruption).",
    ],
    examReading: [
      "Disque L5-S1 dégénératif (hyposignal T2, pincement) avec saillie focale de matériel discal postéro-latérale gauche : hernie discale L5-S1 gauche.",
      "La hernie occupe le récessus latéral gauche et refoule la racine S1 gauche, épaissie : conflit disco-radiculaire S1, concordant avec la clinique (douleur, achilléen, sensibilité).",
      "Canal de calibre normal, sac dural et racines de la queue de cheval sans compression, foramens libres : pas de syndrome de la queue de cheval à l’imagerie.",
      "Signal normal des corps vertébraux et des plateaux, pas de collection : pas d’argument pour une spondylodiscite ou une métastase.",
    ],
    sources: [
      { label: "NICE NG59 — Low back pain and sciatica in over 16s: assessment and management", url: "https://www.nice.org.uk/guidance/ng59" },
      { label: "Kreiner DS et al. Spine J 2014 — NASS guideline: diagnosis and treatment of lumbar disc herniation with radiculopathy", url: "https://pubmed.ncbi.nlm.nih.gov/24239490/" },
    ],
    pathologySlugs: [],
  },
};

export const hernieDiscaleSciatiqueDiagnoses: StationDiagnoses = {
  accepted: ["hernie-discale"],
  differentials: [
    { label: "Lombalgie commune", ids: ["lombalgie-commune"] },
    { label: "Syndrome de la queue de cheval", ids: ["syndrome-queue-cheval"] },
    { label: "Spondylodiscite, fracture ou métastase vertébrale", ids: ["spondylodiscite", "fracture-vertebrale"] },
    { label: "Coxarthrose, artériopathie ou zona", ids: ["coxarthrose", "arteriopathie", "zona"] },
  ],
};
