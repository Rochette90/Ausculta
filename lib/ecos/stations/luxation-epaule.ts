import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, INTENSITY, LOCATION, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "./shared.ts";

const MECHANISM = ["comment c est arrive", "que s est il passe", "qu est ce qui s est passe", "racontez", "mecanisme", "comment etes vous tombe", "comment vous etes tombe", "tombe", "chute", "position du bras", "votre bras etait", "dans quelle position", "rattrap", "vitesse"];
const DISLOCATION = ["deboit", "sorti", "deplace", "craqu", "crac", "claqu", "bruit", "remis en place", "remise en place", "rentre", "bosse"];
const PREVIOUS = ["premiere fois", "deja eu", "deja sorti", "deja luxe", "deja deboite", "deja arrive", "avant$", "recidiv", "laxe", "souple", "hyperlax"];
const NERVES = ["fourmill", "engourdi", "sensibilite", "picote", "sentez", "endormi", "froid", "doigts", "la main", "votre main"];
const OTHER_INJURY = ["tete", "cogne", "casque", "nuque", "cou$", "dos$", "ailleurs", "autre endroit", "d autres douleurs", "poignet", "coude", "hanche", "genou", "perdu connaissance"];
const DOMINANCE = ["droitier", "gaucher", "main dominante", "quelle main", "ecrivez"];
const SPORT_JOB = ["sport", "snowboard", "pratique", "niveau", "profession", "travail", "metier", "boulot", "charpentier", "escalade"];

