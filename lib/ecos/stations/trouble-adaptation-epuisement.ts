import type { EcosScenario } from "../types.ts";
import type { StationDiagnoses } from "./diagnoses.ts";
import { communicationCriterion, ONSET, planReaction, presentationCriterion, treatmentsCriterion, VITALS } from "./shared.ts";

const MOOD = ["moral", "humeur", "triste", "tristesse", "deprim", "cafard", "pleur", "comment vous sentez", "comment allez vous"];
const ANHEDONIA = ["plaisir", "envie", "interet", "loisir", "activites", "aimiez", "passion"];
const SLEEP = ["sommeil", "dormez", "dormir", "nuit", "reveil", "insomn", "endormi"];
const IRRITABILITY = ["irrit", "enerv", "colere", "patience", "agac", "tendu", "fatigue", "fatigu", "energie", "epuis"];
const APPETITE = ["appetit", "manger", "mangez", "poids", "maigri", "kilos"];
const SUICIDE = ["suicid", "en finir", "idees noires", "mourir", "plus envie de vivre", "vous faire du mal", "vous tuer", "mettre fin", "disparaitre", "pense a la mort"];
const WORK = ["travail", "boulot", "restructur", "chef", "collegue", "horaire", "heures sup", "garde", "charge", "ambiance", "service", "emploi", "poste", "declench", "evenement", "stress"];
const ALCOHOL = ["alcool", "vin$", "boire", "buvez", "verre", "biere", "aperitif"];
const SUBSTANCES = ["cafe", "somnif", "calmant", "benzo", "tranquillis", "cannabis", "drogue", "substance", "pour dormir"];
const RESOURCES = ["soutien", "entourage", "mari$", "conjoint", "ami", "parler a", "qui vous aide", "ressource", "sport", "proche", "confier"];

