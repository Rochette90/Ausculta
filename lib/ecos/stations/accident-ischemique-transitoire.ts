import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, LABS, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "./shared.ts";

const DURATION = ["combien de temps", "duree", "dure$", "a dure", "ca a dure", "minutes", "recupere", "disparu", "passe tout seul", "c est passe", "maintenant", "encore$", "toujours$", "resolu"];
const MOTOR = ["main", "bras", "jambe", "faiblesse", "force", "paralys", "bouge", "lache", "tenir"];
const SPEECH = ["parole", "parler", "langage", "mots", "articul", "comprend", "s exprimer"];
const VISION = ["vision", "voit", "voir", "vue$", "oeil", "yeux", "rideau", "aveugle"];
const MIMICS = ["mal a la tete", "maux de tete", "cephal", "migraine", "convuls", "secousse", "crise", "perte de connaissance", "connaissance", "evanoui", "hypoglyc", "glycemie"];
const PALPITATIONS = ["palpitation", "coeur", "rythme cardiaque", "battements", "irregulier", "arythmie", "fibrillation"];
const RISK_FACTORS = ["fume", "fumez", "tabac", "cigarette", "cholesterol", "lipide", "diabet", "sucre"];
const PREVIOUS = ["deja arrive", "deja eu", "premiere fois", "auparavant", "avant$", "par le passe", "episode", "autre fois"];
const ANTITHROMBOTICS = ["anticoag", "fluidif", "sang liquide", "aspirine", "aspegic", "cardioaspirine", "clopidogrel", "plavix", "xarelto", "eliquis", "lixiana", "pradaxa", "marcoumar", "sintrom"];

