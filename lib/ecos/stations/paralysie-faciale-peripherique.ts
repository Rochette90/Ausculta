import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, FEVER, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "./shared.ts";

const EYE = ["oeil", "yeux", "fermer", "paupiere", "cligne", "larm", "sec$", "secs$", "irrit", "pique"];
const TASTE_HEARING = ["gout", "goute", "bruit", "sons$", "son$", "hyperacous", "entend", "audition", "sourd", "ouie", "siffl", "acouph"];
const PAIN = ["douleur", "mal derriere", "mal a l oreille", "derriere l oreille", "avez vous mal", "vous avez mal", "douloureu"];
const TICK = ["tique", "piqure", "piquee", "morsure", "mordue", "erytheme", "rougeur", "plaque rouge", "foret", "jardin", "randonn", "lyme", "borreli"];
const VESICLES = ["vesicule", "bouton", "bulle", "cloque", "zona", "herpes", "eruption", "croute", "varicelle"];
const EAR_INFECTION = ["ecoulement", "otite", "coule de l oreille", "pus", ...FEVER];
const CENTRAL = ["bras", "jambe", "faiblesse", "force", "parler", "parole", "articul", "avaler", "deglut", "vision double", "voir double", "voyez double", "vertige", "equilibre", "marche", "engourd", "fourmi"];
const PREGNANCY = ["enceinte", "grossesse", "regles", "contracep", "pilule", "sterilet"];
const TERRAIN = ["diabet", "sucre", "hypertension", "de la tension", "immuno", "vih", "cortison", "ulcere", "estomac"];

