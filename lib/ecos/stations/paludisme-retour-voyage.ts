import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, DYSPNEA, FEVER, LABS, NAUSEA, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "./shared.ts";

const FEVER_PATTERN = [...FEVER, "sueur", "transpir", "courbatur", "muscle", "mal a la tete", "maux de tete", "tete$"];
const PLACES = ["ou etes vous alle", "ou etiez vous", "ou etait", "quel pays", "pays", "cameroun", "afrique", "voyag", "sejour", "region", "ville", "rural", "brousse", "zone"];
const DATES = ["retour", "rentre", "quand etes vous parti", "depart", "etes vous parti", "duree", "combien de temps la bas", "date"];
const PROPHYLAXIS = ["prophyla", "chimioprophyla", "antipalud", "malarone", "atovaquone", "doxycycl", "mefloquine", "comprimes contre", "traitement preventif", "preventif", "prevention"];
const BITES = ["moustique", "piqu", "moustiquaire", "repulsif", "insect"];
const VACCINES = ["vaccin", "fievre jaune"];
const NEURO = ["confus", "somnol", "convuls", "desorient", "conscience", "raideur", "nuque", "ralenti", "bizarre"];
const URINE_BLEEDING = ["urine", "uriner", "pipi", "saign", "sang$", "jaune", "ictere", "bleus", "hematome"];

