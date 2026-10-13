import type { EcosScenario } from "../types.ts";
import { communicationCriterion, LABS, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "./shared.ts";

const MOOD = ["moral", "humeur", "triste", "tristesse", "deprim", "cafard", "pleur", "comment vous sentez", "comment allez vous"];
const ANHEDONIA = ["plaisir", "envie", "interet", "loisir", "activites", "aimiez", "passion"];
const SLEEP = ["sommeil", "dormez", "dormir", "nuit", "reveil", "insomn"];
const APPETITE = ["appetit", "manger", "mangez", "poids", "maigri", "kilos"];
const SUICIDE = ["suicid", "en finir", "idees noires", "mourir", "plus envie de vivre", "vous faire du mal", "vous tuer", "mettre fin", "disparaitre", "pense a la mort"];
const PLAN = ["plan", "comment", "moyen", "prevu", "scenario", "medicaments de cote", "mis de cote", "quand$", "prepare"];
const ATTEMPT = ["deja essaye", "tentative", "deja tente", "par le passe", "avant$"];
const PROTECTIVE = ["retient", "enfant", "raison de vivre", "vous empeche", "proteg", "soutien", "entourage", "famille", "proche"];

export const humeurDepressiveIdeesSuicidaires: EcosScenario = {
  slug: "humeur-depressive-idees-suicidaires",
  version: 1,
  setting: "cabinet",
  patient: { name: "Mme Dubois", age: 41, sex: "F" },
  persona: "Ralentie, voix basse, regard souvent baissé, réponses courtes. Elle se livre davantage si l’étudiant est empathique et pose des questions directes, sans jugement. Elle ne parle de ses idées suicidaires que si on les lui demande clairement.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "Mme Dubois, 41 ans, consulte pour une fatigue et des troubles du sommeil depuis plusieurs semaines.",
    "Menez l’anamnèse, évaluez le risque, décrivez les examens utiles et proposez une prise en charge.",
  ],
  opening: "Bonjour… Je viens parce que je suis épuisée. Je dors mal, je n’arrive plus à rien.",
  history: {
    identity: "Nathalie Dubois, 41 ans.",
    occupation: "J’étais employée de commerce. J’ai perdu mon poste il y a trois mois, le magasin a fermé.",
    living: "Je vis seule avec mes deux enfants, 9 et 12 ans. Je suis séparée depuis l’an dernier.",
    feeling: "Vide. Tout me paraît lourd, même me lever le matin.",
    previousEpisodes: "J’ai eu un passage difficile après la naissance de mon fils, mais je m’en étais sortie sans traitement.",
    course: "Ça s’aggrave depuis deux mois. Au début c’était la fatigue, maintenant je ne vois plus d’issue.",
    otherSymptoms: "Je n’arrive plus à me concentrer, je relis trois fois la même ligne.",
    medications: "Rien de régulier. Parfois des comprimés pour dormir que ma mère m’a donnés.",
    allergies: "Pas d’allergie.",
    personalHistory: "Rien de particulier, pas de maladie de la thyroïde à ma connaissance.",
    familyHistory: "Ma mère a fait une dépression. Mon oncle s’est suicidé quand j’avais vingt ans.",
    tobacco: "Je fume dix cigarettes par jour, un peu plus en ce moment.",
    alcohol: "Un ou deux verres de vin le soir, pour arriver à dormir. Avant, je ne buvais presque pas.",
    drugs: "Non.",
    concerns: "J’ai peur de ne plus être capable de m’occuper de mes enfants. Je ne veux pas qu’on me les enlève.",
  },
  rules: [
    { topic: "humeur", keywords: MOOD, reply: "Triste, tout le temps. Je pleure souvent, surtout le soir quand les enfants sont couchés." },
    { topic: "anhédonie", keywords: ANHEDONIA, reply: "Plus rien ne me fait plaisir. Avant je chantais dans une chorale, j’ai tout arrêté." },
    { topic: "sommeil", keywords: SLEEP, reply: "Je m’endors tard et je me réveille vers 4 heures du matin, ensuite je tourne en rond." },
    { topic: "appétit", keywords: APPETITE, reply: "Je mange à peine. J’ai perdu environ cinq kilos en deux mois." },
    { topic: "énergie", keywords: ["fatigue", "fatigu", "energie", "epuise", "force"], reply: "Je suis épuisée du matin au soir, même sans rien faire." },
    { topic: "concentration", keywords: ["concentr", "memoire", "attention", "decision"], reply: "Je n’arrive plus à me concentrer ni à prendre la moindre décision." },
    { topic: "culpabilité", keywords: ["culpab", "faute", "nulle", "valeur", "honte", "reproche"], reply: "Je me sens nulle. Une mauvaise mère, une ratée." },
    { topic: "idées suicidaires", keywords: SUICIDE, reply: "(silence) … Oui. J’y pense presque tous les jours. Je me dis que ce serait plus simple pour tout le monde." },
    { topic: "plan suicidaire", keywords: PLAN, reply: "J’ai mis de côté les somnifères de ma mère, une boîte entière. Je n’ai pas décidé quand." },
    { topic: "tentative antérieure", keywords: ATTEMPT, reply: "Non, je n’ai jamais essayé." },
    { topic: "facteurs protecteurs", keywords: PROTECTIVE, reply: "Mes enfants. C’est ce qui me retient. Ma sœur m’appelle souvent aussi." },
    { topic: "déclencheur", keywords: ["declench", "pourquoi", "evenement", "travail", "emploi", "separation", "divorce", "difficult", "stress"], reply: "La séparation, puis le licenciement. J’ai des soucis d’argent, j’ai peur de perdre l’appartement." },
    { topic: "manie", keywords: ["euphor", "excit", "trop d energie", "pas besoin de dormir", "depens"], reply: "Non, jamais eu de périodes où j’étais excitée ou sans besoin de dormir." },
    { topic: "psychose", keywords: ["voix", "entendez", "hallucin", "persecut", "on vous veut du mal", "voyez des choses"], reply: "Non, je n’entends pas de voix, rien de ce genre." },
    { topic: "anxiété", keywords: ["anxi", "angoiss", "panique", "inquiet"], reply: "Je suis angoissée, surtout le matin. J’ai la boule au ventre." },
    { topic: "début", keywords: ONSET, reply: "Depuis environ deux mois, après le licenciement. Ça s’est installé petit à petit." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 118/74 mmHg, FC 76/min, T 36,6 °C, poids 58 kg (64 kg il y a trois mois selon le dossier)." },
    { topic: "état mental", examiner: true, keywords: ["etat mental", "status psy", "statut psy", "examen psy", "presentation", "contact", "discours"], reply: "Présentation négligée, ralentissement psychomoteur, discours pauvre, affect triste peu mobilisable. Pas de symptôme psychotique. Orientée, jugement conservé. Idées de mort avec plan et moyens disponibles." },
    { topic: "bilan sanguin", examiner: true, keywords: [...LABS, "tsh", "thyroide"], reply: "FSC, ionogramme, créatinine, TSH, ferritine et vitamine B12 normales. Gamma-GT discrètement élevée (68 U/L)." },
    { topic: "questionnaire", examiner: true, keywords: ["phq", "questionnaire", "echelle", "score"], reply: "PHQ-9 : 21/27, réponse « presque tous les jours » à l’item 9 (pensées de mort)." },
    planReaction("Vous voulez m’hospitaliser ? Et mes enfants, qui va s’en occuper ?", ["psychiatr", "hospitalis", "antidepress", "psychoth", "plan de securite", "boite", "medicaments de cote", "aujourd hui", "143", "urgence"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes et poids", category: "constantes", pertinent: true, topic: "constantes" },
    { id: "etat-mental", label: "Examen de l’état mental", category: "examen", pertinent: true, topic: "état mental" },
    { id: "automutilation", label: "Recherche de lésions d’automutilation", category: "examen", pertinent: true, result: "Pas de cicatrice ni de lésion récente aux avant-bras ou ailleurs." },
    { id: "neuro-complet", label: "Examen neurologique complet", category: "examen", pertinent: false, result: "Normal. Il n’apporte rien à l’évaluation de ce tableau." },
    { id: "auscultation", label: "Auscultation cardio-pulmonaire", category: "examen", pertinent: false, result: "Bruits du cœur réguliers, poumons libres." },
    { id: "bilan-sanguin", label: "Bilan sanguin (FSC, TSH, ionogramme)", category: "complementaire", pertinent: true, topic: "bilan sanguin" },
    { id: "phq9", label: "Questionnaire PHQ-9", category: "complementaire", pertinent: true, topic: "questionnaire" },
    { id: "ct-cerebral", label: "CT cérébral", category: "complementaire", pertinent: false, result: "Non indiqué : aucun signe neurologique ni atypie." },
    { id: "eeg", label: "Électroencéphalogramme", category: "complementaire", pertinent: false, result: "Non indiqué dans un épisode dépressif typique." },
  ],
  diagnosisChoice: { correct: "Épisode dépressif majeur sévère avec idées suicidaires", distractors: ["Trouble de l’adaptation avec humeur dépressive", "Trouble bipolaire, épisode dépressif", "Hypothyroïdie"] },
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Recherche les critères dépressifs",
      hint: "Humeur, perte de plaisir, sommeil, appétit ou poids",
      points: 4,
      groups: [MOOD, ANHEDONIA, SLEEP, APPETITE],
    },
    {
      id: "suicide",
      label: "Évalue le risque suicidaire",
      hint: "Idées, plan et moyens, tentatives antérieures, facteurs protecteurs",
      points: 4,
      groups: [SUICIDE, PLAN, ATTEMPT, PROTECTIVE],
    },
    {
      id: "context",
      label: "Explore le contexte et les diagnostics différentiels",
      hint: "Événements déclenchants, épisodes maniaques ou psychotiques",
      points: 2,
      groups: [["declench", "evenement", "travail", "emploi", "separation", "difficult", "stress"], ["euphor", "excit", "trop d energie", "voix", "hallucin"]],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen et bilan ciblés",
      hint: "État mental, bilan sanguin avec TSH, échelle de sévérité",
      points: 2,
      groups: [["etat mental", "examen psy"], ["tsh", "prise de sang", "bilan sanguin", "phq"]],
    },
    {
      id: "management",
      label: "Met en sécurité et organise la prise en charge",
      hint: "Évaluation psychiatrique le jour même, retrait des moyens, traitement, suivi rapproché",
      points: 4,
      groups: [
        ["psychiatr", "hospitalis", "urgence", "aujourd hui"],
        ["boite", "medicaments de cote", "retirer", "eloigner", "donner a", "plan de securite"],
        ["antidepress", "psychoth", "isrs", "sertraline", "escitalopram"],
        ["revoir", "suivi", "rendez vous", "143", "144", "appeler"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Épisode dépressif majeur sévère avec idées suicidaires, plan et moyens disponibles",
    summary: "Depuis deux mois, humeur triste, perte de plaisir, insomnie avec réveil précoce, perte de 6 kg, fatigue, troubles de concentration et culpabilité, après une séparation et un licenciement. Elle a des idées suicidaires quotidiennes et a mis de côté une boîte de somnifères : le risque est élevé et impose une évaluation psychiatrique le jour même.",
    keyFindings: [
      "Au moins cinq critères dépressifs depuis plus de deux semaines, avec retentissement majeur.",
      "Idées suicidaires quotidiennes, plan (intoxication médicamenteuse) et moyen à disposition.",
      "Facteurs de risque : isolement, difficultés financières, antécédent familial de suicide, alcool en hausse.",
      "Facteurs protecteurs : ses enfants, une sœur présente ; aucun symptôme maniaque ni psychotique.",
    ],
    redFlags: [
      "Plan précis et moyens disponibles : risque élevé, ne pas laisser repartir sans mise en sécurité.",
      "Alcool ou sédatifs en hausse : désinhibition et majoration du risque de passage à l’acte.",
      "Antécédent familial de suicide et rupture récente (emploi, couple).",
    ],
    management: [
      "Poser la question du suicide directement : cela ne l’induit pas et ouvre la discussion.",
      "Évaluation psychiatrique le jour même (urgences psychiatriques ou équipe mobile) ; hospitalisation à discuter, de préférence volontaire.",
      "Retrait des moyens : la boîte de somnifères est confiée à un proche ou rapportée ; plan de sécurité écrit avec numéros d’urgence (143, 144).",
      "Traitement : psychothérapie et antidépresseur (ISRS, par ex. sertraline) avec suivi rapproché au début, car le risque peut augmenter à l’initiation.",
      "Organiser l’aide pour les enfants et le soutien social ; revoir la patiente dans les jours qui suivent.",
    ],
    differentials: [
      "Trouble de l’adaptation (symptômes moins sévères et moins nombreux).",
      "Trouble bipolaire (rechercher des épisodes maniaques ou hypomaniaques).",
      "Cause organique : hypothyroïdie, anémie, carences (bilan normal ici).",
      "Trouble lié à l’usage d’alcool (consommation récente, gamma-GT élevée) à suivre.",
    ],
    sources: [
      { label: "NICE NG222 (2022) — Depression in adults: treatment and management", url: "https://www.nice.org.uk/guidance/ng222" },
      { label: "NICE NG225 (2022) — Self-harm: assessment, management and preventing recurrence", url: "https://www.nice.org.uk/guidance/ng225" },
    ],
    pathologySlugs: ["troubles-de-humeur", "risque-suicidaire"],
  },
};
