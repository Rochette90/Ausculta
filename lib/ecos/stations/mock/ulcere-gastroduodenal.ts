import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { CHARACTER, communicationCriterion, INTENSITY, LABS, LOCATION, NAUSEA, ONSET, planReaction, presentationCriterion, RADIATION, treatmentsCriterion, VITALS } from "../shared.ts";

const MEALS = ["repas", "manger", "mangez", "nourriture", "a jeun", "la nuit", "nuit$", "reveil", "moment de la journee", "horaire", "soulage", "calme", "aggrav", "pire", "mieux"];
const BLEEDING = ["sang$", "du sang", "saign", "noir", "goudron", "marc de cafe"];
const WEIGHT = ["poids", "maigri", "kilo", "appetit"];
const SWALLOWING = ["avaler", "deglut", "coince", "bloque", "passe mal", "passe bien"];
const REFLUX = ["remont", "acide", "regurgit", "gout amer", "aigre", "dans la gorge", "en vous couchant", "penche"];
const CARDIAC = ["effort", "escalier", "en marchant", "poitrine", "oppress", "serre", "bras$", "machoire", "essouffl", "palpitation"];
const PERSONAL = ["antecedent", "maladie", "probleme de sante", "opere", "operation", "chirurg", "hospitalis", "deja eu", "deja arrive", "premiere fois", "ulcere"];
const FAMILY = ["famil", "parents", "pere", "mere", "frere", "soeur", "heredit"];
const NSAID = ["anti inflam", "antiinflam", "ains", "ibupro", "aspirin", "brufen", "irfen", "algifor", "voltaren", "diclofenac", "antidouleur", "anti douleur", "antalgi", "contre la douleur", "pour le dos", "automedic", "sans ordonnance", "pharmacie", "cortison"];
const HABITS = ["fum", "tabac", "cigarette", "alcool", "vin$", "biere", "boisson"];