export const accidentIschemiqueTransitoire: EcosScenario = {
  slug: "accident-ischemique-transitoire",
  version: 1,
  setting: "urgences",
  patient: { name: "M. Rapin", age: 72, sex: "M" },
  persona: "Retraité calme, un peu gêné d’être venu aux urgences pour « quelque chose qui est passé » : c’est sa femme qui a insisté. Il minimise mais répond précisément quand on lui pose une question claire.",
  brief: [
    "Vous êtes médecin assistant·e au service des urgences.",
    "M. Rapin, 72 ans, se présente aux urgences car ce matin sa main droite a lâché et il a eu du mal à parler pendant une vingtaine de minutes ; tout est rentré dans l’ordre.",
    "Menez l’anamnèse, décrivez l’examen clinique et les examens utiles, posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. Ce matin, ma main droite a lâché ma tasse et je n’arrivais plus à parler correctement. Ça a duré une vingtaine de minutes, maintenant tout va bien.",
  history: {
    identity: "Bernard Rapin, 72 ans.",
    occupation: "Je suis retraité, j’étais chef de chantier dans le bâtiment.",
    living: "Je vis avec ma femme dans une maison à la campagne. Je suis tout à fait autonome, je conduis encore.",
    feeling: "Je me sens bien maintenant, un peu secoué quand même.",
    previousEpisodes: "Pour la main, c’est la première fois. Mais il y a deux semaines, j’ai eu comme un rideau noir devant l’œil gauche pendant deux ou trois minutes. C’est passé tout seul, je n’en ai parlé à personne.",
    course: "Ça a commencé d’un coup vers 7 h 30 et à 7 h 50 tout était revenu. Depuis, plus rien.",
    otherSymptoms: "Pendant l’épisode, j’avais aussi des fourmis dans la main droite.",
    medications: "De l’amlodipine 5 mg le matin pour la tension. Rien pour fluidifier le sang.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "De l’hypertension depuis une dizaine d’années. Le médecin m’a dit que mon cholestérol était un peu haut, mais je n’ai pas voulu de traitement. Pas de diabète, jamais d’infarctus ni d’AVC.",
    familyHistory: "Mon père est mort d’un infarctus à 70 ans.",
    tobacco: "J’ai fumé un paquet par jour pendant quarante ans. J’ai arrêté il y a huit ans.",
    alcohol: "Un verre de vin au repas du soir.",
    drugs: "Non, jamais.",
    concerns: "J’ai peur que ce soit le début d’une attaque, comme ma voisine qui ne parle plus.",
  },
  rules: [
    { topic: "heure de début", keywords: ONSET, reply: "D’un coup, vers 7 h 30, au petit-déjeuner. Ma tasse m’a glissé de la main droite. Il est maintenant 10 h." },
    { topic: "durée", keywords: DURATION, reply: "Une vingtaine de minutes. À 7 h 50, je pouvais de nouveau tenir ma tasse et parler normalement. Depuis, je n’ai plus rien du tout." },
    { topic: "motricité", keywords: MOTOR, reply: "La main droite n’avait plus de force, je ne pouvais plus tenir la tasse ni boutonner ma chemise. Le bras était un peu lourd. La jambe allait bien, j’ai pu marcher." },
    { topic: "parole", keywords: SPEECH, reply: "Je voulais dire des choses mais les mots ne venaient pas, ou je disais un mot à la place d’un autre. Je comprenais ce que ma femme me disait." },
    { topic: "sensibilité", keywords: ["fourmi", "engourd", "sensib", "picote", "insensible"], reply: "Oui, des fourmis dans la main droite pendant l’épisode. Plus rien maintenant." },
    { topic: "visage", keywords: ["visage", "bouche", "sourire", "face$", "joue"], reply: "Ma femme dit que ma bouche tombait un peu à droite pendant ces minutes-là." },
    { topic: "vision", keywords: VISION, reply: "Ce matin, la vue était normale. Mais il y a deux semaines, j’ai perdu la vue de l’œil gauche pendant deux ou trois minutes, comme un rideau qui descend. Puis c’est revenu." },
    { topic: "diagnostics trompeurs", keywords: MIMICS, reply: "Non, pas de mal de tête, pas de secousses, je n’ai pas perdu connaissance. Je ne suis pas diabétique, et j’avais bien déjeuné." },
    { topic: "vertige et équilibre", keywords: ["vertige", "equilibre", "tourne", "marche", "tituba", "vision double", "voir double", "avaler"], reply: "Non, pas de vertige, pas de vision double, j’avalais normalement et je marchais bien." },
    { topic: "palpitations", keywords: PALPITATIONS, reply: "Non, je n’ai jamais senti mon cœur battre de travers ni s’emballer." },
    { topic: "douleur", keywords: ["douleur", "mal au cou", "mal a la nuque", "thorax", "poitrine"], reply: "Non, pas de douleur, ni dans le cou ni dans la poitrine." },
    { topic: "antithrombotiques", keywords: ANTITHROMBOTICS, reply: "Non, je ne prends ni aspirine ni anticoagulant." },
    { topic: "saignements", keywords: ["saign", "hemorrag", "ulcere", "sang dans les selles"], reply: "Non, aucun saignement, pas d’ulcère, pas d’opération récente." },
    { topic: "facteurs de risque", keywords: RISK_FACTORS, reply: "J’ai fumé quarante ans, j’ai arrêté il y a huit ans. Le cholestérol est un peu haut, non traité. Pas de diabète." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 162/88 mmHg au bras droit et 158/86 mmHg au bras gauche, FC 74/min régulière, FR 14/min, SpO₂ 97 % à l’air ambiant, T 36,7 °C." },
    { topic: "glycémie capillaire", examiner: true, keywords: ["glycemie capillaire", "dextro", "glucose", "hgt"], reply: "Glycémie capillaire : 6,1 mmol/L." },
    { topic: "examen neurologique", examiner: true, keywords: ["nihss", "examen neuro", "examen clinique", "j examine", "je vous examine", "reflexe", "babinski", "pupille", "paires craniennes", "nerfs craniens", "champ visuel", "barre", "mingazzini"], reply: "Patient vigilant et orienté, langage fluide sans manque du mot, compréhension et répétition normales. Nerfs crâniens normaux, champs visuels complets, pas d’asymétrie faciale. Force 5/5 aux quatre membres, pas de chute aux épreuves de Barré et de Mingazzini, sensibilité et coordination normales, réflexes symétriques, Babinski négatif des deux côtés. NIHSS 0." },
    { topic: "auscultation", examiner: true, keywords: ["auscult", "souffle", "carotide"], reply: "Bruits du cœur réguliers, sans souffle cardiaque. Souffle systolique au niveau de la bifurcation carotidienne gauche ; pas de souffle à droite." },
    { topic: "ECG", examiner: true, keywords: ["ecg", "electrocardiogramme"], reply: "ECG 12 dérivations : rythme sinusal régulier à 74/min, une onde P positive en DII avant chaque QRS, PR 170 ms, QRS fins à 90 ms, axe à −10°. Indice de Sokolow-Lyon à 37 mm (hypertrophie ventriculaire gauche électrique), pas de sus- ni de sous-décalage du segment ST, ondes T positives, QTc 420 ms. Pas de fibrillation ni de flutter auriculaire sur le tracé." },
    { topic: "imagerie cérébrale", examiner: true, keywords: ["irm", "scanner", "ct$", "ct cerebral", "imagerie cerebrale", "diffusion"], reply: "IRM cérébrale : pas de lésion récente en séquence de diffusion, pas de saignement ; quelques hypersignaux punctiformes de la substance blanche périventriculaire des deux côtés (Fazekas 1), sans autre anomalie." },
    { topic: "vaisseaux du cou", examiner: true, keywords: ["doppler", "echo doppler", "duplex", "troncs supra aortiques", "angio", "vaisseaux du cou"], reply: "Écho-doppler des troncs supra-aortiques : plaque hypoéchogène irrégulière du bulbe et de l’origine de l’artère carotide interne gauche, sténose estimée à 70–80 % (NASCET), vitesse systolique maximale 280 cm/s. Carotide interne droite : plaque calcifiée sans sténose significative (< 30 %). Artères vertébrales perméables, flux antérograde des deux côtés. L’angio-CT confirme une sténose d’environ 75 % de l’origine de la carotide interne gauche, sans occlusion intracrânienne." },
    { topic: "biologie", examiner: true, keywords: [...LABS, "plaquettes", "coagulation", "inr", "lipid", "ldl", "hba1c"], reply: "Hémoglobine 148 g/L, leucocytes 7,2 G/L, plaquettes 231 G/L, INR 1,0, aPTT normal, créatinine 88 µmol/L, sodium 139 mmol/L, potassium 4,1 mmol/L, glucose 6,0 mmol/L, HbA1c 5,7 %. LDL-cholestérol 3,9 mmol/L." },
    planReaction("Je dois vraiment rester à l’hôpital ? Je me sens bien maintenant… Et une opération du cou, c’est risqué ?", ["hospitalis", "unite neurovasculaire", "stroke", "aspirine", "clopidogrel", "endarter", "chirurg", "statine", "holter"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes", "ta-deux-bras"], key: ["constantes"] },
    { id: "glycemie", label: "Glycémie capillaire", category: "constantes", pertinent: true, topic: "glycémie capillaire" },
    { id: "examen-neurologique", label: "Examen neurologique complet (score NIHSS)", category: "examen", pertinent: true, topic: "examen neurologique", covers: ["examen-neurologique", "nihss", "coordination"], key: ["examen-neurologique", "nihss"] },
    { id: "auscultation", label: "Auscultation cardiaque et des carotides", category: "examen", pertinent: true, topic: "auscultation", covers: ["auscultation-carotides", "auscultation-cardiaque"] },
    { id: "signes-meninges", label: "Recherche d’une raideur de nuque", category: "examen", pertinent: false, result: "Pas de raideur de nuque. Non indiqué : ni céphalée, ni fièvre, ni trouble de la vigilance.", covers: ["signes-meninges"] },
    { id: "palpation-abdominale", label: "Palpation de l’abdomen", category: "examen", pertinent: false, result: "Abdomen souple et indolore. Sans rapport avec un déficit neurologique transitoire.", covers: ["palpation-abdominale"] },
    { id: "ecg", label: "ECG 12 dérivations", category: "complementaire", pertinent: true, topic: "ECG", image: { src: "/ecos/ecg/station-24.svg", alt: "ECG 12 dérivations, avec DII long" } },
    { id: "imagerie-cerebrale", label: "Imagerie cérébrale (IRM de diffusion ou CT)", category: "complementaire", pertinent: true, topic: "imagerie cérébrale", covers: ["irm-cerebrale", "ct-cerebral"] },
    { id: "vaisseaux-cou", label: "Écho-doppler ou angio-CT des vaisseaux du cou", category: "complementaire", pertinent: true, topic: "vaisseaux du cou", covers: ["doppler-cou", "angio-ct-cerebral"] },
    { id: "biologie", label: "Bilan sanguin (FSC, crase, glucose, créatinine, lipides)", category: "complementaire", pertinent: true, topic: "biologie", covers: ["fsc", "crase", "creatinine", "ionogramme", "hba1c"], key: ["fsc", "crase"] },
    { id: "ponction-lombaire", label: "Ponction lombaire", category: "complementaire", pertinent: false, result: "Non indiquée : pas de céphalée, pas de fièvre, pas de signe méningé ; elle n’apporte rien au bilan d’un déficit transitoire." },
    { id: "eeg", label: "Électroencéphalogramme", category: "complementaire", pertinent: false, result: "Tracé normal. Non indiqué : déficit négatif (perte de force, manque du mot) sans secousse ni perte de connaissance, qui n’évoque pas une crise." },
    { id: "d-dimeres", label: "D-dimères", category: "complementaire", pertinent: false, result: "0,4 mg/L. Sans intérêt ici : ils ne renseignent ni sur une source embolique ni sur le risque de récidive." },
  ],
  catalogResults: {
    "ct-cerebral": "CT cérébral natif : pas d’hémorragie, pas de lésion ischémique récente visible ; discrète hypodensité de la substance blanche périventriculaire des deux côtés (leucoaraïose).",
    "irm-cerebrale": "IRM cérébrale : pas de lésion récente en séquence de diffusion, pas de saignement ; quelques hypersignaux punctiformes de la substance blanche périventriculaire des deux côtés (Fazekas 1).",
    "angio-ct-cerebral": "Angio-CT des vaisseaux du cou et intracrâniens : sténose d’environ 75 % de l’origine de l’artère carotide interne gauche sur une plaque irrégulière ; carotide interne droite sans sténose significative ; artères vertébrales perméables ; pas d’occlusion intracrânienne.",
    "ta-deux-bras": "TA 162/88 mmHg au bras droit et 158/86 mmHg au bras gauche : pas d’asymétrie significative.",
    "fsc": "Hémoglobine 148 g/L, leucocytes 7,2 G/L, plaquettes 231 G/L.",
    "crase": "INR 1,0, aPTT dans les normes.",
    "creatinine": "Créatinine 88 µmol/L, urée 6,1 mmol/L.",
    "hba1c": "HbA1c 5,7 %.",
    "fond-oeil": "Rétinopathie hypertensive discrète (artères rétrécies), pas d’embole visible dans les artérioles rétiniennes.",
  },
  acceptable: ["echocardiographie", "pouls-peripheriques", "fond-oeil", "troponine", "tsh"],
  diagnosisChoice: { correct: "Accident ischémique transitoire carotidien gauche", distractors: ["Migraine avec aura", "Hypoglycémie", "Déficit post-critique (paralysie de Todd)"] },
  criteria: [
    presentationCriterion,
    {
      id: "episode",
      label: "Caractérise l’épisode",
      hint: "Heure et mode de début, durée et récupération complète, déficit moteur, trouble de la parole",
      points: 4,
      groups: [ONSET, DURATION, MOTOR, SPEECH],
    },
    {
      id: "associated",
      label: "Recherche les signes associés et les diagnostics trompeurs",
      hint: "Trouble visuel (amaurose), céphalée, convulsion, perte de connaissance, hypoglycémie",
      points: 2,
      groups: [VISION, MIMICS],
    },
    {
      id: "terrain",
      label: "Évalue le terrain vasculaire et la source",
      hint: "Épisodes antérieurs, palpitations (fibrillation auriculaire), tabac, cholestérol, diabète",
      points: 3,
      groups: [PREVIOUS, PALPITATIONS, RISK_FACTORS],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen et examens ciblés",
      hint: "Constantes, glycémie, examen neurologique, auscultation des carotides, ECG, imagerie cérébrale et des vaisseaux du cou",
      points: 3,
      groups: [VITALS, ["nihss", "examen neuro"], ["ecg", "doppler", "irm"]],
    },
    {
      id: "risk",
      label: "Estime le risque de récidive",
      hint: "Score ABCD² (âge, tension, clinique, durée, diabète)",
      points: 1,
      groups: [["abcd", "risque de recidive", "risque d avc", "risque de faire un avc", "recidive"]],
    },
    {
      id: "management",
      label: "Organise le bilan et la prévention sans délai",
      hint: "Hospitalisation (unité neurovasculaire), antiagrégation, avis vasculaire pour endartériectomie carotidienne",
      points: 3,
      groups: [
        ["hospitalis", "unite neurovasculaire", "stroke", "vous garder", "rester a l hopital", "neurologue"],
        ["aspirine", "antiagreg", "clopidogrel", "plavix", "cardioaspirine"],
        ["endarter", "chirurgie carotid", "chirurgien vasculaire", "chirurgie vasculaire", "operer", "desobstru", "stent", "revascularis"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Accident ischémique transitoire du territoire carotidien gauche sur sténose symptomatique de l’artère carotide interne gauche (70–80 %)",
    summary: "Homme de 72 ans, hypertendu, ancien grand fumeur, qui présente une faiblesse de la main droite avec manque du mot d’installation brutale, résolue en 20 minutes, précédée deux semaines plus tôt d’une amaurose transitoire de l’œil gauche. Examen neurologique normal, souffle carotidien gauche, ECG en rythme sinusal, IRM sans lésion en diffusion, écho-doppler : sténose de 70–80 % de la carotide interne gauche. ABCD² à 5 : risque élevé de récidive précoce, bilan et prévention secondaire en urgence.",
    keyFindings: [
      "Déficit focal brutal (main droite, langage) entièrement résolu en 20 minutes ; NIHSS 0 à l’examen.",
      "Amaurose transitoire gauche il y a deux semaines : même territoire carotidien gauche (œil gauche, hémisphère gauche).",
      "ABCD² = 5 : âge ≥ 60 ans (1), TA ≥ 140/90 mmHg (1), déficit moteur unilatéral (2), durée 10–59 min (1), pas de diabète (0).",
      "ECG : rythme sinusal à 74/min, hypertrophie ventriculaire gauche électrique, pas de fibrillation auriculaire sur le tracé.",
      "Écho-doppler : sténose de 70–80 % (NASCET) de l’origine de la carotide interne gauche ; IRM de diffusion sans lésion récente.",
    ],
    redFlags: [
      "Le risque d’AVC est maximal dans les 48 premières heures après un AIT : bilan en urgence, pas de rendez-vous différé.",
      "Récidive d’un déficit pendant la surveillance : alerte AVC, discussion de thrombolyse ou de thrombectomie.",
      "AIT répétés à court intervalle (crescendo) ou sténose carotidienne serrée symptomatique : revascularisation rapide.",
      "Fibrillation auriculaire paroxystique non vue sur un ECG unique : monitorage prolongé du rythme.",
    ],
    management: [
      "Hospitalisation en unité neurovasculaire (stroke unit), surveillance neurologique et monitorage cardiaque continu.",
      "Après l’imagerie (exclusion d’une hémorragie) : aspirine 250–500 mg en dose de charge puis 100 mg/j ; double antiagrégation aspirine et clopidogrel pendant 21 jours possible pour un AIT à haut risque, à coordonner avec le chirurgien vasculaire.",
      "Sténose carotidienne symptomatique de 70–99 % : avis de chirurgie vasculaire et endartériectomie carotidienne idéalement dans les 14 jours (au mieux dans la première semaine).",
      "Statine à haute intensité (atorvastatine 40–80 mg), objectif LDL < 1,4 mmol/L ; contrôle tensionnel progressif (cible < 130/80 mmHg à distance de la phase aiguë).",
      "Bilan de source : Holter ou monitorage prolongé du rythme (fibrillation auriculaire paroxystique), échocardiographie ; pas de conduite automobile avant l’avis spécialisé.",
    ],
    differentials: [
      "AVC ischémique mineur : déficit résolu mais lésion récente en diffusion à l’IRM.",
      "Hypoglycémie (glycémie capillaire normale).",
      "Migraine avec aura (symptômes positifs, marche progressive, céphalée).",
      "Crise épileptique avec déficit post-critique (paralysie de Todd).",
      "Hémorragie intracérébrale ou hématome sous-dural (exclus par l’imagerie).",
    ],
    sources: [
      { label: "ESO 2021 — Guidelines on management of transient ischaemic attack", url: "https://doi.org/10.1177/2396987321992905" },
      { label: "ESVS 2023 — Clinical practice guidelines on the management of atherosclerotic carotid and vertebral artery disease", url: "https://doi.org/10.1016/j.ejvs.2022.04.011" },
      { label: "NICE NG128 — Stroke and transient ischaemic attack in over 16s: diagnosis and initial management", url: "https://www.nice.org.uk/guidance/ng128" },
    ],
    pathologySlugs: ["avc-ait", "imagerie-cerebrale", "hypertension-arterielle"],
  },
};

export const accidentIschemiqueTransitoireDiagnoses: StationDiagnoses = {
  accepted: ["ait"],
  differentials: [
    { label: "AVC ischémique mineur (lésion en diffusion)", ids: ["avc-ischemique"] },
    { label: "Hypoglycémie", ids: ["hypoglycemie"] },
    { label: "Migraine avec aura", ids: ["migraine-aura"] },
    { label: "Crise épileptique avec déficit post-critique", ids: ["epilepsie", "paralysie-todd"] },
  ],
};