export const paralysieFacialePeripherique: EcosScenario = {
  slug: "paralysie-faciale-peripherique",
  version: 1,
  setting: "cabinet",
  patient: { name: "Mme Kohler", age: 38, sex: "F" },
  persona: "Patiente inquiète et un peu honteuse de son visage, qu’elle cache par moments avec la main. Elle articule avec une légère gêne mais s’exprime clairement et répond volontiers.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "Mme Kohler, 38 ans, consulte au cabinet car depuis ce matin la moitié gauche de son visage ne bouge plus.",
    "Menez l’anamnèse, décrivez l’examen clinique et les examens utiles, posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. Ce matin, en me brossant les dents, l’eau coulait de ma bouche à gauche, et dans le miroir la moitié gauche de mon visage ne bouge plus.",
  history: {
    identity: "Nadia Kohler, 38 ans.",
    occupation: "Je suis employée de banque, je travaille au guichet.",
    living: "Je vis avec mon mari et nos deux enfants de 8 et 11 ans.",
    feeling: "J’ai peur, je n’ose pas me montrer comme ça. Sinon je me sens bien.",
    previousEpisodes: "Non, c’est la première fois. Je n’ai jamais rien eu au visage.",
    course: "Hier soir j’avais seulement mal derrière l’oreille gauche. Ce matin, le visage était tombé, et depuis c’est un peu plus marqué.",
    otherSymptoms: "Mon œil gauche ne se ferme plus bien et il pique.",
    medications: "Je n’ai pas de traitement, seulement du paracétamol hier soir pour la douleur derrière l’oreille.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Je suis en bonne santé. Deux grossesses sans problème. Pas de diabète, pas de tension.",
    familyHistory: "Rien de particulier, mes parents vont bien.",
    tobacco: "Non, je ne fume pas.",
    alcohol: "Un verre de temps en temps, le week-end.",
    drugs: "Non.",
    concerns: "J’ai peur que ce soit une attaque, et que mon visage reste comme ça.",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Je l’ai remarqué ce matin vers 7 h au réveil, en me brossant les dents. Hier soir, j’avais déjà mal derrière l’oreille gauche." },
    { topic: "œil", keywords: EYE, reply: "Je n’arrive plus à fermer complètement l’œil gauche, il est sec et il pique un peu. Je vois normalement." },
    { topic: "goût et ouïe", keywords: TASTE_HEARING, reply: "Le goût est bizarre à gauche de la langue, comme métallique. Et les bruits me paraissent trop forts dans l’oreille gauche. J’entends bien, pas de sifflement, et rien ne coule de l’oreille." },
    { topic: "douleur", keywords: PAIN, reply: "Une douleur sourde derrière l’oreille gauche depuis hier soir, trois sur dix. Pas de douleur forte dans l’oreille." },
    { topic: "visage", keywords: ["visage", "bouche", "sourire", "front", "sourcil", "joue", "manger", "boire", "baver", "coule"], reply: "Tout le côté gauche est tombé, même le front : je n’arrive plus à lever le sourcil gauche. Quand je bois, ça coule par la gauche, et la nourriture reste dans la joue." },
    { topic: "Lyme", keywords: TICK, reply: "On va souvent marcher en forêt dans le Jura, et j’ai un jardin. Je ne me souviens pas d’une tique cet été, et je n’ai pas vu de plaque rouge sur la peau." },
    { topic: "vésicules", keywords: VESICLES, reply: "Non, pas de boutons ni de petites cloques, ni sur l’oreille ni dans la bouche. J’ai eu la varicelle enfant." },
    { topic: "infection ORL", keywords: EAR_INFECTION, reply: "Non, pas de fièvre, rien qui coule de l’oreille. J’ai eu un petit rhume il y a dix jours, c’est passé." },
    { topic: "signes centraux", keywords: CENTRAL, reply: "Non, mes bras et mes jambes vont bien, je marche normalement. Pas de vertige, pas de vision double, j’avale bien. Je parle juste un peu mal à cause de la bouche." },
    { topic: "céphalée", keywords: ["mal a la tete", "maux de tete", "cephal", "migraine"], reply: "Non, pas de mal de tête, seulement cette douleur derrière l’oreille." },
    { topic: "grossesse", keywords: PREGNANCY, reply: "Je ne suis pas enceinte : j’ai un stérilet en cuivre, et mes dernières règles datent d’il y a deux semaines." },
    { topic: "terrain", keywords: TERRAIN, reply: "Pas de diabète, pas de tension, pas d’ulcère d’estomac. Je n’ai jamais pris de cortisone." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 124/78 mmHg, FC 72/min régulière, FR 14/min, SpO₂ 99 %, T 36,8 °C." },
    { topic: "examen neurologique", examiner: true, keywords: ["examen neuro", "nerfs craniens", "paires craniennes", "plisser le front", "lever les sourcils", "fermer les yeux", "montrer les dents", "j examine", "je vous examine", "examen clinique", "force", "reflexe", "house"], reply: "Paralysie faciale gauche touchant le haut et le bas du visage : impossible de plisser le front ni de lever le sourcil à gauche, occlusion palpébrale incomplète avec signe de Charles Bell (le globe oculaire part vers le haut), effacement du sillon nasogénien, commissure labiale gauche abaissée, impossible de gonfler la joue. House-Brackmann grade IV. Hémiface droite normale. Les autres nerfs crâniens sont normaux, notamment la sensibilité du visage et l’oculomotricité. Force, sensibilité, réflexes et coordination des quatre membres normaux, marche normale." },
    { topic: "examen ORL", examiner: true, keywords: ["otoscop", "tympan", "conduit auditif", "examen orl", "pavillon", "gorge", "palais"], reply: "Pavillon et conduit auditif externe gauches sans vésicule ni croûte, tympans normaux des deux côtés. Pas de vésicule sur le palais ni sur la langue. Acoumétrie : audition symétrique ; épreuves de Weber et de Rinne normales." },
    { topic: "peau", examiner: true, keywords: ["peau", "examen cutane", "inspection cutane", "erytheme migrant"], reply: "Pas d’érythème migrant ni d’éruption vésiculeuse sur la peau, y compris au cuir chevelu, sur le cou et derrière l’oreille gauche." },
    { topic: "parotide et ganglions", examiner: true, keywords: ["parotide", "ganglion", "adenopathie", "palpation du cou"], reply: "Parotides souples, symétriques et indolores, sans masse. Pas d’adénopathie cervicale ni prétragienne. Légère sensibilité à la palpation de la région mastoïdienne gauche." },
    { topic: "sérologies", examiner: true, keywords: ["serologie", "borrelia", "lyme", "vih"], reply: "Sérologie de Lyme (Borrelia, ELISA IgG et IgM) et sérologie VIH prélevées ; résultats dans quelques jours. Le traitement de la paralysie ne les attend pas." },
    planReaction("Des corticoïdes, ça a des effets secondaires ? Et mon visage va revenir comme avant ?", ["cortico", "cortison", "prednison", "prednisolon", "gouttes", "larmes", "pommade"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "examen-neurologique", label: "Examen neurologique : mimique faciale et nerfs crâniens", category: "examen", pertinent: true, topic: "examen neurologique", covers: ["examen-neurologique", "coordination", "pupilles"], key: ["examen-neurologique"] },
    { id: "examen-orl", label: "Otoscopie, pavillon de l’oreille et cavité buccale", category: "examen", pertinent: true, topic: "examen ORL", covers: ["examen-orl"] },
    { id: "peau", label: "Inspection de la peau", category: "examen", pertinent: true, topic: "peau", covers: ["peau"] },
    { id: "parotide", label: "Palpation des parotides et des aires ganglionnaires", category: "examen", pertinent: true, topic: "parotide et ganglions", covers: ["adenopathies"] },
    { id: "signes-meninges", label: "Recherche d’une raideur de nuque", category: "examen", pertinent: false, result: "Pas de raideur de nuque. Non indiqué : ni fièvre, ni céphalée, ni trouble de la vigilance.", covers: ["signes-meninges"] },
    { id: "serologies", label: "Sérologies : Lyme (Borrelia) et VIH", category: "complementaire", pertinent: true, topic: "sérologies", covers: ["serologie-lyme", "serologies"] },
    { id: "ct-cerebral", label: "CT cérébral natif", category: "complementaire", pertinent: false, result: "Normal. Non indiqué : paralysie faciale périphérique isolée (front atteint), sans autre signe neurologique ; l’imagerie se discute seulement si le tableau est atypique ou ne s’améliore pas.", covers: ["ct-cerebral"] },
    { id: "irm-cerebrale", label: "IRM cérébrale", category: "complementaire", pertinent: false, result: "Non indiquée d’emblée : à réserver aux formes atypiques (autres nerfs crâniens, installation lente, récidive homolatérale) ou sans récupération après 3 à 4 mois.", covers: ["irm-cerebrale"] },
    { id: "ponction-lombaire", label: "Ponction lombaire", category: "complementaire", pertinent: false, result: "Non indiquée d’emblée : pas de fièvre, pas de céphalée, pas de signe méningé ; à discuter seulement si la sérologie de Lyme revient positive.", covers: ["ponction-lombaire"] },
    { id: "ecg", label: "ECG 12 dérivations", category: "complementaire", pertinent: false, result: "Rythme sinusal normal. Sans intérêt pour une paralysie faciale isolée chez une patiente sans facteur de risque vasculaire.", covers: ["ecg"] },
  ],
  catalogResults: {
    "serologies": "Sérologie de Lyme (Borrelia, ELISA IgG et IgM) et sérologie VIH prélevées ; résultats dans quelques jours. Le traitement de la paralysie ne les attend pas.",
    "nihss": "NIHSS 2 (item paralysie faciale seulement) ; ce score n’est pas adapté à une atteinte faciale périphérique isolée.",
    "etat-general": "Bon état général ; asymétrie du visage visible au repos, chute de la commissure labiale gauche.",
    "fond-oeil": "Fond d’œil normal. Conjonctive gauche discrètement rouge, sans ulcère cornéen visible.",
  },
  acceptable: ["hba1c", "fsc", "crp", "fond-oeil", "nihss"],
  diagnosisChoice: { correct: "Paralysie faciale périphérique a frigore (paralysie de Bell)", distractors: ["AVC ischémique", "Syndrome de Ramsay Hunt (zona auriculaire)", "Otite moyenne aiguë compliquée"] },
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Caractérise la paralysie",
      hint: "Début et installation, fermeture de l’œil, goût et hyperacousie, douleur rétro-auriculaire",
      points: 4,
      groups: [ONSET, EYE, TASTE_HEARING, PAIN],
    },
    {
      id: "causes",
      label: "Recherche une cause et les signes d’alarme",
      hint: "Tique ou érythème migrant (Lyme), vésicules (zona auriculaire), otite, signes neurologiques centraux",
      points: 4,
      groups: [TICK, VESICLES, EAR_INFECTION, CENTRAL],
    },
    {
      id: "terrain",
      label: "Évalue le terrain avant corticothérapie",
      hint: "Grossesse, diabète, ulcère, immunosuppression",
      points: 2,
      groups: [PREGNANCY, TERRAIN],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen ciblé",
      hint: "Atteinte du front (périphérique ou centrale), autres nerfs crâniens et membres, oreille et cavité buccale, peau, parotides",
      points: 3,
      groups: [["front", "examen neuro", "nerfs craniens"], ["otoscop", "tympan", "oreille"], ["peau", "parotide"]],
    },
    {
      id: "management",
      label: "Traite et protège l’œil",
      hint: "Corticoïdes dans les 72 heures, protection oculaire (larmes artificielles, pommade, occlusion nocturne), suivi de la récupération",
      points: 3,
      groups: [
        ["cortico", "cortison", "prednison", "prednisolon", "stero"],
        ["larmes", "gouttes", "pommade", "gel ophtalm", "occlusion", "pansement", "lunettes", "proteger l oeil", "protection de l oeil", "proteger votre oeil", "humidifi"],
        ["controle", "revoir", "revenir", "reconsulter", "suivi", "recuper", "3 mois", "trois mois", "semaines"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Paralysie faciale périphérique gauche a frigore (paralysie de Bell), House-Brackmann IV",
    summary: "Femme de 38 ans, sans antécédent, qui présente une paralysie faciale gauche installée en quelques heures, précédée d’une douleur rétro-auriculaire, avec atteinte du front, occlusion palpébrale incomplète, dysgueusie et hyperacousie. Pas de vésicule, pas d’otite, pas d’érythème migrant ni d’autre signe neurologique. Corticothérapie débutée dans les 72 heures, protection oculaire et sérologie de Lyme en contexte d’exposition.",
    keyFindings: [
      "Atteinte du front (sourcil, rides frontales) : paralysie faciale périphérique ; une atteinte centrale épargne le haut du visage.",
      "Installation en moins de 72 heures, douleur rétro-auriculaire, dysgueusie et hyperacousie homolatérales.",
      "Signe de Charles Bell, occlusion palpébrale incomplète : risque de kératite d’exposition.",
      "Pas de vésicule auriculaire ni buccale (Ramsay Hunt), tympans normaux, pas d’érythème migrant, autres nerfs crâniens et membres normaux.",
    ],
    redFlags: [
      "Autre déficit neurologique, front épargné ou installation brutale : origine centrale, imagerie en urgence.",
      "Vésicules du conduit auditif, du pavillon ou du palais, surdité ou vertige : syndrome de Ramsay Hunt (antiviral et corticoïdes, avis ORL).",
      "Paralysie bilatérale, récidivante ou d’installation lente (plus de 3 semaines), masse parotidienne : chercher Lyme, Guillain-Barré, sarcoïdose ou tumeur.",
      "Œil rouge douloureux ou baisse de vision : kératite d’exposition, avis ophtalmologique rapide.",
    ],
    management: [
      "Prednisone 60 mg/j pendant 5 jours puis diminution sur 5 jours (ou prednisolone 25 mg 2×/j pendant 10 jours), à débuter dans les 72 heures, en l’absence de contre-indication.",
      "Pas d’antiviral seul ; association à un antiviral seulement en cas de zona auriculaire ou à discuter dans les formes sévères.",
      "Protection de l’œil : larmes artificielles le jour, gel ou pommade ophtalmique et occlusion la nuit, lunettes à l’extérieur.",
      "Sérologie de Lyme en zone d’endémie ou en cas d’exposition ; si positive, doxycycline 100 mg 2×/j pendant 14 à 21 jours.",
      "Information : récupération complète chez environ 70 à 85 % des patients, souvent en 3 semaines à 3 mois ; contrôle à 1–2 semaines et avis ORL ou neurologique sans amélioration à 3 mois.",
    ],
    differentials: [
      "Syndrome de Ramsay Hunt (zona du ganglion géniculé).",
      "Neuroborréliose de Lyme (souvent en été ou automne, parfois bilatérale).",
      "AVC : paralysie faciale centrale, front épargné, autres déficits.",
      "Otite moyenne aiguë ou cholestéatome compliqués, tumeur parotidienne.",
    ],
    sources: [
      { label: "AAO-HNS 2013 — Clinical practice guideline: Bell’s palsy", url: "https://doi.org/10.1177/0194599813505967" },
      { label: "Sullivan et al., NEJM 2007 — Early treatment with prednisolone or acyclovir in Bell’s palsy", url: "https://doi.org/10.1056/NEJMoa072006" },
    ],
    pathologySlugs: ["paralysie-faciale-peripherique"],
  },
};

export const paralysieFacialePeripheriqueDiagnoses: StationDiagnoses = {
  accepted: ["paralysie-faciale"],
  differentials: [
    { label: "Syndrome de Ramsay Hunt (zona auriculaire)", ids: ["zona"] },
    { label: "Neuroborréliose de Lyme", ids: ["lyme"] },
    { label: "AVC ou lésion centrale", ids: ["avc-ischemique", "ait", "tumeur-cerebrale"] },
    { label: "Otite moyenne compliquée", ids: ["otite-moyenne"] },
  ],
};
