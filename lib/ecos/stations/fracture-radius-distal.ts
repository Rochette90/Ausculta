import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, INTENSITY, LOCATION, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "./shared.ts";

const MECHANISM = ["comment c est arrive", "que s est il passe", "qu est ce qui s est passe", "racontez", "comment etes vous tombe", "comment vous etes tombe", "tombe", "chute", "glisse", "trebuch", "mecanisme", "sur la main", "sur quelle main", "la main en avant", "rattrap", "amorti", "receptionne"];
const FALL_CAUSE = ["malaise", "vertige", "tete qui tourne", "perdu connaissance", "evanoui", "palpitation", "avant de tomber", "juste avant", "pourquoi etes vous tombe", "cause de la chute"];
const HEAD = ["tete", "cogne", "choc a la tete", "visage"];
const OTHER_PAIN = ["coude", "epaule", "hanche", "genou", "ailleurs", "autre endroit", "d autres douleurs", "autre part", "mal ailleurs"];
const SIGNS = ["gonfl", "enfle", "hematome", "bleu", "deform", "bosse"];
const NERVES = ["fourmill", "engourdi", "picote", "picotement", "sensibilite", "sentez vos doigts", "sentez bien", "doigts", "froid", "bouger les doigts", "endormi"];
const DOMINANCE = ["droitier", "droitiere", "gaucher", "gauchere", "main dominante", "quelle main", "ecrivez"];
const AUTONOMY = ["vivez", "seule", "domicile", "autonom", "besoin d aide", "qui vous aide", "courses", "menage", "conduis", "voiture", "activites", "loisirs", "jardin", "petits enfants"];
const FRAGILITY = ["osteopor", "os fragiles", "deja casse", "deja fracture", "fracture", "densit", "menopause", "perdu des centimetres", "taille", "vitamine d", "calcium"];
const PREVIOUS_FALLS = ["deja tombe", "autres chutes", "chutes", "tombez souvent"];
const BLOOD_THINNERS = ["anticoag", "fluidif", "aspirine", "eclaircir le sang", "pour le sang"];

