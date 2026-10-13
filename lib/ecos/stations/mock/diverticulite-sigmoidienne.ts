import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { CHARACTER, communicationCriterion, FEVER, INTENSITY, LABS, LOCATION, NAUSEA, ONSET, planReaction, presentationCriterion, RADIATION, treatmentsCriterion, VITALS } from "../shared.ts";

const TRANSIT = ["selle", "transit", "constip", "diarrh", "gaz$", "des gaz", "toilettes", "caca", "intestin", "ballonn", "gonfle"];
const URINARY = ["urin", "pipi", "brul", "vessie"];
const BLEEDING = ["sang$", "du sang", "saign", "rectorrag", "selles noires", "noir"];
const WEIGHT = ["poids", "maigri", "kilo", "appetit"];
const SCREENING = ["colosco", "depistage", "camera", "examen de l intestin"];
const PERSONAL = ["antecedent", "maladie", "probleme de sante", "opere", "operation", "chirurg", "hospitalis", "deja eu", "deja arrive", "premiere fois", "diverticul", "suivi pour"];
const FAMILY = ["famil", "parents", "pere", "mere", "frere", "soeur", "heredit"];
const HABITS = ["fum", "tabac", "cigarette", "alcool", "vin$", "biere", "boisson"];

export const diverticuliteSigmoidienne: EcosScenario = {
  slug: "diverticulite-sigmoidienne",
  version: 1,
  setting: "urgences",
  patient: { name: "M. Gindrat", age: 68, sex: "M" },
  painful: true,
  persona: "Retraité calme et coopératif, un peu fatigué par la fièvre. Il répond simplement et précisément, sans dramatiser, et se montre rassuré quand on lui explique les choses.",
  brief: [
    "Vous êtes médecin assistant·e au service des urgences.",
    "M. Gindrat, 68 ans, se présente aux urgences pour une douleur dans le bas du ventre à gauche et de la fièvre depuis deux jours.",
    "Menez l’anamnèse, réalisez le status et les examens utiles, puis donnez votre hypothèse diagnostique et la suite.",
  ],
  opening: "Bonjour docteur. J’ai mal dans le bas du ventre, à gauche, depuis deux jours, et cette nuit j’avais de la fièvre.",
  history: {
    identity: "Jean-Pierre Gindrat, 68 ans.",
    occupation: "Je suis retraité, j’étais employé de commerce.",
    living: "Je vis avec ma femme dans une maison à Delémont, je me débrouille très bien tout seul.",
    feeling: "Fatigué, et ce mal de ventre me gêne pour bouger.",
    previousEpisodes: "Non, c’est la première fois que j’ai une douleur pareille.",
    course: "Ça a commencé doucement avant-hier, puis c’est devenu plus fort et constant ; la fièvre est arrivée hier soir.",
    otherSymptoms: "Je suis plutôt constipé depuis deux ou trois jours.",
    medications: "De l’amlodipine pour la tension, 5 mg le matin. Hier, j’ai pris deux fois du paracétamol.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "De la tension depuis une dizaine d’années, bien contrôlée. Sinon, j’ai tendance à être constipé. On m’a opéré d’une hernie à droite il y a vingt ans.",
    familyHistory: "Mon père est mort d’une attaque cérébrale à 80 ans, ma mère avait du diabète. Pas de cancer de l’intestin dans la famille, que je sache.",
    tobacco: "J’ai fumé un paquet par jour pendant vingt ans, j’ai arrêté il y a quinze ans.",
    alcohol: "Un verre de vin au repas du soir.",
    drugs: "Non, jamais.",
    concerns: "J’ai peur que ce soit quelque chose de grave dans l’intestin, un cancer.",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Avant-hier dans la matinée, doucement, puis c’est devenu plus fort et ça ne passe plus." },
    { topic: "localisation", keywords: [...LOCATION, "ou avez vous mal", "quel cote"], reply: "Là, en bas à gauche du ventre, au-dessus de l’aine." },
    { topic: "irradiation", keywords: RADIATION, reply: "Non, ça reste au même endroit, ça ne va ni dans le dos ni vers les parties." },
    { topic: "type de douleur", keywords: CHARACTER, reply: "C’est une douleur sourde, continue, comme un point qui appuie. Ça fait plus mal quand je marche ou quand je tousse." },
    { topic: "intensité", keywords: INTENSITY, reply: "Six sur dix à peu près. Le paracétamol me soulage un peu." },
    { topic: "fièvre", keywords: FEVER, reply: "Hier soir, j’avais 38,4 °C. J’ai eu un peu froid mais pas de grands frissons." },
    { topic: "transit", keywords: TRANSIT, reply: "Je suis constipé : pas de selles depuis deux jours, mais j’ai encore des gaz. Pas de diarrhée." },
    { topic: "nausées", keywords: NAUSEA, reply: "Un peu de nausée, mais je n’ai pas vomi. J’arrive à boire." },
    { topic: "signes urinaires", keywords: URINARY, reply: "Non, j’urine normalement, sans brûlure, et les urines sont claires." },
    { topic: "sang dans les selles", keywords: BLEEDING, reply: "Non, je n’ai jamais vu de sang dans les selles, et elles ne sont pas noires." },
    { topic: "poids et appétit", keywords: WEIGHT, reply: "Mon poids est stable, autour de 82 kilos. L’appétit est moins bon depuis deux jours, c’est tout." },
    { topic: "coloscopie", keywords: SCREENING, reply: "Je n’ai jamais fait de coloscopie. Mon médecin m’en a parlé, mais j’ai toujours repoussé." },
    { topic: "repas", keywords: ["manger", "mangez", "alimentation", "repas", "fibre", "legume"], reply: "Je mange surtout de la viande et du pain, pas beaucoup de légumes, je l’avoue." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 38,3 °C, FC 92/min, TA 138/84 mmHg, FR 16/min, SpO₂ 97 % à l’air ambiant. Patient conscient, bien coloré, légèrement fatigué." },
    { topic: "palpation", examiner: true, keywords: ["palp", "abdomen", "ventre", "percu", "j examine", "je vous examine", "examen clinique", "examen physique"], reply: "Abdomen légèrement distendu, souple ; sensibilité nette de la fosse iliaque gauche avec un empâtement local, pas de masse pulsatile. Reste de l’abdomen indolore, percussion tympanique." },
    { topic: "signes péritonéaux", examiner: true, keywords: ["defense", "blumberg", "contracture", "detente", "peritoni"], reply: "Défense localisée en fosse iliaque gauche, sans contracture ; signe de Blumberg négatif. Pas de signe de péritonite généralisée." },
    { topic: "orifices herniaires", examiner: true, keywords: ["hernie", "orifice", "aine", "inguinal"], reply: "Orifices herniaires libres ; cicatrice d’herniorraphie inguinale droite calme." },
    { topic: "ébranlement lombaire", examiner: true, keywords: ["ebranlement", "lombaire", "giordano"], reply: "Ébranlement des fosses lombaires indolore des deux côtés." },
    { topic: "bilan sanguin", examiner: true, keywords: LABS, reply: "Leucocytes 13,6 G/L, hémoglobine 142 g/L, CRP 96 mg/L, créatinine 84 µmol/L." },
    { topic: "CT", examiner: true, keywords: ["scanner", "ct$", "tomodensito", "imagerie"], reply: "CT abdominal injecté : épaississement de la paroi du sigmoïde avec diverticules et infiltration de la graisse autour, sans abcès, sans air hors du tube digestif ni liquide libre." },
    planReaction("Alors je peux rentrer à la maison ? Et la coloscopie, il faudra vraiment la faire cette fois ?", ["a domicile", "a la maison", "ambulatoire", "antibio", "liquide", "regime", "colosco", "controle", "48", "72"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "palpation", label: "Inspection, percussion et palpation de l’abdomen", category: "examen", pertinent: true, topic: "palpation", covers: ["palpation-abdominale"] },
    { id: "signes-peritoneaux", label: "Recherche de défense et de détente (Blumberg)", category: "examen", pertinent: true, topic: "signes péritonéaux", covers: ["signes-peritoneaux"] },
    { id: "orifices-herniaires", label: "Orifices herniaires", category: "examen", pertinent: true, topic: "orifices herniaires", covers: ["orifices-herniaires"] },
    { id: "ebranlement", label: "Ébranlement des fosses lombaires", category: "examen", pertinent: true, topic: "ébranlement lombaire", covers: ["ebranlement-lombaire"] },
    { id: "bilan", label: "Formule sanguine, CRP et créatinine", category: "complementaire", pertinent: true, topic: "bilan sanguin", covers: ["fsc", "crp", "creatinine"] },
    { id: "ct", label: "CT abdominal injecté", category: "complementaire", pertinent: true, topic: "CT", covers: ["ct-abdominal"], image: { src: "/ecos/imagerie/blanc-05-ct-abdominal.png", alt: "CT abdominal injecté, coupe axiale du pelvis", credit: { author: "Hellerhoff", license: "CC BY-SA 3.0" } } },
    { id: "murphy", label: "Signe de Murphy", category: "examen", pertinent: false, result: "Signe de Murphy négatif : la douleur est à gauche, l’hypocondre droit est indolore. Geste peu utile ici." },
    { id: "radio-abdomen", label: "Radiographie de l’abdomen sans préparation", category: "complementaire", pertinent: false, result: "Pas de pneumopéritoine ni de niveau hydro-aérique. Examen peu contributif : le CT est l’examen de référence." },
    { id: "d-dimeres", label: "D-dimères", category: "complementaire", pertinent: false, result: "D-dimères 0,9 mg/L, élevés de façon non spécifique par l’inflammation. Non indiqués : aucune suspicion de thrombose." },
    { id: "radio-thorax", label: "Radiographie du thorax", category: "complementaire", pertinent: false, result: "Normale. Non indiquée : aucun symptôme respiratoire." },
  ],
  catalogResults: {
    "fsc": "Leucocytes 13,6 G/L (neutrophiles 10,8 G/L), hémoglobine 142 g/L, plaquettes 290 G/L.",
    "crp": "CRP 96 mg/L.",
    "creatinine": "Créatinine 84 µmol/L, urée 6,1 mmol/L.",
    "procalcitonine": "Procalcitonine 0,15 µg/L.",
    "auscultation-abdominale": "Bruits intestinaux présents, un peu diminués.",
    "toucher-rectal": "Toucher rectal : douleur latérale gauche haute, ampoule rectale avec selles dures, pas de sang au doigtier, pas de masse.",
    "echo-abdominale": "Examen gêné par les gaz : épaississement douloureux du sigmoïde en fosse iliaque gauche, sans collection ni liquide libre ; foie, vésicule et reins sans particularité.",
    "ct-low-dose": "Sans injection : épaississement du sigmoïde avec diverticules et infiltration de la graisse péricolique, sans collection visible ni air extradigestif ; pas de calcul urinaire.",
  },
  acceptable: ["auscultation-abdominale", "toucher-rectal", "bandelette", "echo-abdominale", "ct-low-dose", "lactate", "ionogramme", "procalcitonine", "tests-hepatiques", "lipase", "hemocultures", "ecg"],
  diagnosisChoice: { correct: "Diverticulite sigmoïdienne aiguë non compliquée", distractors: ["Cancer colorectal", "Colique néphrétique gauche", "Ischémie mésentérique"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "pain",
      label: "Caractérise la douleur",
      hint: "Début et évolution, localisation et irradiation, type et intensité",
      points: 3,
      groups: [ONSET, [...LOCATION, ...RADIATION], [...CHARACTER, ...INTENSITY]],
    },
    {
      id: "associated",
      label: "Recherche les signes associés",
      hint: "Fièvre, transit (constipation, diarrhée), signes urinaires",
      points: 3,
      groups: [FEVER, TRANSIT, URINARY],
    },
    {
      id: "alarm",
      label: "Recherche les signes d’alarme",
      hint: "Sang dans les selles, perte de poids, coloscopie de dépistage déjà faite ?",
      points: 3,
      groups: [BLEEDING, WEIGHT, SCREENING],
    },
    {
      id: "background",
      label: "Évalue les antécédents",
      hint: "Antécédents personnels (épisodes semblables, chirurgie), antécédents familiaux (cancer colorectal)",
      points: 2,
      groups: [PERSONAL, FAMILY],
    },
    {
      id: "habits",
      label: "Demande les habitudes",
      hint: "Tabac, alcool",
      points: 1,
      groups: [HABITS],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Status et examens ciblés",
      hint: "Constantes, palpation abdominale, défense et détente, orifices herniaires, ébranlement lombaire ; formule sanguine et CRP, CT abdominal",
      points: 5,
      groups: [["palp", "abdomen", "defense", "hernie", "ebranlement"], ["crp", "formule", "scanner", "ct$"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Diverticulite sigmoïdienne aiguë non compliquée",
    summary: "Homme de 68 ans, ancien fumeur, constipé chronique, qui présente depuis deux jours une douleur continue de la fosse iliaque gauche d’installation progressive, une fièvre à 38,4 °C et une constipation, sans saignement ni perte de poids. Sensibilité et défense localisées en fosse iliaque gauche, syndrome inflammatoire (leucocytes 13,6 G/L, CRP 96 mg/L) ; le CT confirme une diverticulite du sigmoïde sans abcès ni perforation.",
    keyFindings: [
      "Douleur continue de la fosse iliaque gauche, installée en un à deux jours, aggravée par la marche et la toux.",
      "Fièvre modérée, constipation, nausées sans vomissement ; pas de signe urinaire.",
      "Sensibilité et défense localisées en fosse iliaque gauche, sans péritonite généralisée.",
      "Leucocytose et CRP élevée ; au CT, épaississement du sigmoïde avec diverticules, sans abcès ni air libre.",
    ],
    redFlags: [
      "Péritonite généralisée, abcès ou perforation (air libre) : diverticulite compliquée, avis chirurgical et hospitalisation.",
      "Sepsis, immunosuppression, vomissements ou incapacité à s’hydrater : hospitalisation.",
      "Sang dans les selles, perte de poids, anémie : penser au cancer colorectal ; coloscopie à distance indispensable.",
      "Pas d’amélioration en 48–72 h : réévaluer et refaire l’imagerie.",
    ],
    management: [
      "Prise en charge ambulatoire si l’état le permet : antalgiques (paracétamol), hydratation, alimentation selon tolérance.",
      "Antibiotiques non systématiques dans la forme non compliquée chez le patient immunocompétent ; à discuter si signes systémiques marqués ou comorbidités (par exemple amoxicilline-acide clavulanique par voie orale).",
      "Contrôle clinique à 48–72 h et consignes de reconsultation (fièvre persistante, douleur croissante, vomissements).",
      "Coloscopie à 6–8 semaines si aucune coloscopie récente, pour exclure un cancer colorectal.",
    ],
    differentials: [
      "Cancer colorectal (sigmoïde) compliqué ou révélé par une infection.",
      "Colique néphrétique ou pyélonéphrite gauche (signes urinaires, ébranlement lombaire).",
      "Colite ischémique ou ischémie mésentérique (terrain vasculaire, douleur disproportionnée).",
      "Occlusion intestinale, hernie étranglée (arrêt des gaz, orifices herniaires).",
    ],
    sources: [
      { label: "NICE NG147 (2019) — Diverticular disease: diagnosis and management", url: "https://www.nice.org.uk/guidance/ng147" },
      { label: "WSES 2020 — Update of the guidelines for the management of acute colonic diverticulitis", url: "https://wjes.biomedcentral.com/articles/10.1186/s13017-020-00313-4" },
    ],
    pathologySlugs: ["diverticulite", "abdomen-aigu", "cancer-colorectal"],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const diverticuliteSigmoidienneDiagnoses: StationDiagnoses = {
  accepted: ["diverticulite"],
  differentials: [
    d("Cancer colorectal", "cancer-colorectal"),
    d("Colique néphrétique ou pyélonéphrite gauche", "colique-nephretique", "pyelonephrite-aigue"),
    d("Ischémie mésentérique", "ischemie-mesenterique"),
    d("Occlusion intestinale ou hernie étranglée", "occlusion-intestinale", "hernie-etranglee"),
  ],
};