export const paludismeRetourVoyage: EcosScenario = {
  slug: "paludisme-retour-voyage",
  version: 1,
  setting: "urgences",
  patient: { name: "M. Oberson", age: 41, sex: "M" },
  persona: "Homme fatigué, qui frissonne par moments puis transpire, coopérant et précis sur son voyage. Un peu gêné d’avouer qu’il n’a pas pris de comprimés préventifs : il minimise (« j’y suis allé souvent sans problème »). Il ne parle du voyage que si on le lui demande.",
  brief: [
    "Vous êtes médecin assistant·e au service des urgences.",
    "M. Oberson, 41 ans, se présente aux urgences pour de la fièvre et des frissons depuis trois jours.",
    "Menez l’anamnèse, décrivez l’examen clinique et les examens utiles, posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. J’ai de la fièvre depuis trois jours, avec des frissons terribles. Le paracétamol ne fait presque plus rien.",
  history: {
    identity: "Marc Oberson, 41 ans.",
    occupation: "Je suis ingénieur en génie civil, je suis souvent sur des chantiers à l’étranger.",
    living: "Je vis avec ma femme et nos deux enfants, à Fribourg.",
    feeling: "Épuisé. Je grelotte, puis je suis trempé de sueur.",
    previousEpisodes: "Non, jamais eu une fièvre pareille.",
    course: "Les accès de fièvre reviennent plusieurs fois par jour, et je suis de plus en plus faible.",
    otherSymptoms: "J’ai mal à la tête et des courbatures partout.",
    medications: "Rien de régulier. Du paracétamol, un gramme trois fois par jour depuis trois jours.",
    allergies: "Pas d’allergie connue.",
    personalHistory: "Opéré de l’appendicite à 20 ans, sinon en bonne santé.",
    familyHistory: "Mon père est diabétique.",
    tobacco: "Non, je n’ai jamais fumé.",
    alcohol: "Deux ou trois bières le week-end.",
    drugs: "Non.",
    concerns: "J’ai peur d’avoir attrapé quelque chose là-bas. Et je dois repartir dans un mois.",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "La fièvre a commencé il y a trois jours, d’un coup, avec de grands frissons." },
    { topic: "fièvre", keywords: FEVER, reply: "Jusqu’à 39,8 °C. Je claque des dents, puis je transpire énormément, et ça recommence plusieurs fois par jour." },
    { topic: "céphalées et myalgies", keywords: ["mal a la tete", "maux de tete", "tete$", "courbatur", "muscle", "mal partout", "articul"], reply: "Mal à la tête, surtout pendant la fièvre, et des courbatures dans tout le corps. La lumière ne me gêne pas particulièrement." },
    { topic: "lieu du voyage", keywords: PLACES, reply: "J’étais au Cameroun pour le travail, trois semaines : quelques jours à Douala, puis un chantier en zone rurale près d’Edéa. Escale à Paris seulement." },
    { topic: "dates du voyage", keywords: DATES, reply: "Je suis parti début septembre et je suis rentré il y a dix jours. La fièvre a commencé une semaine après le retour." },
    { topic: "chimioprophylaxie", keywords: PROPHYLAXIS, reply: "Non, je n’ai rien pris. On m’en avait parlé il y a des années, mais j’y suis allé souvent sans problème." },
    { topic: "piqûres", keywords: BITES, reply: "Oui, beaucoup, surtout le soir sur le chantier. Pas de moustiquaire au logement, un spray de temps en temps." },
    { topic: "vaccins", keywords: VACCINES, reply: "Fièvre jaune en 2018, c’est obligatoire pour le Cameroun. Hépatite A aussi, et le tétanos est à jour. Pas de vaccin contre la typhoïde." },
    { topic: "autres expositions", keywords: ["baign", "riviere", "lac$", "eau douce", "nourriture", "mange", "rapport", "sexuel", "partenaire", "animal", "morsure", "malade autour", "autour de vous", "collegue"], reply: "Je ne me suis pas baigné en eau douce. Eau en bouteille, parfois à manger dans la rue. Pas de rapport sexuel là-bas, pas de morsure d’animal. Personne de malade autour de moi." },
    { topic: "digestif", keywords: [...NAUSEA, "diarrh", "selles", "transit"], reply: "Des nausées, j’ai vomi une fois hier soir, mais j’arrive à boire et à garder le paracétamol. Les selles sont un peu molles, deux fois par jour, sans sang." },
    { topic: "signes neurologiques", keywords: NEURO, reply: "Non, j’ai la tête claire. Pas de convulsion, je n’ai pas perdu connaissance, la nuque n’est pas raide." },
    { topic: "urines, saignements, ictère", keywords: URINE_BLEEDING, reply: "J’urine un peu moins parce que je bois peu, mais la couleur est normale. Pas de saignement ni de bleus. Ma femme trouve que j’ai les yeux un peu jaunes depuis ce matin." },
    { topic: "respiration", keywords: [...DYSPNEA, "toux", "tousse"], reply: "Non, pas de toux, et je respire normalement." },
    { topic: "éruption", keywords: ["bouton", "plaque", "eruption", "rougeur", "taches"], reply: "Non, rien sur la peau." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "T 39,4 °C, FC 108/min, TA 122/76 mmHg, FR 18/min, SpO₂ 97 % à l’air ambiant. Glasgow 15." },
    { topic: "glycémie", examiner: true, keywords: ["glycemie", "glucose", "sucre", "dextro"], reply: "Glycémie capillaire 5,8 mmol/L." },
    { topic: "état général et peau", examiner: true, keywords: ["peau", "conjonctiv", "vitropression", "purpura", "ictere", "inspection", "pale", "paleur"], reply: "Patient fatigué, frissonnant, conscient et orienté. Discret subictère conjonctival. Pas d’éruption ni de purpura, pas de pétéchies." },
    { topic: "abdomen", examiner: true, keywords: ["palp", "abdomen", "ventre", "rate$", "foie", "splen", "hepato"], reply: "Abdomen souple, indolore. Pôle inférieur de la rate palpable à un travers de doigt sous le rebord costal gauche. Pas d’hépatomégalie." },
    { topic: "auscultation", examiner: true, keywords: ["auscult", "coeur", "poumon", "stethoscope"], reply: "Bruits du cœur réguliers et rapides, sans souffle. Murmure vésiculaire symétrique, sans râle." },
    { topic: "signes méningés", examiner: true, keywords: ["meninge", "kernig", "brudzinski", "raideur de nuque"], reply: "Nuque souple, signes de Kernig et de Brudzinski négatifs. Pas de déficit neurologique focal." },
    { topic: "recherche de parasites", examiner: true, keywords: ["frottis", "goutte epaisse", "test rapide", "parasit", "plasmodium", "tdr"], reply: "Test rapide antigénique positif (HRP2, Plasmodium falciparum). Goutte épaisse positive ; frottis mince : trophozoïtes annulaires jeunes de P. falciparum, parasitémie 1,5 %, pas de schizonte circulant. Second contrôle prévu dans 12 à 24 heures selon l’évolution." },
    { topic: "bilan sanguin", examiner: true, keywords: [...LABS, "bilirubine", "lactate", "hepatique", "transaminase", "plaquette", "thrombop"], reply: "Hb 128 g/L, leucocytes 5,1 G/L, plaquettes 68 G/L. CRP 96 mg/L. Créatinine 92 µmol/L, Na 134 mmol/L, K 3,9 mmol/L. Bilirubine totale 28 µmol/L, ASAT 58 U/L, ALAT 64 U/L, LDH 410 U/L. Lactate 1,6 mmol/L." },
    { topic: "hémocultures", examiner: true, keywords: ["hemoculture"], reply: "Deux paires d’hémocultures prélevées ; résultat dans 24 à 48 heures." },
    planReaction("Je dois rester à l’hôpital ? C’est grave ? Je pensais que c’était une grosse grippe.", ["artemether", "riamet", "antipalud", "hospitalis", "paludisme", "malaria", "artesunate"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "glycemie", label: "Glycémie capillaire", category: "constantes", pertinent: true, topic: "glycémie" },
    { id: "peau", label: "Examen de la peau et des conjonctives", category: "examen", pertinent: true, topic: "état général et peau", covers: ["peau", "ictere"], key: ["peau", "ictere"] },
    { id: "abdomen", label: "Palpation du foie et de la rate", category: "examen", pertinent: true, topic: "abdomen", covers: ["foie-rate", "palpation-abdominale"], key: ["foie-rate", "palpation-abdominale"] },
    { id: "meninges", label: "Signes méningés", category: "examen", pertinent: true, topic: "signes méningés", covers: ["signes-meninges"] },
    { id: "auscultation", label: "Auscultation cardio-pulmonaire", category: "examen", pertinent: true, topic: "auscultation", covers: ["auscultation-cardiaque", "auscultation-pulmonaire"] },
    // Le catalogue commun n'a pas d'entrée « frottis / goutte épaisse / test rapide » : rattaché à la FSC.
    { id: "parasites", label: "Recherche de Plasmodium (frottis, goutte épaisse, test rapide)", category: "complementaire", pertinent: true, topic: "recherche de parasites", covers: ["frottis-paludisme"] },
    { id: "bilan-sanguin", label: "Bilan sanguin (CRP, créatinine, ionogramme, tests hépatiques, lactate)", category: "complementaire", pertinent: true, topic: "bilan sanguin", covers: ["crp", "creatinine", "ionogramme", "tests-hepatiques", "lactate"], key: ["crp", "creatinine", "tests-hepatiques"] },
    { id: "hemocultures", label: "Hémocultures", category: "complementaire", pertinent: true, topic: "hémocultures" },
    { id: "ponction-lombaire", label: "Ponction lombaire", category: "complementaire", pertinent: false, result: "Non indiquée : conscience normale, pas de signe méningé, et plaquettes à 68 G/L." },
    { id: "ct-cerebral", label: "CT cérébral natif", category: "complementaire", pertinent: false, result: "Non indiqué : Glasgow 15, pas de déficit focal. Pas d’anomalie." },
    { id: "echocardiographie", label: "Échocardiographie", category: "complementaire", pertinent: false, result: "Non indiquée : pas de souffle ni de signe d’insuffisance cardiaque. FEVG normale." },
    { id: "radio-abdomen", label: "Radiographie de l’abdomen sans préparation", category: "complementaire", pertinent: false, result: "Non indiquée : abdomen souple, pas de signe d’occlusion ni de perforation. Sans particularité." },
  ],
  catalogResults: {
    "etat-general": "Patient fatigué, frissonnant, conscient et orienté. Discret subictère conjonctival.",
    "hydratation": "Muqueuses un peu sèches, temps de recoloration 2 secondes.",
    "fsc": "Hb 128 g/L, leucocytes 5,1 G/L, plaquettes 68 G/L. Au frottis de contrôle demandé devant la thrombopénie, le laboratoire signale des hématies parasitées : test rapide positif (HRP2, P. falciparum), goutte épaisse positive, trophozoïtes annulaires de P. falciparum, parasitémie 1,5 %.",
    "crp": "CRP 96 mg/L.",
    "procalcitonine": "Procalcitonine 2,1 µg/L.",
    "ionogramme": "Na 134 mmol/L, K 3,9 mmol/L, Cl 100 mmol/L, Ca et Mg normaux.",
    "creatinine": "Créatinine 92 µmol/L, urée 7,1 mmol/L.",
    "tests-hepatiques": "Bilirubine totale 28 µmol/L (surtout non conjuguée), ASAT 58 U/L, ALAT 64 U/L, LDH 410 U/L.",
    "lactate": "Lactate 1,6 mmol/L.",
    "d-dimeres": "D-dimères 2,1 mg/L.",
    "ecg": "Tachycardie sinusale à 108/min, axe normal, PR 160 ms, QRS fins, QTc 420 ms, pas de trouble de la repolarisation.",
    "echo-abdominale": "Splénomégalie homogène (rate 14 cm de grand axe), foie et voies biliaires sans particularité, pas d’épanchement.",
    "bandelette": "Bandelette urinaire : urobilinogène +, protéines traces, pas de sang, leucocytes et nitrites négatifs.",
  },
  acceptable: ["procalcitonine", "crase", "gazometrie", "serologies", "bandelette", "ecg", "radio-thorax", "echo-abdominale", "d-dimeres", "groupe", "adenopathies", "examen-orl", "pupilles", "examen-neurologique"],
  diagnosisChoice: { correct: "Paludisme à Plasmodium falciparum non compliqué", distractors: ["Dengue", "Fièvre typhoïde", "Grippe"] },
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Caractérise la fièvre",
      hint: "Début, accès fébriles avec frissons et sueurs, céphalées et myalgies",
      points: 2,
      groups: [ONSET, FEVER_PATTERN],
    },
    {
      id: "travel",
      label: "Précise le voyage et l’exposition",
      hint: "Lieux et zone rurale, dates de séjour et de retour, chimioprophylaxie, piqûres et protection, vaccins",
      points: 5,
      groups: [PLACES, DATES, PROPHYLAXIS, BITES, VACCINES],
    },
    {
      id: "severity",
      label: "Recherche les signes de gravité",
      hint: "Confusion ou convulsions, urines foncées, saignements ou ictère, vomissements ou détresse respiratoire",
      points: 3,
      groups: [NEURO, URINE_BLEEDING, [...NAUSEA, ...DYSPNEA]],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen et examens ciblés",
      hint: "Constantes et glycémie, peau, rate et signes méningés, frottis et goutte épaisse ou test rapide, bilan de gravité, hémocultures",
      points: 3,
      groups: [["rate$", "splen", "palp"], ["frottis", "goutte epaisse", "test rapide", "parasit"], ["hemoculture", "plaquette", "thrombop", "bilirubine"]],
    },
    {
      id: "management",
      label: "Traite et surveille",
      hint: "Hospitalisation pour l’initiation, artéméther-luméfantrine par voie orale (artésunate IV si gravité), contrôle de la parasitémie et déclaration",
      points: 3,
      groups: [
        ["hospitalis", "vous garder", "rester a l hopital", "surveill"],
        ["artemether", "riamet", "coartem", "artesunate", "atovaquone", "malarone", "antipalud", "traitement contre le paludisme"],
        ["parasitemie", "controle", "declar", "ofsp", "annonce obligatoire", "reevalu", "suivi"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Paludisme à Plasmodium falciparum non compliqué, au retour du Cameroun, sans chimioprophylaxie",
    summary: "Homme de 41 ans rentré il y a dix jours d’un séjour de trois semaines au Cameroun, en partie en zone rurale, sans chimioprophylaxie et avec de nombreuses piqûres de moustiques, qui présente depuis trois jours des accès fébriles avec frissons et sueurs, céphalées et myalgies. Splénomégalie discrète, subictère, thrombopénie à 68 G/L ; test rapide, goutte épaisse et frottis positifs à P. falciparum avec une parasitémie de 1,5 %, sans critère de gravité. Toute fièvre au retour d’une zone d’endémie est un paludisme jusqu’à preuve du contraire.",
    keyFindings: [
      "Séjour en zone d’endémie de P. falciparum (Afrique subsaharienne), retour depuis dix jours, sans chimioprophylaxie ni moustiquaire.",
      "Accès fébriles avec frissons et sueurs, céphalées, myalgies, troubles digestifs légers.",
      "Splénomégalie, subictère, thrombopénie, LDH et bilirubine non conjuguée élevées (hémolyse).",
      "Test rapide, goutte épaisse et frottis positifs ; parasitémie 1,5 % ; conscience normale, pas d’hypoglycémie, lactate et créatinine normaux.",
    ],
    redFlags: [
      "Critères de gravité : trouble de la conscience ou convulsions, détresse respiratoire, choc, insuffisance rénale, acidose ou lactate > 5 mmol/L, hypoglycémie, Hb < 70 g/L, ictère avec parasitémie élevée, saignement, parasitémie > 5 % (> 2 % chez le non-immun selon certaines recommandations).",
      "Un premier frottis négatif n’exclut pas le paludisme : répéter toutes les 12 à 24 heures, trois fois.",
      "Les vomissements empêchant le traitement oral imposent un traitement IV ; tout paludisme à P. falciparum peut s’aggraver en quelques heures.",
    ],
    management: [
      "Ne pas différer : test rapide et goutte épaisse ou frottis en urgence, avec la parasitémie, devant toute fièvre au retour des tropiques (jusqu’à 3 mois et plus).",
      "Hospitalisation pour l’initiation du traitement et la surveillance (clinique, glycémie, plaquettes, créatinine).",
      "Forme non compliquée : artéméther-luméfantrine (Riamet®) par voie orale, 4 comprimés à H0, H8, puis 2 fois par jour les jours 2 et 3 (6 prises), avec un repas gras ; ECG (QTc) avant le traitement.",
      "Forme grave : artésunate IV aux soins intermédiaires ou intensifs, avec avis infectiologique.",
      "Contrôle de la parasitémie (J3, J7), antipyrétique (paracétamol), déclaration obligatoire à l’OFSP ; conseil aux voyageurs avant le prochain départ (chimioprophylaxie, moustiquaire, répulsif).",
    ],
    differentials: [
      "Dengue (fièvre, céphalées, myalgies, thrombopénie ; incubation courte, souvent éruption).",
      "Fièvre typhoïde (fièvre progressive, troubles digestifs, pas de vaccin ici).",
      "Sepsis bactérien, pyélonéphrite ou pneumonie (hémocultures, examen).",
      "Primo-infection VIH, hépatite virale aiguë, grippe, rickettsiose ou méningite.",
    ],
    sources: [
      { label: "OMS — WHO Guidelines for malaria", url: "https://www.who.int/publications/i/item/guidelines-for-malaria" },
      { label: "OFSP — Malaria (paludisme)", url: "https://www.bag.admin.ch/bag/fr/home/krankheiten/krankheiten-im-ueberblick/malaria.html" },
      { label: "CDC — Malaria: Clinical guidance", url: "https://www.cdc.gov/malaria/hcp/clinical-guidance/index.html" },
    ],
    pathologySlugs: ["paludisme", "sepsis-choc-septique"],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const paludismeRetourVoyageDiagnoses: StationDiagnoses = {
  accepted: ["paludisme"],
  differentials: [
    d("Sepsis bactérien", "sepsis"),
    d("Primo-infection VIH", "primo-infection-vih"),
    d("Hépatite virale aiguë", "hepatite-aigue"),
    d("Grippe ou méningite", "grippe", "meningite-bacterienne"),
  ],
};