export const fractureRadiusDistal: EcosScenario = {
  slug: "fracture-radius-distal",
  version: 1,
  setting: "urgences",
  patient: { name: "Mme Morand", age: 72, sex: "F" },
  painful: true,
  persona: "Dame de 72 ans active et énergique, un peu secouée, qui tient son avant-bras gauche contre elle avec la main droite. Elle répond clairement et s’inquiète surtout de ne plus pouvoir s’occuper de son mari et de ses petits-enfants. Elle ne parle de sa ménopause précoce et de sa perte de taille que si on l’interroge sur la solidité de ses os.",
  brief: [
    "Vous êtes médecin assistant·e aux urgences.",
    "Mme Morand, 72 ans, se présente aux urgences pour une douleur au poignet gauche après une chute dans la rue.",
    "Menez l’anamnèse et l’examen clinique ciblés, demandez les examens complémentaires utiles et interprétez-les, puis posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. J’ai glissé sur le trottoir tout à l’heure et je suis tombée sur la main gauche. Mon poignet me fait très mal, et il a une drôle de forme.",
  history: {
    identity: "Monique Morand, 72 ans.",
    occupation: "Je suis retraitée, j’étais secrétaire dans une étude de notaire.",
    living: "Je vis avec mon mari dans une petite maison à Morges. Je fais tout moi-même : les courses, le jardin, et je garde mes petits-enfants le mercredi.",
    feeling: "J’ai mal, et je suis encore un peu secouée.",
    previousEpisodes: "Je ne me suis jamais rien cassé. Je suis tombée une fois l’automne dernier dans le jardin, sans gravité.",
    course: "Ça a gonflé tout de suite, et la douleur ne passe pas, même en tenant mon bras contre moi.",
    otherSymptoms: "Mon poignet a beaucoup gonflé, je n’ose plus bouger les doigts.",
    medications: "Du candésartan pour la tension, le matin. Et de l’oméprazole pour l’estomac, depuis des années.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "De la tension. J’ai été ménopausée tôt, vers 45 ans, sans traitement hormonal. On m’a enlevé les amygdales quand j’étais petite, c’est tout.",
    familyHistory: "Ma mère avait le dos voûté et elle s’est cassé la hanche vers 80 ans.",
    tobacco: "J’ai fumé une quinzaine de cigarettes par jour jusqu’à 55 ans. Plus rien depuis.",
    alcohol: "Un verre de vin rouge le soir.",
    drugs: "Non, jamais.",
    concerns: "Est-ce qu’il va falloir m’opérer ? Et qui va s’occuper de mon mari et garder les petits mercredi ?",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Il y a environ une heure et demie, vers 10 heures, en allant à la boulangerie." },
    { topic: "mécanisme de la chute", keywords: MECHANISM, reply: "J’ai glissé sur des feuilles mouillées et je suis tombée en avant, de ma hauteur. J’ai mis la main gauche en avant pour me rattraper, à plat, le poignet plié vers l’arrière." },
    { topic: "cause de la chute", keywords: FALL_CAUSE, reply: "Non, pas de malaise, pas de vertige, pas de palpitations. J’ai vraiment glissé, je me souviens de tout." },
    { topic: "tête", keywords: HEAD, reply: "Non, je ne me suis pas cogné la tête, ni le visage. J’ai tout amorti avec la main." },
    { topic: "localisation", keywords: [...LOCATION, "douleur", "avez vous mal", "ca fait mal"], reply: "Au poignet gauche, juste au-dessus de la main, surtout sur le dessus et du côté du pouce." },
    { topic: "autres douleurs", keywords: OTHER_PAIN, reply: "Je me suis un peu éraflé le genou droit, mais je marche normalement. Le coude, l’épaule et les hanches, ça va." },
    { topic: "intensité", keywords: INTENSITY, reply: "Huit sur dix quand je bouge, cinq si je ne touche à rien." },
    { topic: "gonflement et déformation", keywords: SIGNS, reply: "Ça a gonflé tout de suite, et le poignet fait comme une marche sur le dessus. Ce n’est pas joli à voir." },
    { topic: "sensibilité des doigts", keywords: NERVES, reply: "Je sens bien mes doigts, je n’ai pas de fourmis. Je peux les bouger un peu, mais ça tire dans le poignet." },
    { topic: "main dominante", keywords: DOMINANCE, reply: "Je suis droitière, heureusement." },
    { topic: "autonomie", keywords: AUTONOMY, reply: "Je suis très autonome : je conduis, je jardine, je tricote et je garde mes petits-enfants. Mon mari a de la peine à marcher, c’est moi qui fais les courses et le ménage." },
    { topic: "fragilité osseuse", keywords: FRAGILITY, reply: "Je ne me suis jamais rien cassé, et on ne m’a jamais mesuré la solidité des os. J’ai été ménopausée tôt, à 45 ans, sans hormones. Mon médecin dit que j’ai perdu trois centimètres. Je ne prends ni calcium ni vitamine D." },
    { topic: "chutes antérieures", keywords: PREVIOUS_FALLS, reply: "Une seule fois, l’automne dernier, j’ai trébuché sur un tuyau d’arrosage. Sinon je ne tombe pas, je marche sans canne." },
    { topic: "anticoagulant", keywords: BLOOD_THINNERS, reply: "Non, je ne prends rien pour fluidifier le sang." },
    { topic: "dernier repas", keywords: ["mange", "a jeun", "bu$", "repas", "dernier repas", "petit dejeuner"], reply: "J’ai pris mon petit-déjeuner vers 8 heures : un café et une tartine." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 36,6 °C, FC 88/min régulière, TA 152/86 mmHg, FR 16/min, SpO₂ 97 % à l’air ambiant. Glasgow 15, patiente orientée. Douleur 8/10 à la mobilisation." },
    { topic: "examen du poignet", examiner: true, keywords: ["inspect", "palpe", "palpation", "j examine le poignet", "examen du poignet", "dos de fourchette", "tabatiere"], reply: "Poignet gauche : vu de profil, déformation en « dos de fourchette », avec une saillie dorsale juste au-dessus du poignet ; vu de face, main déviée du côté radial. Tuméfaction dorsale et ecchymose débutante. Peau intacte, pas de plaie. Douleur exquise à la palpation du radius distal, 2 à 3 cm au-dessus de l’interligne, et légère douleur à la pointe de la styloïde ulnaire. Tabatière anatomique peu sensible, sans douleur nette en regard du scaphoïde. Coude et épaule gauches indolores, mobiles. Mobilité du poignet non testée à cause de la douleur." },
    planReaction("Remettre en place ? Ça va faire mal ? Et combien de temps avec un plâtre ?", ["reduire", "reduction", "platre", "attelle", "operer", "operation", "chirurg", "orthoped"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes", "glasgow"], key: ["constantes"] },
    { id: "poignet", label: "Inspection et palpation du poignet gauche", category: "examen", pertinent: true, topic: "examen du poignet", covers: ["poignet"] },
    { id: "neurovasculaire", label: "Status neurovasculaire distal du membre supérieur gauche", category: "examen", pertinent: true, result: "Pouls radial gauche bien perçu, recoloration capillaire des doigts inférieure à 2 secondes. Sensibilité conservée à la pulpe du pouce, de l’index et du majeur (nerf médian), au bord ulnaire du 5e doigt (nerf ulnaire) et au dos de la première commissure (nerf radial). Opposition du pouce, écartement des doigts et extension du pouce possibles, limités par la douleur.", covers: ["neurovasculaire-distal", "pouls-peripheriques"] },
    { id: "radiographie", label: "Radiographie du poignet gauche face et profil", category: "complementaire", pertinent: true, result: "Radiographie du poignet gauche de face et de profil, de qualité correcte. Trait d’interruption corticale transversal de la métaphyse du radius distal, à environ 2,5 cm de l’interligne radio-carpien, sans extension à la surface articulaire. De profil : le fragment distal est basculé et déplacé vers le dos ; la surface articulaire du radius regarde vers l’arrière d’environ 25° (normale : environ 11° vers l’avant), avec une petite fragmentation de la corticale dorsale. De face : radius raccourci, variance ulnaire positive de 3 mm, inclinaison radiale réduite à 14° (normale : environ 22°). Petit fragment osseux détaché de la pointe de la styloïde ulnaire. Os du carpe, dont le scaphoïde, sans interruption corticale ; le carpe suit le fragment distal. Déminéralisation diffuse, corticales fines. Tuméfaction des parties molles dorsales.", covers: ["radio-poignet"] },
    { id: "neurologique", label: "Examen neurologique complet", category: "examen", pertinent: false, result: "Pas de déficit focal. Il n’apporte rien de plus ici : chute mécanique sans malaise ni choc à la tête, et le status nerveux de la main se fait avec le status neurovasculaire du membre.", covers: ["examen-neurologique"] },
    { id: "ct-cerebral", label: "CT cérébral", category: "complementaire", pertinent: false, result: "Non indiqué : pas de choc à la tête, pas de trouble de la conscience, pas d’anticoagulant.", covers: ["ct-cerebral"] },
    { id: "radio-bassin", label: "Radiographie du bassin et des hanches", category: "complementaire", pertinent: false, result: "Pas de lésion osseuse. Elle n’était pas indiquée : hanches indolores et marche normale.", covers: ["radio-bassin-hanche"] },
    { id: "radio-thorax", label: "Radiographie du thorax", category: "complementaire", pertinent: false, result: "Pas de foyer, pas de fracture de côte visible. Elle n’était pas indiquée : pas de douleur thoracique ni de gêne respiratoire.", covers: ["radio-thorax"] },
    { id: "echographie", label: "Échographie du poignet", category: "complementaire", pertinent: false, result: "Hématome des parties molles dorsales. Elle n’apporte rien ici : la radiographie suffit pour évaluer l’os.", covers: ["echo-articulaire"] },
    { id: "d-dimeres", label: "D-dimères", category: "complementaire", pertinent: false, result: "0,9 mg/L : non interprétables après un traumatisme chez une patiente de 72 ans, et sans aucune suspicion de thrombose.", covers: ["d-dimeres"] },
  ],
  catalogResults: {
    "peau": "Peau du poignet gauche intacte, ecchymose dorsale débutante ; éraflure superficielle du genou droit.",
    "membres-inferieurs": "Éraflure superficielle du genou droit, sans tuméfaction ni douleur osseuse ; reste des membres inférieurs sans particularité.",
    "genou-inspection": "Éraflure superficielle de la face antérieure du genou droit ; genoux secs, indolores à la palpation.",
  },
  acceptable: ["hanche", "ecg", "fsc", "crase", "creatinine", "ionogramme"],
  diagnosisChoice: { correct: "Fracture extra-articulaire du radius distal gauche à déplacement dorsal (Pouteau-Colles)", distractors: ["Fracture du scaphoïde gauche", "Entorse du poignet gauche", "Luxation périlunaire du carpe gauche"] },
  criteria: [
    presentationCriterion,
    {
      id: "fall",
      label: "Explore la chute",
      hint: "Mécanisme (chute sur la main en extension), cause (malaise, vertige), choc à la tête",
      points: 3,
      groups: [MECHANISM, FALL_CAUSE, HEAD],
    },
    {
      id: "symptoms",
      label: "Recherche les lésions associées et les complications",
      hint: "Autres douleurs (coude, épaule, hanche), troubles sensitifs des doigts",
      points: 2,
      groups: [OTHER_PAIN, NERVES],
    },
    {
      id: "terrain",
      label: "Situe la patiente",
      hint: "Main dominante, autonomie et activités, facteurs de risque d’ostéoporose",
      points: 3,
      groups: [DOMINANCE, AUTONOMY, FRAGILITY],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen ciblé",
      hint: "Constantes, déformation du poignet, tabatière anatomique, status neurovasculaire (nerf médian)",
      points: 2,
      groups: [VITALS, ["poignet", "palp", "fourchette", "tabatiere", "pouls", "sensibilite", "median"]],
    },
    {
      id: "analysis",
      label: "Interprète la radiographie",
      hint: "Fracture métaphysaire du radius distal, bascule dorsale, raccourcissement, extra-articulaire",
      points: 3,
      groups: [
        ["radius distal", "metaphys", "radius$", "extremite distale du radius", "epiphyse radiale"],
        ["bascule dorsale", "bascule posterieure", "deplacement dorsal", "dorsal", "posterieur", "pouteau", "colles"],
        ["raccourcissement", "raccourci", "variance ulnaire", "impaction", "inclinaison radiale", "ascension"],
        ["extra articulaire", "extraarticulaire", "interligne respecte", "pas d atteinte articulaire", "surface articulaire intacte", "non articulaire"],
      ],
    },
    {
      id: "management",
      label: "Propose une prise en charge adaptée",
      hint: "Antalgie, réduction sous anesthésie, immobilisation plâtrée et contrôle radiologique, bilan d’ostéoporose et prévention des chutes",
      points: 3,
      groups: [
        ["antalg", "anesthesie", "bloc", "paracetamol", "morphin", "opio", "glace", "surelev"],
        ["reduction", "reduire", "reaxer", "manipul", "traction"],
        ["platre", "attelle", "immobilis", "gouttiere", "contention", "orthese"],
        ["osteopor", "densito", "vitamine d", "calcium", "bisphosph", "prevention des chutes", "bilan de chute", "fragilite"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Fracture extra-articulaire du radius distal gauche à déplacement dorsal (type Pouteau-Colles), avec arrachement de la pointe de la styloïde ulnaire, fracture de fragilité chez une patiente à risque d’ostéoporose",
    summary: "Chute de sa hauteur sur la main en extension chez une dame de 72 ans active, droitière, avec déformation du poignet gauche en dos de fourchette. Le status neurovasculaire est normal, en particulier le nerf médian. La radiographie montre une fracture métaphysaire extra-articulaire du radius distal, basculée vers le dos et raccourcie, sur un os déminéralisé. Prise en charge : antalgie, réduction sous anesthésie locorégionale, immobilisation plâtrée et contrôle radiologique, avis orthopédique en raison des facteurs d’instabilité ; cette fracture de fragilité impose un bilan d’ostéoporose et de chute.",
    keyFindings: [
      "Chute de sa hauteur sur la main en extension, sans malaise ni choc à la tête : mécanisme typique d’une fracture du radius distal à déplacement dorsal.",
      "Déformation en dos de fourchette de profil et main déviée du côté radial de face.",
      "Nerf médian, pouls radial et peau intacts : pas de complication immédiate.",
      "Ménopause précoce, perte de taille, ancien tabagisme, mère avec une fracture de hanche, IPP au long cours : profil d’ostéoporose ; une fracture du poignet est souvent la première fracture de fragilité.",
    ],
    redFlags: [
      "Paresthésies du médian qui s’aggravent ou plâtre trop serré : syndrome du canal carpien aigu ou syndrome des loges, à décomprimer en urgence.",
      "Fracture ouverte ou peau menacée par la déformation : antibiotiques, vaccin antitétanique, réduction et chirurgie urgentes.",
      "Chute sur malaise, ou douleur de la hanche ou de l’épaule associée : chercher la cause de la chute et une autre fracture.",
    ],
    management: [
      "Antalgie (paracétamol, opioïde faible si besoin), surélévation du membre, glace, retrait des bagues.",
      "Réduction fermée par traction sous anesthésie (bloc à l’hématome ou bloc régional), puis attelle plâtrée antébrachiale et radiographie de contrôle, avec un nouveau status du nerf médian.",
      "Avis orthopédique : plusieurs facteurs d’instabilité (bascule dorsale > 20°, fragmentation dorsale, styloïde ulnaire, âge). Après 65 ans, le traitement conservateur donne souvent un résultat fonctionnel comparable à la plaque palmaire ; l’opération se discute si la réduction est perdue chez une patiente active.",
      "Contrôles radiologiques à environ une et deux semaines, immobilisation de 4 à 6 semaines, mobilisation des doigts, du coude et de l’épaule dès le premier jour, puis physiothérapie (ergothérapie de la main).",
      "Fracture de fragilité : densitométrie osseuse, calcium et vitamine D, traitement anti-ostéoporotique (bisphosphonate) selon les recommandations de l’Association suisse contre l’ostéoporose, évaluation et prévention des chutes, aide à domicile le temps de l’immobilisation.",
    ],
    differentials: [
      "Fracture du scaphoïde (tabatière anatomique douloureuse, radiographie parfois normale au début : incidences spécifiques, CT ou IRM).",
      "Fracture du radius distal à déplacement palmaire (Goyrand-Smith, chute sur le dos du poignet) ou fracture articulaire (Barton, fracture de la styloïde radiale).",
      "Luxation périlunaire ou lésion du ligament scapho-lunaire (carpe désaxé de profil).",
      "Lésion associée du membre : coude (tête radiale), épaule (luxation, coiffe, humérus proximal), ou fracture de la hanche après la chute.",
    ],
    examReading: [
      "Interruption corticale transversale de la métaphyse du radius distal, à 2 à 3 cm de l’interligne : fracture du radius distal.",
      "Fragment distal basculé vers le dos (surface articulaire orientée de 25° vers l’arrière au lieu de 11° vers l’avant) : déplacement dorsal de type Pouteau-Colles, qui explique le dos de fourchette.",
      "Variance ulnaire positive de 3 mm et inclinaison radiale réduite : raccourcissement et impaction du radius, à corriger par la réduction.",
      "Trait n’atteignant pas la surface articulaire : fracture extra-articulaire ; fragmentation dorsale et arrachement de la styloïde ulnaire : facteurs d’instabilité.",
      "Carpe et scaphoïde intacts ; os déminéralisé aux corticales fines : terrain ostéoporotique.",
    ],
    sources: [
      { label: "NICE NG38 — Fractures (non-complex): assessment and management", url: "https://www.nice.org.uk/guidance/ng38" },
      { label: "Association suisse contre l’ostéoporose (SVGO) — Recommandations", url: "https://www.svgo.ch" },
    ],
    pathologySlugs: [],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const fractureRadiusDistalDiagnoses: StationDiagnoses = {
  accepted: ["fracture-poignet"],
  differentials: [
    d("Fracture du scaphoïde", "fracture-scaphoide"),
    d("Lésion associée de l’épaule (luxation, coiffe des rotateurs)", "luxation-epaule", "rupture-coiffe"),
    d("Fracture associée de la hanche", "fracture-col-femur"),
    d("Chute sur malaise (syncope, hypotension orthostatique)", "syncope-vasovagale", "hypotension-orthostatique"),
  ],
};
