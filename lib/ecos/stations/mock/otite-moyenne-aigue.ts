import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { communicationCriterion, FEVER, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "../shared.ts";

const EAR = ["oreille", "touche", "tire", "otalg", "mal aux oreilles", "mal a l oreille"];
const PAIN = ["douleur", "a mal", "mal a", "souffr", "ou a t elle mal", "intensit", "sur 10", "soulag"];
const DISCHARGE = ["ecoulement de l oreille", "ecoulement", "ecoul", "coule de l oreille", "sort de l oreille", "pus$", "liquide", "otorrh"];
const NIGHT = ["nuit", "dort", "dormi", "sommeil", "pleur", "reveil", "consol", "couch"];
const RHINITIS = ["rhume", "enrhum", "nez", "mouch", "toux", "tousse"];
const DIGESTIVE = ["mange", "manger", "boit", "boire", "appetit", "vomi", "diarrh", "selles", "couche", "pipi"];
const ALARM = ["nuque", "raide", "bouton", "tache", "eruption", "somnol", "endormi", "mou$", "molle", "derriere l oreille", "gonfl", "decolle", "convuls", "lumiere", "joue$", "jouer", "comportement", "reactive"];
const PREVIOUS = ["deja eu", "deja fait", "otite", "combien de fois", "infections", "premiere fois", "antecedent"];
const RISK = ["creche", "garde", "maman de jour", "tetine", "lolette", "sucette", "fume", "tabac", "cigarette"];

export const otiteMoyenneAigue: EcosScenario = {
  slug: "otite-moyenne-aigue",
  version: 1,
  setting: "cabinet",
  patient: { name: "Lina", age: 2, sex: "F" },
  proxy: true,
  voiceSex: "M",
  painful: true,
  persona: "C’est le père de Lina, 2 ans, qui répond. Fatigué par une mauvaise nuit mais calme et coopérant ; il a bien observé sa fille et répond simplement, sans vocabulaire médical. Il aimerait savoir s’il faut des antibiotiques.",
  brief: [
    "Vous êtes médecin assistant·e dans un cabinet de pédiatrie.",
    "Lina, 2 ans, consulte au cabinet avec son papa pour de la fièvre et des pleurs pendant la nuit.",
    "L’enfant parle encore peu : son père répond. Menez l’anamnèse, décrivez le status et les examens utiles, puis donnez votre hypothèse et la suite.",
  ],
  opening: "Bonjour docteur. Lina a de la fièvre depuis hier et cette nuit elle a pleuré pendant des heures. Elle n’arrête pas de se tenir l’oreille.",
  history: {
    identity: "Elle s’appelle Lina Golay, elle a deux ans et deux mois. Je suis son papa, Olivier.",
    occupation: "Elle va à la crèche trois jours par semaine.",
    living: "Elle vit avec sa maman, moi et son petit frère de huit mois.",
    feeling: "Elle est grognon et fatiguée, mais entre deux poussées de fièvre elle joue un peu.",
    previousEpisodes: "Elle a déjà fait une otite l’hiver passé, vers 15 mois. Depuis, rien.",
    course: "Elle a le nez qui coule depuis quatre jours, la fièvre est arrivée hier après-midi, et cette nuit elle s’est réveillée en hurlant.",
    otherSymptoms: "Elle mange moins que d’habitude.",
    medications: "Rien de régulier. Je lui ai donné du paracétamol en sirop hier soir et ce matin.",
    allergies: "Pas d’allergie connue, elle a bien supporté l’antibiotique la dernière fois.",
    personalHistory: "Née à terme, sans problème. À part l’otite de l’an passé et des rhumes, elle n’a jamais été malade ni hospitalisée.",
    familyHistory: "Moi, j’ai eu beaucoup d’otites petit, on m’a posé des drains dans les oreilles. Sinon rien de particulier.",
    tobacco: "Personne ne fume à la maison.",
    alcohol: "Non.",
    drugs: "Non.",
    concerns: "Est-ce qu’il lui faut des antibiotiques ? Et est-ce que ça peut abîmer son audition ?",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Le nez coule depuis quatre jours. La fièvre a commencé hier après-midi, et cette nuit elle s’est réveillée en pleurant très fort." },
    { topic: "oreille", keywords: EAR, reply: "Elle se tient l’oreille droite et elle tire dessus. Quand je lui demande où elle a mal, elle montre cette oreille-là." },
    { topic: "douleur", keywords: PAIN, reply: "Elle a mal à l’oreille droite, surtout quand elle est couchée : elle pleure et on n’arrive pas à la consoler. Le paracétamol la soulage quelques heures." },
    { topic: "fièvre", keywords: FEVER, reply: "38,8 °C hier soir, pris dans les fesses. Avec le paracétamol, ça redescend pendant quelques heures." },
    { topic: "écoulement", keywords: DISCHARGE, reply: "Non, rien ne coule de l’oreille, je n’ai rien vu sur l’oreiller." },
    { topic: "nuit", keywords: NIGHT, reply: "Cette nuit elle s’est réveillée trois fois en pleurant, elle ne voulait pas se recoucher. Elle s’est un peu calmée assise contre moi." },
    { topic: "rhume", keywords: RHINITIS, reply: "Elle a le nez qui coule depuis quatre jours, c’est devenu jaune-vert, et elle tousse un peu le matin. Rien d’autre." },
    { topic: "respiration", keywords: ["respir", "essouffl", "siffl", "souffle$"], reply: "Non, elle respire normalement." },
    { topic: "alimentation et digestion", keywords: DIGESTIVE, reply: "Elle mange moins, mais elle boit bien son lait et de l’eau. Pas de vomissements, pas de diarrhée, ses couches sont mouillées comme d’habitude." },
    { topic: "signes d’alarme", keywords: ALARM, reply: "Non, elle tourne bien la tête, elle n’a pas de boutons ni de taches. Derrière l’oreille, ce n’est ni rouge ni gonflé. Entre les poussées de fièvre, elle joue et elle me répond." },
    { topic: "audition", keywords: ["entend", "audition", "sourd", "parle", "langage", "mots"], reply: "Elle m’a l’air d’entendre comme d’habitude. Elle dit beaucoup de mots et commence les petites phrases." },
    { topic: "otites antérieures", keywords: PREVIOUS, reply: "Elle a fait une otite l’hiver passé, vers 15 mois, soignée avec un sirop d’antibiotique. Depuis, rien." },
    { topic: "vaccins", keywords: ["vaccin", "carnet"], reply: "Tous ses vaccins sont à jour, y compris celui contre le pneumocoque, d’après la pédiatre." },
    { topic: "crèche", keywords: ["creche", "garde", "maman de jour", "entourage", "contact", "malade autour"], reply: "Elle va à la crèche trois jours par semaine. Plusieurs enfants y sont enrhumés en ce moment." },
    { topic: "tétine", keywords: ["tetine", "lolette", "sucette", "pouce", "biberon"], reply: "Elle a encore sa lolette pour dormir, et elle boit un biberon de lait le soir dans son lit." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 38,5 °C, FC 128/min, FR 26/min, SpO₂ 98 %, temps de recoloration inférieur à 2 secondes. Enfant fatiguée mais réactive." },
    { topic: "poids", examiner: true, keywords: ["poids", "pese", "kilo"], reply: "Poids 12,4 kg, sur sa courbe habituelle." },
    { topic: "otoscopie", examiner: true, keywords: ["otoscop", "tympan", "conduit", "regarde dans l oreille"], reply: "Tympan droit rouge, opaque et bombant, sans reflet lumineux, pas de perforation. Tympan gauche rosé, en place. Conduits auditifs propres, traction du pavillon indolore." },
    { topic: "gorge et ganglions", examiner: true, keywords: ["gorge", "amygdal", "ganglion", "pharynx"], reply: "Rhinorrhée jaune-vert, gorge discrètement rouge, amygdales sans dépôt. Petits ganglions sous l’angle de la mâchoire, mobiles, infracentimétriques." },
    { topic: "mastoïdes", examiner: true, keywords: ["mastoid", "pavillon", "retro auricul"], reply: "Région mastoïdienne sans rougeur ni gonflement, indolore à la palpation ; pavillons non décollés." },
    { topic: "signes méningés", examiner: true, keywords: ["meninge", "kernig", "brudzinski", "raideur de nuque"], reply: "Pas de raideur de nuque, signes de Kernig et de Brudzinski négatifs. Peau sans purpura." },
    { topic: "auscultation pulmonaire", examiner: true, keywords: ["auscult", "poumon", "stethoscope"], reply: "Murmure vésiculaire symétrique, sans crépitant ni sibilant. Pas de signe de lutte." },
    { topic: "bandelette urinaire", examiner: true, keywords: ["bandelette", "stix", "urine"], reply: "Bandelette urinaire négative : leucocytes et nitrites négatifs." },
    planReaction("D’accord. Donc d’abord quelque chose contre la douleur ? Et si ça ne passe pas, on revient ?", ["paracetamol", "ibuprofene", "antalg", "amoxicil", "antibio", "sirop", "revoir", "controle", "48"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes"] },
    { id: "poids", label: "Poids", category: "constantes", pertinent: true, topic: "poids", covers: ["poids"] },
    { id: "otoscopie", label: "Otoscopie bilatérale", category: "examen", pertinent: true, topic: "otoscopie", covers: ["examen-orl"] },
    { id: "gorge-ganglions", label: "Examen de la gorge et des ganglions cervicaux", category: "examen", pertinent: true, topic: "gorge et ganglions", covers: ["examen-orl", "adenopathies"] },
    { id: "mastoides", label: "Palpation des régions mastoïdiennes", category: "examen", pertinent: true, topic: "mastoïdes", covers: ["examen-orl"] },
    { id: "signes-meninges", label: "Recherche de signes méningés", category: "examen", pertinent: true, topic: "signes méningés", covers: ["signes-meninges"] },
    { id: "auscultation-pulmonaire", label: "Auscultation pulmonaire", category: "examen", pertinent: true, topic: "auscultation pulmonaire", covers: ["auscultation-pulmonaire"] },
    { id: "fsc-crp", label: "Formule sanguine et CRP", category: "complementaire", pertinent: false, covers: ["fsc", "crp"], result: "Non indiquées : le diagnostic est clinique et l’enfant n’a pas de signe de gravité." },
    { id: "radio-thorax", label: "Radiographie du thorax", category: "complementaire", pertinent: false, covers: ["radio-thorax"], result: "Non indiquée : auscultation normale, pas de signe de lutte respiratoire." },
    { id: "ponction-lombaire", label: "Ponction lombaire", category: "complementaire", pertinent: false, covers: ["ponction-lombaire"], result: "Non indiquée : enfant réactive, vaccinée, sans signe méningé, avec un foyer infectieux évident." },
    { id: "ct-cerebral", label: "CT cérébral natif", category: "complementaire", pertinent: false, covers: ["ct-cerebral"], result: "Non indiqué : pas de signe de mastoïdite ni de complication intracrânienne." },
  ],
  catalogResults: {
    "etat-general": "Enfant fatiguée mais réactive, coloration normale, pas de cyanose ni de marbrures.",
    "glasgow": "Enfant éveillée, réactive, répond à son père, pleure à l’examen et se laisse consoler.",
    "examen-neurologique": "Enfant tonique, marche et motricité symétriques, pas de déficit.",
  },
  acceptable: ["bandelette", "hydratation", "etat-general", "peau", "culture-urinaire"],
  diagnosisChoice: { correct: "Otite moyenne aiguë droite", distractors: ["Otite externe", "Mastoïdite aiguë", "Méningite bactérienne"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Caractérise le tableau",
      hint: "Début et chronologie, oreille touchée et douleur, fièvre, écoulement de l’oreille, pleurs et sommeil",
      points: 5,
      groups: [ONSET, [...EAR, ...PAIN], FEVER, DISCHARGE, NIGHT],
    },
    {
      id: "associated",
      label: "Recherche les signes associés et les signes d’alarme",
      hint: "Rhume et toux, alimentation et hydratation, signes d’alarme (nuque, taches, comportement, gonflement derrière l’oreille)",
      points: 3,
      groups: [RHINITIS, DIGESTIVE, ALARM],
    },
    {
      id: "terrain",
      label: "Évalue le terrain",
      hint: "Otites antérieures, vaccins, facteurs favorisants (crèche, tétine, tabagisme passif)",
      points: 3,
      groups: [PREVIOUS, ["vaccin", "carnet"], RISK],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status ciblé",
      hint: "Constantes et poids, otoscopie des deux côtés, gorge et ganglions, mastoïdes, signes méningés, auscultation pulmonaire",
      points: 5,
      groups: [["j examine", "je l examine", "j ausculte", "je l ausculte"]],
    },
    {
      id: "management",
      label: "Propose une suite simple",
      hint: "Antalgie adaptée au poids, antibiotique selon la gravité, contrôle si pas d’amélioration en 48 h",
      points: 1,
      groups: [["paracetamol", "ibuprofene", "antalg", "antidoul", "amoxicil", "antibio", "revoir", "controle", "reconsult", "48"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Otite moyenne aiguë droite non compliquée chez une enfant de 2 ans",
    summary: "Fillette de 2 ans, gardée en crèche, qui présente après quelques jours de rhume une fièvre, une otalgie droite (se tient l’oreille, pleurs nocturnes) et une baisse d’appétit. À l’otoscopie, le tympan droit est rouge, opaque et bombant : c’est une otite moyenne aiguë. Il n’y a ni otorrhée, ni signe de mastoïdite, ni signe méningé, et l’enfant reste réactive et bien hydratée.",
    keyFindings: [
      "Rhinopharyngite depuis quatre jours, puis fièvre et otalgie droite avec pleurs nocturnes.",
      "Tympan droit rouge, opaque et bombant à l’otoscopie : critère diagnostique principal.",
      "Pas d’otorrhée, mastoïde normale, pas de signe méningé, auscultation normale.",
      "Facteurs favorisants : crèche, tétine, épisode d’otite antérieur, antécédent familial d’otites.",
    ],
    redFlags: [
      "Rougeur, gonflement ou douleur derrière l’oreille, pavillon décollé : mastoïdite, avis ORL en urgence.",
      "Raideur de nuque, somnolence, purpura ou convulsion : méningite ou complication intracrânienne.",
      "Paralysie faciale, vertiges ou enfant très altéré : complication, avis spécialisé.",
      "Pas d’amélioration après 48–72 h de traitement : réévaluer (échec, résistance, complication).",
    ],
    management: [
      "Antalgie et antipyrétique adaptés au poids : paracétamol 15 mg/kg par dose toutes les 6 h (maximum 60 mg/kg/j), ou ibuprofène 10 mg/kg par dose toutes les 8 h.",
      "Après 2 ans, sans signe de gravité : attente vigilante possible pendant 24–48 h avec antalgie ; antibiotique si pas d’amélioration ou d’emblée si forme sévère (otorrhée, forte fièvre, douleur importante).",
      "Antibiotique de premier choix : amoxicilline environ 50 mg/kg/j en deux prises, 5 jours à cet âge, selon les recommandations locales.",
      "Consignes de reconsultation (fièvre persistante au-delà de 48–72 h, gonflement derrière l’oreille, enfant abattue) ; pas de contrôle systématique du tympan si l’évolution est bonne.",
    ],
    differentials: [
      "Otite externe (douleur à la traction du pavillon, conduit inflammatoire, tympan normal).",
      "Mastoïdite aiguë (rougeur et gonflement rétro-auriculaires, pavillon décollé).",
      "Rhinopharyngite virale simple avec tympans congestifs mais non bombants.",
      "Autre cause de fièvre chez le jeune enfant : angine, infection urinaire, pneumonie, méningite.",
    ],
    sources: [
      { label: "NICE NG91 — Otitis media (acute): antimicrobial prescribing", url: "https://www.nice.org.uk/guidance/ng91" },
      { label: "AAP 2013 — The diagnosis and management of acute otitis media", url: "https://doi.org/10.1542/peds.2012-3488" },
    ],
    pathologySlugs: ["fievre-enfant"],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const otiteMoyenneAigueDiagnoses: StationDiagnoses = {
  accepted: ["otite-moyenne"],
  differentials: [
    d("Angine ou pharyngite", "angine"),
    d("Méningite", "meningite-bacterienne", "meningite-virale"),
    d("Infection urinaire fébrile", "pyelonephrite-aigue", "cystite"),
    d("Pneumonie", "pneumonie-communautaire"),
  ],
};