export const luxationEpaule: EcosScenario = {
  slug: "luxation-epaule",
  version: 1,
  setting: "urgences",
  patient: { name: "M. Bonvin", age: 24, sex: "M" },
  painful: true,
  persona: "Jeune homme sportif, très douloureux, assis penché en avant en soutenant son bras gauche avec la main droit. Il est crispé et pressé qu’on le soulage ; il répond brièvement mais volontiers et s’inquiète pour son apprentissage de charpentier.",
  brief: [
    "Vous êtes médecin assistant·e aux urgences.",
    "M. Bonvin, 24 ans, se présente aux urgences pour une douleur à l’épaule gauche après une chute à snowboard.",
    "Menez l’anamnèse et l’examen clinique ciblés, demandez les examens complémentaires utiles et interprétez-les, puis posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour… Je suis tombé à snowboard tout à l’heure, et je crois que mon épaule gauche est sortie. J’ai super mal, je n’arrive plus à bouger le bras.",
  history: {
    identity: "Mathieu Bonvin, 24 ans.",
    occupation: "Je suis apprenti charpentier, en dernière année.",
    living: "J’habite à Sion avec ma copine, dans un appartement.",
    feeling: "J’ai très mal, je n’ose pas bouger.",
    previousEpisodes: "Non, c’est la première fois. Je n’ai jamais eu de problème avec mes épaules.",
    course: "Rien n’a changé depuis la chute : le bras est bloqué, je le tiens avec l’autre main.",
    otherSymptoms: "Je n’arrive pas à ramener le bras contre le corps, il reste écarté.",
    medications: "Rien, je ne prends jamais de médicaments. Les pisteurs m’ont donné un Dafalgan sur la piste.",
    allergies: "Aucune allergie.",
    personalHistory: "Rien, je suis en bonne santé. On m’a opéré de l’appendicite à 12 ans, l’anesthésie s’était bien passée.",
    familyHistory: "Rien de spécial.",
    tobacco: "Quelques cigarettes en soirée, pas tous les jours.",
    alcohol: "Quelques bières le week-end. Aujourd’hui rien, j’étais sur les pistes.",
    drugs: "Un joint de temps en temps. Pas aujourd’hui.",
    concerns: "Vous allez la remettre en place ? Et je vais pouvoir retravailler ? Je porte des poutres et je suis sur les toits toute la journée.",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Il y a environ une heure et demie, vers 14 heures. Les pisteurs m’ont descendu en luge, puis l’ambulance m’a amené ici." },
    { topic: "mécanisme", keywords: MECHANISM, reply: "J’ai pris une bosse trop vite et je suis tombé en arrière, sur le côté gauche. J’ai mis le bras gauche derrière moi pour me rattraper, écarté et tourné vers l’extérieur, et j’ai senti l’épaule partir vers l’avant." },
    { topic: "déboîtement", keywords: DISLOCATION, reply: "Oui, j’ai senti un gros craquement et l’épaule est sortie, il y a un creux bizarre sous l’os du dessus. Elle n’est pas rentrée toute seule, et personne n’a essayé de la remettre." },
    { topic: "épisodes antérieurs", keywords: PREVIOUS, reply: "Non, c’est la première fois. Je n’ai jamais eu l’épaule qui sort, ni d’un côté ni de l’autre. Je ne suis pas spécialement souple." },
    { topic: "localisation", keywords: [...LOCATION, "douleur", "avez vous mal", "ca fait mal"], reply: "Toute l’épaule gauche, surtout devant. Ça ne descend pas vraiment dans le bras." },
    { topic: "intensité", keywords: INTENSITY, reply: "Neuf sur dix, surtout si on touche à mon bras." },
    { topic: "sensibilité", keywords: NERVES, reply: "Non, pas de fourmis. Je sens mes doigts et je peux les bouger. Le haut du bras, je n’ai pas fait attention." },
    { topic: "autres lésions", keywords: OTHER_INJURY, reply: "Je portais un casque, je ne me suis pas cogné la tête et je n’ai pas perdu connaissance. La nuque, le dos, le poignet et le reste, ça va." },
    { topic: "main dominante", keywords: DOMINANCE, reply: "Je suis droitier." },
    { topic: "sport et métier", keywords: SPORT_JOB, reply: "Je fais du snowboard tous les week-ends l’hiver, et de l’escalade en salle. Et je suis apprenti charpentier : je porte des poutres et je travaille souvent les bras au-dessus de la tête." },
    { topic: "dernier repas", keywords: ["mange", "a jeun", "bu$", "repas", "dernier repas", "boire"], reply: "J’ai mangé un sandwich vers midi, et bu un thé chaud." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 36,9 °C, FC 104/min régulière, TA 138/82 mmHg, FR 18/min, SpO₂ 99 % à l’air ambiant. Glasgow 15. Douleur 9/10." },
    { topic: "examen de l’épaule", examiner: true, keywords: ["inspect", "palpe", "palpation", "j examine l epaule", "examen de l epaule", "epaulette", "attitude"], reply: "Patient assis, penché en avant, soutenant son avant-bras gauche avec la main droit. Épaule gauche : perte du galbe du deltoïde avec un acromion saillant (aspect en épaulette), vide sous-acromial et comblement du sillon delto-pectoral ; tête humérale palpable en avant, sous la coracoïde. Bras bloqué en légère abduction et rotation externe ; l’adduction et la rotation interne sont impossibles et très douloureuses. Peau intacte. Clavicule et articulation acromio-claviculaire indolores. Coude et poignet gauches indolores. Rachis cervical indolore à la palpation." },
    planReaction("Vous allez tirer dessus ? Vous pouvez m’endormir un peu avant ?", ["reduire", "reduction", "remettre", "sedation", "endormir", "gilet", "echarpe", "physio"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "epaule", label: "Inspection et palpation de l’épaule gauche, attitude du membre", category: "examen", pertinent: true, topic: "examen de l’épaule", covers: ["epaule"] },
    { id: "neurovasculaire", label: "Status neurovasculaire du membre supérieur gauche", category: "examen", pertinent: true, result: "Sensibilité conservée au moignon de l’épaule, sur la face latérale du deltoïde (nerf axillaire) ; contraction du deltoïde perçue à la palpation, force non testable à cause de la douleur. Pouls radial gauche bien perçu et symétrique, recoloration inférieure à 2 secondes. Sensibilité et motricité de la main et de l’avant-bras conservées (nerfs médian, ulnaire, radial et musculo-cutané).", covers: ["neurovasculaire-distal", "pouls-peripheriques", "examen-neurologique"], key: ["neurovasculaire-distal", "examen-neurologique"] },
    { id: "radiographie", label: "Radiographie de l’épaule gauche face et profil de Lamy", category: "complementaire", pertinent: true, result: "Radiographie de l’épaule gauche, incidence de face et profil de Lamy (profil de l’omoplate en Y), avant tout geste. De face : la tête humérale ne se projette plus en regard de la glène ; elle est située en dedans et en dessous de celle-ci, sous l’apophyse coracoïde, et la glène est inhabitée. De profil de Lamy : la tête humérale se projette en avant du centre du Y, du côté de la coracoïde ; la glène est vide. Petite encoche corticale à la face postéro-latérale de la tête humérale, appuyée contre le rebord antéro-inférieur de la glène. Pas d’interruption corticale du tubercule majeur, du col huméral ni du rebord glénoïdien. Clavicule et articulation acromio-claviculaire sans particularité.", covers: ["radio-epaule"], image: { src: "/ecos/imagerie/station-35-radio-epaule-face.jpg", alt: "Radiographie de l’épaule de face", credit: { author: "Mikael Häggström", license: "CC0 1.0" } } },
    { id: "radio-cervicale", label: "Radiographie de la colonne cervicale", category: "complementaire", pertinent: false, result: "Alignement conservé, pas de lésion osseuse. Elle n’était pas indiquée : casque, pas de choc à la tête, nuque indolore, pas de déficit (critères NEXUS négatifs).", covers: ["radio-colonne-cervicale"] },
    { id: "radio-thorax", label: "Radiographie du thorax", category: "complementaire", pertinent: false, result: "Pas de pneumothorax ni de fracture de côte visible. Elle n’était pas indiquée : pas de douleur thoracique, respiration normale.", covers: ["radio-thorax"] },
    { id: "echographie", label: "Échographie de l’épaule", category: "complementaire", pertinent: false, result: "Non indiquée en urgence : elle ne change rien avant le geste. Elle se discute à distance si l’on suspecte une lésion de la coiffe des rotateurs.", covers: ["echo-articulaire"] },
    { id: "bilan-sanguin", label: "Bilan sanguin (FSC, crase)", category: "complementaire", pertinent: false, result: "Valeurs normales. Il n’apporte rien chez ce jeune homme en bonne santé, même avant une sédation.", covers: ["fsc", "crase"] },
    { id: "ct-cerebral", label: "CT cérébral", category: "complementaire", pertinent: false, result: "Non indiqué : casque, pas de choc à la tête, pas de perte de connaissance, Glasgow 15.", covers: ["ct-cerebral"] },
  ],
  catalogResults: {
    "peau": "Peau intacte en regard de l’épaule gauche, pas de plaie.",
    "coordination": "Marche normale ; le patient soutient son bras gauche avec la main droit.",
    "rachis": "Rachis cervical, dorsal et lombaire indolores à la palpation ; mobilité cervicale conservée.",
  },
  diagnosisChoice: { correct: "Luxation antérieure de l’épaule gauche, premier épisode", distractors: ["Fracture de l’extrémité proximale de l’humérus gauche", "Luxation acromio-claviculaire gauche", "Rupture aiguë de la coiffe des rotateurs gauche"] },
  criteria: [
    presentationCriterion,
    {
      id: "mechanism",
      label: "Précise le traumatisme",
      hint: "Mécanisme (bras en abduction et rotation externe), sensation de déboîtement, premier épisode ou récidive",
      points: 3,
      groups: [MECHANISM, DISLOCATION, PREVIOUS],
    },
    {
      id: "complications",
      label: "Recherche les complications et les lésions associées",
      hint: "Troubles sensitifs du bras et de la main, choc à la tête, autres douleurs (nuque, poignet)",
      points: 2,
      groups: [NERVES, OTHER_INJURY],
    },
    {
      id: "context",
      label: "Situe le patient",
      hint: "Main dominante, sport et métier (risque de récidive, reprise)",
      points: 2,
      groups: [DOMINANCE, SPORT_JOB],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen ciblé",
      hint: "Constantes, attitude du membre et épaulette, nerf axillaire (sensibilité du moignon de l’épaule), pouls radial",
      points: 2,
      groups: [VITALS, ["epaule", "palp", "axillaire", "deltoid", "pouls", "sensibilite"]],
    },
    {
      id: "analysis",
      label: "Interprète la radiographie",
      hint: "Tête humérale hors de la glène, en avant et sous la coracoïde, encoche de Hill-Sachs, pas de fracture du tubercule majeur ni de la glène",
      points: 4,
      groups: [
        ["anterieur", "antero", "en avant", "sous coracoid", "preglenoid"],
        ["luxation", "luxe", "glene vide", "glene inhabit", "perte de contact", "deboit", "decoapt", "incongruen"],
        ["hill sachs", "encoche", "impaction", "malgaigne"],
        ["tubercule majeur", "trochiter", "pas de fracture", "col humeral", "rebord glenoidien", "glene intact", "bankart"],
      ],
    },
    {
      id: "management",
      label: "Propose une prise en charge adaptée",
      hint: "Analgésie ou sédation, réduction douce, contrôle radiologique et neurovasculaire après réduction, immobilisation courte, physiothérapie et avis orthopédique",
      points: 3,
      groups: [
        ["reduction", "reduire", "remettre en place", "kocher", "milch", "fares", "cunningham", "stimson", "manoeuvre"],
        ["antalg", "sedation", "analges", "morphin", "fentanyl", "ketamine", "propofol", "meopa", "protoxyde", "intra articulaire", "lidocaine", "bloc"],
        ["controle", "radiographie apres", "radio apres", "apres la reduction", "reexamin"],
        ["gilet", "echarpe", "immobilis", "coude au corps", "attelle", "physio", "reeducation", "recidiv", "orthoped", "irm", "arthro"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Luxation antéro-interne (sous-coracoïdienne) de l’épaule gauche, premier épisode, avec encoche de Hill-Sachs, sans fracture associée et sans atteinte du nerf axillaire",
    summary: "Chute à snowboard sur le bras en abduction et rotation externe chez un jeune homme droitier, avec sensation de déboîtement, épaule en épaulette et bras bloqué en abduction-rotation externe. Le nerf axillaire et le pouls radial sont intacts. La radiographie de face et de profil de Lamy montre la tête humérale en avant de la glène, sous la coracoïde, avec une encoche de Hill-Sachs et sans fracture du tubercule majeur ni de la glène. Prise en charge : analgésie ou sédation, réduction douce, nouveau status neurovasculaire et radiographie de contrôle, immobilisation courte, physiothérapie et avis orthopédique, car le risque de récidive est très élevé chez ce jeune sportif.",
    keyFindings: [
      "Mécanisme en abduction et rotation externe forcées, sensation que l’épaule « sort » vers l’avant.",
      "Épaule en épaulette, tête palpable sous la coracoïde, bras bloqué en abduction-rotation externe.",
      "Sensibilité du moignon de l’épaule et pouls radial conservés : nerf axillaire et artère axillaire intacts, à documenter avant et après la réduction.",
      "Premier épisode à 24 ans, sport à risque et travail les bras en l’air : risque de récidive très élevé.",
    ],
    redFlags: [
      "Hypoesthésie du moignon de l’épaule : lésion du nerf axillaire, à documenter avant tout geste.",
      "Pouls radial absent, membre froid ou hématome expansif : lésion de l’artère axillaire, urgence vasculaire.",
      "Fracture du col huméral associée : pas de réduction fermée aux urgences (risque de déplacer la fracture), avis orthopédique.",
    ],
    management: [
      "Analgésie rapide (opioïde intraveineux, injection intra-articulaire de lidocaïne ou sédation procédurale surveillée).",
      "Réduction douce et sans force excessive (méthodes de Cunningham, FARES, Milch ou Stimson), après la radiographie dans un premier épisode traumatique.",
      "Après la réduction : nouveau status neurovasculaire (nerf axillaire, pouls radial) et radiographie de contrôle de face et de profil.",
      "Immobilisation coude au corps (gilet ou écharpe) pour le confort, 1 à 3 semaines, puis physiothérapie de renforcement ; reprise du snowboard et du travail en hauteur seulement après récupération de la force et de la stabilité.",
      "Avis orthopédique et IRM à distance (lésion de Bankart, coiffe) : chez un jeune sportif, le risque de récidive dépasse 50 % ; une stabilisation chirurgicale se discute.",
    ],
    differentials: [
      "Fracture de l’extrémité proximale de l’humérus ou du tubercule majeur (isolée ou associée à la luxation).",
      "Luxation acromio-claviculaire ou fracture de la clavicule (douleur et déformation plus internes, sur le dessus de l’épaule).",
      "Luxation postérieure de l’épaule (bras bloqué en rotation interne ; après une crise d’épilepsie ou une électrocution).",
      "Rupture aiguë de la coiffe des rotateurs (surtout après 40 ans, parfois associée à une luxation).",
    ],
    examReading: [
      "Face : tête humérale hors de la glène, en dedans et en dessous, sous la coracoïde, glène inhabitée : luxation antéro-interne, sous-coracoïdienne.",
      "Profil de Lamy : tête en avant du centre du Y, glène vide : confirme le caractère antérieur, que la seule incidence de face peut faire méconnaître.",
      "Encoche postéro-latérale de la tête humérale, appuyée sur le rebord antérieur de la glène : encoche de Hill-Sachs (Malgaigne), lésion d’impaction fréquente qui favorise les récidives.",
      "Tubercule majeur, col huméral et rebord glénoïdien intacts : pas de fracture associée, la réduction fermée aux urgences est possible.",
    ],
    sources: [
      { label: "StatPearls — Anterior Shoulder Dislocation (NCBI Bookshelf)", url: "https://www.ncbi.nlm.nih.gov/books/NBK448168/" },
    ],
    pathologySlugs: [],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const luxationEpauleDiagnoses: StationDiagnoses = {
  accepted: ["luxation-epaule"],
  differentials: [
    d("Rupture aiguë de la coiffe des rotateurs", "rupture-coiffe"),
    d("Lésion associée du rachis cervical", "fracture-vertebrale"),
    d("Fracture associée du poignet ou du scaphoïde", "fracture-poignet", "fracture-scaphoide"),
  ],
};