export const troubleAdaptationEpuisement: EcosScenario = {
  slug: "trouble-adaptation-epuisement",
  version: 1,
  setting: "cabinet",
  patient: { name: "Mme Muller", age: 45, sex: "F" },
  persona: "Fatiguée, tendue, s’exprime clairement (elle est infirmière et utilise parfois des termes médicaux). Les larmes montent quand elle parle des patients qu’elle n’a plus le temps de bien soigner. Elle minimise et culpabilise à l’idée d’un arrêt de travail. Elle répond franchement et sans hésiter qu’elle n’a pas d’idée suicidaire si on le lui demande.",
  brief: [
    "Vous êtes médecin assistant·e en cabinet de médecine générale.",
    "Mme Muller, 45 ans, consulte au cabinet pour de la fatigue et des troubles du sommeil.",
    "Menez l’anamnèse, décrivez l’examen clinique et les examens utiles, posez un diagnostic et proposez une prise en charge.",
  ],
  opening: "Bonjour docteur. Je suis à bout. Je dors mal, je suis tout le temps fatiguée et je m’énerve pour un rien.",
  history: {
    identity: "Sandra Muller, 45 ans.",
    occupation: "Je suis infirmière en médecine interne à l’hôpital, à 80 %, depuis quinze ans.",
    living: "Je vis avec mon mari et nos deux enfants, 13 et 16 ans.",
    feeling: "Vidée. Je n’ai plus de réserve, j’ai l’impression de fonctionner en pilote automatique.",
    previousEpisodes: "Non, jamais. J’ai toujours été solide, c’est la première fois que je craque comme ça.",
    course: "Ça s’est installé petit à petit depuis l’été, et ça s’aggrave depuis un mois.",
    otherSymptoms: "J’ai souvent des tensions dans la nuque et mal à la tête le soir.",
    medications: "Rien de régulier. Parfois un ibuprofène pour la tête.",
    allergies: "Pas d’allergie.",
    personalHistory: "Rien de particulier, deux grossesses normales. Pas de problème de thyroïde à ma connaissance.",
    familyHistory: "Ma mère a une hypothyroïdie. Pas de maladie psychique dans la famille à ma connaissance.",
    tobacco: "Non, j’ai arrêté il y a quinze ans.",
    alcohol: "Un verre de vin presque tous les soirs pour décompresser, parfois deux. Avant, c’était seulement le week-end.",
    drugs: "Non. Par contre cinq ou six cafés par jour pour tenir.",
    concerns: "J’ai peur de faire une erreur avec un patient. Et je ne veux pas lâcher mes collègues.",
  },
  rules: [
    { topic: "début", keywords: ONSET, reply: "Depuis environ trois mois, peu après la réorganisation du service en juin." },
    { topic: "contexte professionnel", keywords: WORK, reply: "On a fusionné deux unités en juin : moins de postes, des heures supplémentaires, des plannings changés au dernier moment, une nouvelle cheffe. Je n’ai plus le temps de bien soigner mes patients, ça me ronge." },
    { topic: "sommeil", keywords: SLEEP, reply: "Je mets plus d’une heure à m’endormir, je repense au service. Je me réveille aussi la nuit, puis je me rendors tant bien que mal. Les jours de congé, je dors mieux." },
    { topic: "fatigue et irritabilité", keywords: IRRITABILITY, reply: "Je suis épuisée dès le réveil. Je m’énerve contre mon mari et les enfants pour des bêtises, et au travail je n’ai plus de patience avec les patients, ça me fait honte." },
    { topic: "humeur", keywords: MOOD, reply: "Plutôt à bout que triste. J’ai pleuré deux fois dans le vestiaire. Mais quand je suis en vacances ou avec les enfants, ça va mieux." },
    { topic: "plaisir", keywords: ANHEDONIA, reply: "Le week-end, en randonnée avec mon mari, je profite encore. Mais le dimanche soir, l’angoisse revient." },
    { topic: "appétit", keywords: APPETITE, reply: "Je mange normalement, mon poids n’a pas bougé." },
    { topic: "concentration", keywords: ["concentr", "memoire", "attention", "oubli", "erreur"], reply: "Je dois tout vérifier deux fois au travail, j’ai peur d’oublier quelque chose." },
    { topic: "culpabilité", keywords: ["culpab", "faute", "nulle", "valeur", "honte", "reproche"], reply: "Je culpabilise de mal faire mon travail et d’être désagréable à la maison, mais je ne me sens pas nulle pour autant." },
    { topic: "idées suicidaires", keywords: SUICIDE, reply: "Non, jamais. Je suis épuisée, pas désespérée. Mes enfants comptent trop pour moi." },
    { topic: "tentative antérieure", keywords: ["deja essaye", "tentative", "deja tente"], reply: "Non, jamais." },
    { topic: "anxiété", keywords: ["anxi", "angoiss", "panique", "inquiet", "boule"], reply: "Une boule au ventre le dimanche soir et avant les services du matin. Pas de vraies crises de panique." },
    { topic: "manie et psychose", keywords: ["euphor", "excit", "trop d energie", "pas besoin de dormir", "voix", "hallucin", "persecut"], reply: "Non, rien de tout ça." },
    { topic: "alcool", keywords: ALCOHOL, reply: "Un verre de vin presque tous les soirs pour décompresser, parfois deux. Avant, c’était seulement le week-end. Je n’en ai jamais besoin le matin." },
    { topic: "autres substances", keywords: SUBSTANCES, reply: "Cinq ou six cafés par jour pour tenir. Pas de somnifères ni de calmants, pas de cannabis." },
    { topic: "ressources", keywords: RESOURCES, reply: "Mon mari me soutient beaucoup, ma sœur aussi. Je courais deux fois par semaine, j’ai arrêté faute d’énergie." },
    { topic: "arrêt de travail", keywords: ["arret de travail", "arret maladie", "certificat", "incapacite", "arreter de travailler", "pause"], reply: "Je n’y ai pas pensé… Le service manque déjà de monde, je culpabiliserais. Mais honnêtement, je ne tiens plus." },
    { topic: "signes thyroïdiens", keywords: ["froid", "frilos", "constip", "cheveux", "palpit", "thyro", "chaleur"], reply: "Je n’ai pas plus froid que d’habitude, pas de constipation, pas de palpitations." },
    { topic: "cycle", keywords: ["regles", "menopaus", "bouffee", "cycle", "saignement"], reply: "Règles régulières, pas plus abondantes. Pas de bouffées de chaleur." },
    { topic: "ronflements", keywords: ["ronfl", "apnee", "somnolen"], reply: "Mon mari dit que je ne ronfle pas. Je ne m’endors pas dans la journée." },
    { topic: "signes généraux", keywords: ["fievre", "sueur", "ganglion", "amaigr"], reply: "Non, pas de fièvre ni de sueurs, je n’ai pas maigri." },
    { topic: "constantes", examiner: true, keywords: VITALS, reply: "TA 128/80 mmHg, FC 78/min, T 36,7 °C, poids 66 kg (stable par rapport au dossier), IMC 24 kg/m²." },
    { topic: "état mental", examiner: true, keywords: ["etat mental", "status psy", "statut psy", "examen psy", "presentation", "contact", "discours"], reply: "Tenue soignée, fatiguée, tendue. Humeur abaissée et réactive, se détend quand elle parle de ses enfants, pleure brièvement en évoquant le travail. Pas de ralentissement psychomoteur. Discours cohérent, pas de symptôme psychotique. Pas d’idée de mort ni d’idée suicidaire. Bonne conscience de ses difficultés." },
    { topic: "thyroïde", examiner: true, keywords: ["thyroide", "palpation du cou", "goitre"], reply: "Thyroïde non palpable, sans nodule." },
    { topic: "bilan sanguin", examiner: true, keywords: ["prise de sang", "bilan sanguin", "bilan biologique", "biologie", "laboratoire", "labo", "formule sanguine", "fsc", "tsh", "ferritine", "glycemie"], reply: "Hb 132 g/L, leucocytes 6,4 G/L, plaquettes 245 G/L. TSH 1,8 mU/L. Ferritine 52 µg/L, vitamine B12 normale. Na 139 mmol/L, K 4,1 mmol/L, créatinine 68 µmol/L. ASAT, ALAT et gamma-GT normales. Glycémie à jeun 5,1 mmol/L." },
    { topic: "questionnaire", examiner: true, keywords: ["phq", "questionnaire", "echelle", "score"], reply: "PHQ-9 : 11/27 (fatigue, sommeil, concentration surtout), item 9 (pensées de mort) à 0." },
    planReaction("Un arrêt de travail ? Mais qui va me remplacer ? … Bon, si vous pensez que c’est nécessaire, peut-être deux semaines.", ["arret de travail", "certificat", "psychoth", "psycholog", "medecin du travail"]),
  ],
  examination: [
    { id: "constantes", label: "Constantes vitales et pesée", category: "constantes", pertinent: true, topic: "constantes", covers: ["constantes", "poids"] },
    { id: "etat-mental", label: "Examen de l’état mental", category: "examen", pertinent: true, topic: "état mental" },
    { id: "thyroide", label: "Palpation de la thyroïde", category: "examen", pertinent: true, topic: "thyroïde" },
    { id: "bilan-sanguin", label: "Bilan sanguin (FSC, TSH, ferritine, ionogramme)", category: "complementaire", pertinent: true, topic: "bilan sanguin", covers: ["fsc", "tsh", "ferritine-b12", "ionogramme", "creatinine", "tests-hepatiques"], key: ["fsc", "tsh"] },
    { id: "phq9", label: "Questionnaire PHQ-9", category: "complementaire", pertinent: true, topic: "questionnaire" },
    { id: "ct-cerebral", label: "CT cérébral", category: "complementaire", pertinent: false, result: "Non indiqué : aucun signe neurologique, céphalées de tension typiques. Sans particularité." },
    { id: "irm-cerebrale", label: "IRM cérébrale", category: "complementaire", pertinent: false, result: "Non indiquée : aucun signe neurologique ni atypie. Sans particularité." },
    { id: "eeg", label: "Électroencéphalogramme", category: "complementaire", pertinent: false, result: "Non indiqué : pas de malaise ni de trouble de la conscience. Tracé normal." },
    { id: "toxiques", label: "Dépistage toxicologique urinaire", category: "complementaire", pertinent: false, result: "Non indiqué : consommation décrite ouvertement, pas de signe d’intoxication. Négatif.", covers: ["alcool-toxiques"] },
  ],
  catalogResults: {
    "etat-general": "Patiente fatiguée et tendue, sans signe de souffrance physique.",
    "fsc": "Hb 132 g/L, leucocytes 6,4 G/L, plaquettes 245 G/L.",
    "tsh": "TSH 1,8 mU/L.",
    "ferritine-b12": "Ferritine 52 µg/L, vitamine B12 et folates normaux.",
    "glycemie": "Glycémie capillaire 5,3 mmol/L.",
  },
  acceptable: ["auscultation-cardiaque", "auscultation-pulmonaire", "adenopathies", "examen-neurologique", "ecg", "hba1c", "crp", "creatinine", "ionogramme", "tests-hepatiques", "beta-hcg", "rachis"],
  diagnosisChoice: { correct: "Trouble de l’adaptation avec épuisement professionnel", distractors: ["Épisode dépressif majeur", "Hypothyroïdie", "Trouble anxieux généralisé"] },
  criteria: [
    presentationCriterion,
    {
      id: "symptoms",
      label: "Caractérise les symptômes",
      hint: "Sommeil, fatigue et irritabilité",
      points: 2,
      groups: [SLEEP, IRRITABILITY],
    },
    {
      id: "context",
      label: "Explore le facteur de stress",
      hint: "Début et lien avec la réorganisation du travail",
      points: 2,
      groups: [ONSET, WORK],
    },
    {
      id: "mood",
      label: "Évalue l’humeur et le risque suicidaire",
      hint: "Humeur, perte de plaisir, appétit et poids, idées suicidaires posées directement",
      points: 4,
      groups: [MOOD, ANHEDONIA, APPETITE, SUICIDE],
    },
    {
      id: "resources",
      label: "Recherche consommations et ressources",
      hint: "Alcool, café ou somnifères, soutien de l’entourage",
      points: 3,
      groups: [ALCOHOL, SUBSTANCES, RESOURCES],
    },
    treatmentsCriterion,
    {
      id: "exam",
      label: "Examen et bilan ciblés",
      hint: "État mental, thyroïde, bilan sanguin (FSC, TSH), échelle de sévérité",
      points: 2,
      groups: [["etat mental", "examen psy"], ["tsh", "prise de sang", "bilan sanguin", "phq"]],
    },
    {
      id: "management",
      label: "Propose une prise en charge adaptée",
      hint: "Arrêt de travail limité, soutien psychothérapeutique, suivi rapproché",
      points: 3,
      groups: [
        ["arret de travail", "arret maladie", "certificat", "incapacite de travail", "vous arreter"],
        ["psychoth", "psycholog", "soutien psych", "entretiens de soutien", "therapie", "tcc"],
        ["revoir", "suivi", "rendez vous", "reevalu", "dans deux semaines", "medecin du travail"],
      ],
    },
    communicationCriterion,
  ],
  debrief: {
    diagnosis: "Trouble de l’adaptation avec épuisement professionnel (burnout), sans idée suicidaire",
    summary: "Infirmière de 45 ans qui, depuis une réorganisation de son service il y a trois mois, présente un épuisement, une insomnie d’endormissement avec ruminations, une irritabilité, une distance envers les patients et des troubles de concentration. Le plaisir est conservé hors du travail, l’appétit et le poids sont stables, il n’y a pas d’idée suicidaire : les critères d’un épisode dépressif majeur ne sont pas remplis. Examen et bilan (FSC, TSH, ferritine) normaux.",
    keyFindings: [
      "Facteur de stress identifiable (restructuration) et symptômes apparus dans les trois mois qui suivent.",
      "Épuisement, insomnie, irritabilité, cynisme envers le travail et sentiment d’efficacité réduite.",
      "Humeur réactive, plaisir conservé en dehors du travail, appétit et poids stables, pas d’idée suicidaire ; PHQ-9 à 11/27.",
      "Consommation d’alcool en hausse (un à deux verres par soir) et café en excès ; bon soutien familial.",
      "Pas de cause organique : TSH, FSC et ferritine normales.",
    ],
    redFlags: [
      "Apparition d’idées suicidaires, d’un ralentissement ou d’une perte de plaisir globale : évolution vers un épisode dépressif majeur.",
      "Consommation d’alcool ou de sédatifs qui augmente pour tenir.",
      "Erreurs de soins ou mise en danger au travail.",
    ],
    management: [
      "Reconnaître la souffrance, nommer le lien avec le travail et poser directement la question du suicide.",
      "Arrêt de travail limité dans le temps (par exemple deux semaines), réévalué ; préparer la reprise avec le médecin du travail ou l’employeur.",
      "Soutien psychothérapeutique (entretiens de soutien, thérapie cognitivo-comportementale), hygiène du sommeil, activité physique, réduction de l’alcool et du café.",
      "Pas d’antidépresseur ni d’hypnotique en première intention ; suivi rapproché à une ou deux semaines.",
    ],
    differentials: [
      "Épisode dépressif majeur (perte de plaisir globale, poids, culpabilité, idées suicidaires).",
      "Trouble anxieux généralisé.",
      "Cause organique : hypothyroïdie, anémie ou carence en fer, syndrome d’apnées du sommeil.",
      "Trouble lié à l’usage d’alcool.",
    ],
    sources: [
      { label: "OMS — Burn-out an « occupational phenomenon » (CIM-11)", url: "https://www.who.int/news/item/28-05-2019-burn-out-an-occupational-phenomenon-international-classification-of-diseases" },
      { label: "HAS (2017) — Repérage et prise en charge cliniques du syndrome d’épuisement professionnel ou burnout", url: "https://www.has-sante.fr/jcms/c_2769318/fr/reperage-et-prise-en-charge-cliniques-du-syndrome-d-epuisement-professionnel-ou-burnout" },
      { label: "NICE NG222 (2022) — Depression in adults: treatment and management", url: "https://www.nice.org.uk/guidance/ng222" },
    ],
    pathologySlugs: ["troubles-de-humeur", "troubles-anxieux", "hypothyroidie"],
  },
};

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const troubleAdaptationEpuisementDiagnoses: StationDiagnoses = {
  accepted: ["trouble-adaptation"],
  differentials: [
    d("Épisode dépressif majeur", "episode-depressif-majeur"),
    d("Trouble anxieux", "trouble-anxieux"),
    d("Cause organique (hypothyroïdie, anémie)", "hypothyroidie", "anemie"),
    d("Trouble lié à l’usage d’alcool", "trouble-usage-alcool"),
  ],
};