export const ulcereGastroduodenal: EcosScenario = {
  slug: "ulcere-gastroduodenal",
  version: 1,
  setting: "cabinet",
  patient: { name: "M. Jotterand", age: 47, sex: "M" },
  painful: true,
  persona: "Artisan direct et coopératif, un peu inquiet pour son cœur à cause de son père. Il minimise d’abord les comprimés qu’il prend pour le dos (« c’est juste de l’ibuprofène »), mais il en parle volontiers si on lui pose la question.",
  brief: [
    "Vous êtes médecin assistant·e dans un cabinet de médecine générale.",
    "M. Jotterand, 47 ans, consulte au cabinet pour des brûlures au creux de l’estomac depuis deux semaines.",
    "Menez l’anamnèse, réalisez le status et les examens utiles, puis donnez votre hypothèse diagnostique et la suite.",
  ],
  opening: "Bonjour docteur. Depuis deux semaines, j’ai des brûlures au creux de l’estomac, ici. Ça me réveille même la nuit.",
  history: {
    identity: "Olivier Jotterand, 47 ans.",
    occupation: "Je suis carreleur, à mon compte : beaucoup de travail à genoux et de charges à porter.",
    living: "Je vis avec ma compagne et nos deux ados à Yverdon.",
    feeling: "Ça va, mais ces brûlures m’usent, surtout quand elles me réveillent.",
    previousEpisodes: "Non, c’est la première fois. Avant, je digérais tout.",
    course: "Au début c’était de temps en temps, maintenant c’est presque tous les jours, à peu près pareil depuis une semaine.",
    otherSymptoms: "J’ai parfois un peu la nausée quand ça brûle.",
    medications: "Rien d’habitude. Mais depuis un mois je prends de l’ibuprofène pour le dos, 400 mg trois fois par jour, acheté à la pharmacie.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Mal au dos depuis un mois, après avoir porté des sacs de colle. Sinon rien, je ne vais jamais chez le médecin.",
    familyHistory: "Mon père a fait un infarctus à 62 ans. Ma mère va bien.",
    tobacco: "Oui, une quinzaine de cigarettes par jour depuis mes 20 ans.",
    alcohol: "Deux ou trois bières le week-end. Et quatre ou cinq cafés par jour.",
    drugs: "Non.",
    concerns: "J’ai peur que ce soit le cœur, comme mon père. Ou alors quelque chose de grave à l’estomac.",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Il y a deux semaines environ, petit à petit. Au début, je pensais que c’était le café." },
    { topic: "localisation", keywords: [...LOCATION, "ou avez vous mal"], reply: "Ici, au creux de l’estomac, juste sous les côtes au milieu." },
    { topic: "irradiation", keywords: RADIATION, reply: "Non, ça reste là. Ça ne va pas dans le dos, ni dans la poitrine ou les bras." },
    { topic: "type de douleur", keywords: CHARACTER, reply: "Une brûlure, des fois comme une crampe ou une faim douloureuse." },
    { topic: "intensité", keywords: INTENSITY, reply: "Cinq sur dix, des fois six quand ça me réveille." },
    { topic: "lien avec les repas", keywords: MEALS, reply: "Ça vient deux ou trois heures après les repas, et la nuit vers deux heures du matin. Quand je mange un morceau ou que je bois un verre de lait, ça se calme." },
    { topic: "repas gras", keywords: ["gras", "fondue", "friture", "frites"], reply: "Non, ce n’est pas spécialement après les repas gras." },
    { topic: "reflux", keywords: REFLUX, reply: "Parfois un peu d’acide qui remonte après un gros repas, mais la brûlure, elle, reste au creux de l’estomac." },
    { topic: "lien avec l’effort", keywords: CARDIAC, reply: "Non, ça n’a rien à voir avec l’effort : je porte des cartons de catelles sans problème, je ne suis pas essoufflé et je n’ai rien dans la poitrine." },
    { topic: "nausées", keywords: NAUSEA, reply: "Un peu de nausée quand ça brûle, mais je n’ai jamais vomi." },
    { topic: "sang et selles noires", keywords: BLEEDING, reply: "Non, pas de sang, et mes selles sont normales, pas noires." },
    { topic: "selles", keywords: ["selle", "transit", "toilettes", "diarrh", "constip"], reply: "Les selles sont normales, de couleur habituelle, une fois par jour." },
    { topic: "poids et appétit", keywords: WEIGHT, reply: "Mon poids n’a pas bougé, et j’ai bon appétit. D’ailleurs manger me soulage." },
    { topic: "déglutition", keywords: SWALLOWING, reply: "Non, j’avale tout normalement, rien ne coince." },
    { topic: "fatigue", keywords: ["fatigu", "pale", "paleur", "faible", "vertige", "tete qui tourne"], reply: "Non, pas plus fatigué que d’habitude. Pas de vertiges." },
    { topic: "jaunisse", keywords: ["jaune", "ictere", "urines foncees", "selles claires"], reply: "Non, je ne suis pas jaune, les urines sont normales." },
    { topic: "fièvre", keywords: ["fievre", "temperature", "frisson"], reply: "Non, pas de fièvre." },
    { topic: "anti-inflammatoires", keywords: NSAID, reply: "Oui, de l’ibuprofène, 400 mg trois fois par jour depuis un mois pour le dos. Je l’ai acheté à la pharmacie, je le prends souvent à jeun le matin avant le chantier." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 128/80 mmHg, FC 74/min régulière, FR 14/min, SpO₂ 98 %, T 36,8 °C. Patient en bon état général, bien coloré, conjonctives normalement colorées." },
    { topic: "palpation", examiner: true, keywords: ["palp", "abdomen", "ventre", "j examine", "je vous examine", "examen clinique", "examen physique"], reply: "Abdomen souple, sensibilité modérée au creux épigastrique à la palpation profonde, sans masse ni organomégalie. Reste de l’abdomen indolore." },
    { topic: "signes péritonéaux", examiner: true, keywords: ["defense", "blumberg", "contracture", "detente", "peritoni"], reply: "Pas de défense ni de contracture, signe de Blumberg négatif." },
    { topic: "Murphy", examiner: true, keywords: ["murphy", "vesicule", "hypocondre"], reply: "Signe de Murphy négatif, hypocondre droit indolore." },
    { topic: "toucher rectal", examiner: true, keywords: ["toucher rectal", "doigtier"], reply: "Toucher rectal indolore, selles brunes au doigtier, pas de méléna." },
    { topic: "ECG", examiner: true, keywords: ["ecg", "electrocardio"], reply: "ECG : rythme sinusal à 72/min, axe normal, pas de trouble de la repolarisation." },
    { topic: "hémoglobine", examiner: true, keywords: LABS, reply: "Hémoglobine 146 g/L, VGM 89 fL, leucocytes 7,2 G/L, plaquettes 260 G/L." },
    planReaction("D’accord. Mais pour mon dos, je prends quoi, alors, si j’arrête l’ibuprofène ?", ["arreter", "stopper", "ibupro", "anti inflam", "ipp", "pantoprazole", "omeprazole", "esomeprazole", "helicobacter", "gastroscopie", "controle"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "palpation", label: "Inspection et palpation de l’abdomen", category: "examen", pertinent: true, topic: "palpation", covers: ["palpation-abdominale"] },
    { id: "signes-peritoneaux", label: "Recherche de défense et de détente (Blumberg)", category: "examen", pertinent: true, topic: "signes péritonéaux", covers: ["signes-peritoneaux"] },
    { id: "murphy", label: "Signe de Murphy", category: "examen", pertinent: true, topic: "Murphy", covers: ["murphy"] },
    { id: "toucher-rectal", label: "Toucher rectal", category: "examen", pertinent: true, topic: "toucher rectal", covers: ["toucher-rectal"] },
    { id: "ecg", label: "ECG 12 dérivations", category: "complementaire", pertinent: true, topic: "ECG", covers: ["ecg"], image: { src: "/ecos/ecg/blanc-06.svg", alt: "ECG 12 dérivations, avec DII long" } },
    { id: "fsc", label: "Formule sanguine complète", category: "complementaire", pertinent: true, topic: "hémoglobine", covers: ["fsc"] },
    { id: "radio-abdomen", label: "Radiographie de l’abdomen sans préparation", category: "complementaire", pertinent: false, result: "Pas de pneumopéritoine. Non indiquée : abdomen souple, aucun signe de perforation." },
    { id: "ct-abdominal", label: "CT abdominal injecté", category: "complementaire", pertinent: false, result: "Pas d’anomalie visible. Non indiqué : tableau stable, sans signe de complication ; le CT ne montre pas un ulcère non compliqué." },
    { id: "d-dimeres", label: "D-dimères", category: "complementaire", pertinent: false, result: "D-dimères < 0,5 mg/L. Non indiqués : aucune suspicion de thrombose ni d’embolie." },
  ],
  catalogResults: {
    "gastroscopie": "Ulcère bulbaire de 8 mm à fond propre, sans saignement actif ; muqueuse antrale érythémateuse. Biopsies gastriques pour recherche d’Helicobacter pylori.",
  },
  acceptable: ["auscultation-abdominale", "foie-rate", "troponine", "lipase", "tests-hepatiques", "crp", "creatinine", "echo-abdominale", "gastroscopie", "ferritine-b12", "auscultation-cardiaque", "auscultation-pulmonaire", "ictere"],
  diagnosisChoice: { correct: "Ulcère gastroduodénal non compliqué sur prise d’AINS", distractors: ["Reflux gastro-œsophagien", "Colique hépatique", "Syndrome coronarien aigu sans sus-décalage ST"] },
  diagnosisPoints: 1,
  criteria: [
    presentationCriterion,
    {
      id: "pain",
      label: "Caractérise la douleur",
      hint: "Début, localisation et irradiation, horaire et lien avec les repas (soulagée en mangeant, réveil nocturne)",
      points: 3,
      groups: [ONSET, [...LOCATION, ...RADIATION], MEALS],
    },
    {
      id: "alarm",
      label: "Recherche les signes d’alarme digestifs",
      hint: "Hématémèse ou méléna, vomissements, perte de poids, troubles de la déglutition",
      points: 4,
      groups: [BLEEDING, NAUSEA, WEIGHT, SWALLOWING],
    },
    {
      id: "differential",
      label: "Oriente le diagnostic différentiel",
      hint: "Reflux (remontées acides), douleur à l’effort ou thoracique (cœur)",
      points: 2,
      groups: [REFLUX, CARDIAC],
    },
    {
      id: "background",
      label: "Évalue le terrain et l’automédication",
      hint: "Antécédents personnels et familiaux ; prise d’anti-inflammatoires ou d’aspirine",
      points: 2,
      groups: [[...PERSONAL, ...FAMILY], NSAID],
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
      hint: "Constantes, palpation abdominale, défense et détente, signe de Murphy, toucher rectal ; ECG, formule sanguine",
      points: 5,
      groups: [["palp", "abdomen", "defense", "murphy", "toucher rectal"], ["ecg", "formule"]],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Ulcère gastroduodénal non compliqué, favorisé par la prise d’AINS (ibuprofène)",
    summary: "Homme de 47 ans, fumeur, qui prend de l’ibuprofène 1200 mg/j en automédication depuis un mois pour une lombalgie, et présente depuis deux semaines des brûlures épigastriques survenant à distance des repas et la nuit, calmées par l’alimentation. Pas de signe d’alarme (ni saignement, ni vomissement, ni perte de poids, ni dysphagie), douleur sans lien avec l’effort, examen sans signe péritonéal, ECG et hémoglobine normaux.",
    keyFindings: [
      "Brûlure épigastrique rythmée par les repas (deux à trois heures après, réveil nocturne), soulagée par l’alimentation.",
      "Prise d’ibuprofène 400 mg trois fois par jour depuis un mois, souvent à jeun ; tabagisme actif.",
      "Aucun signe d’alarme : pas d’hématémèse ni de méléna, pas de vomissement, poids stable, déglutition normale.",
      "Sensibilité épigastrique isolée, sans défense ; Murphy négatif ; ECG normal, hémoglobine normale.",
    ],
    redFlags: [
      "Hématémèse, méléna ou anémie : hémorragie digestive haute, gastroscopie en urgence.",
      "Douleur brutale et violente avec ventre de bois : perforation, imagerie et avis chirurgical en urgence.",
      "Vomissements répétés, perte de poids, dysphagie, âge > 55 ans : gastroscopie rapide (sténose, cancer).",
      "Douleur liée à l’effort ou facteurs de risque coronariens : ne pas manquer un syndrome coronarien (ECG, troponine).",
    ],
    management: [
      "Arrêt de l’ibuprofène ; antalgie du dos par paracétamol et mesures physiques.",
      "Inhibiteur de la pompe à protons (par exemple pantoprazole 40 mg par jour) pendant 4 à 8 semaines.",
      "Recherche d’Helicobacter pylori (test respiratoire ou antigène dans les selles) et éradication si positif ; gastroscopie si signe d’alarme ou absence d’amélioration.",
      "Conseils : arrêt du tabac, contrôle clinique à 4 semaines, consignes de reconsultation immédiate (selles noires, vomissement de sang, douleur brutale).",
    ],
    differentials: [
      "Reflux gastro-œsophagien (pyrosis rétrosternal ascendant, régurgitations).",
      "Colique hépatique ou cholécystite (douleur de l’hypocondre droit après un repas gras, Murphy).",
      "Syndrome coronarien aigu inférieur (douleur à l’effort, facteurs de risque, ECG).",
      "Pancréatite, dyspepsie fonctionnelle, cancer gastrique (signes d’alarme).",
    ],
    sources: [
      { label: "NICE CG184 (2014, mise à jour 2019) — Gastro-oesophageal reflux disease and dyspepsia in adults", url: "https://www.nice.org.uk/guidance/cg184" },
      { label: "Malfertheiner P. et al. Management of Helicobacter pylori infection: the Maastricht VI/Florence consensus report. Gut 2022", url: "https://gut.bmj.com/content/71/9/1724" },
    ],
    pathologySlugs: ["ulcere-gastroduodenal", "reflux-gastro-oesophagien", "hemorragie-digestive"],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const ulcereGastroduodenalDiagnoses: StationDiagnoses = {
  accepted: ["ulcere-gastroduodenal"],
  differentials: [
    d("Reflux gastro-œsophagien", "reflux-gastro-oesophagien"),
    d("Colique hépatique, cholécystite ou pancréatite", "colique-hepatique", "cholecystite-aigue", "pancreatite-aigue"),
    d("Syndrome coronarien aigu", "sca-nst", "sca-st", "angor-stable"),
    d("Ulcère compliqué : hémorragie digestive haute ou perforation", "hemorragie-digestive-haute", "ulcere-perfore"),
  ],
};
