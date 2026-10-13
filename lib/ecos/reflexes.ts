import type { EcosMessage, EcosScenario } from "./types.ts";
import { communicationReport, type EcosCommunicationReport } from "./communication.ts";
import { resolveExamOrders } from "./exam-orders.ts";
import { keywordGroupMatches } from "./scoring.ts";
import { presentationCriterion, treatmentsCriterion } from "./stations/shared.ts";
import { ANALYSIS_PREFIX, ANNOUNCE_PREFIX, DIAGNOSIS_PREFIX, DIFFERENTIALS_PREFIX, FOLLOW_UP_PREFIX, hasKeyword, normalizeEcosText, PLAN_PREFIX, PROCEDURE_PREFIX } from "./text.ts";

/**
 * Réflexes transversaux de l'entretien, suivis d'une station à l'autre :
 * ceux qui rapportent des points à chaque ECOS, quel que soit le cas. Calculés
 * à nouveau depuis les transcripts enregistrés, sans donnée supplémentaire.
 */
type ReflexContext = { scenario: EcosScenario; messages: readonly EcosMessage[]; report: EcosCommunicationReport; questions: number; text: string };

type ReflexDefinition = {
  id: string;
  label: string;
  tip: string;
  /** `null` : sans objet dans cette station (rien à juger). */
  check: (context: ReflexContext) => boolean | null;
};

const groupFound = (context: ReflexContext, criterion: typeof presentationCriterion, index: number) =>
  keywordGroupMatches([criterion], context.messages)[0]?.[index] ?? false;

export const REFLEXES: readonly ReflexDefinition[] = [
  {
    id: "presentation",
    label: "Te présenter",
    tip: "Commence par « Bonjour, je suis … , médecin assistant·e » : un point acquis dès la première phrase.",
    check: (context) => groupFound(context, presentationCriterion, 0),
  },
  {
    id: "open-start",
    label: "Ouvrir par une question ouverte",
    tip: "Première question : « Qu’est-ce qui vous amène ? », puis laisse parler avant de cibler.",
    check: ({ report }) => report.firstQuestion === null ? null : report.firstQuestion === "open",
  },
  {
    id: "medications",
    label: "Demander les traitements",
    tip: "À chaque patient : « Prenez-vous des médicaments régulièrement ? », y compris l’automédication.",
    check: (context) => groupFound(context, treatmentsCriterion, 0),
  },
  {
    id: "allergies",
    label: "Demander les allergies",
    tip: "Enchaîne toujours traitements et allergies : « Êtes-vous allergique à un médicament ? »",
    check: ({ text, questions }) => questions ? hasKeyword(text, "allerg") : null,
  },
  {
    id: "concerns",
    label: "Explorer inquiétudes et attentes",
    tip: "Demande « Qu’est-ce qui vous inquiète le plus ? » et « Qu’attendez-vous de la consultation ? ».",
    check: ({ report, questions }) => questions ? report.behaviours.concerns : null,
  },
  {
    id: "summary",
    label: "Résumer avant l’examen",
    tip: "Avant l’examen clinique, résume en deux phrases : « Si je résume… ». Le patient corrige, tu montres ta synthèse.",
    check: ({ report, questions }) => questions ? report.behaviours.summary : null,
  },
  {
    id: "empathy",
    label: "Accueillir l’émotion",
    tip: "Nomme l’émotion du patient : « Je comprends que ce soit inquiétant. »",
    check: ({ report, questions }) => questions ? report.behaviours.empathy : null,
  },
  {
    id: "understanding",
    label: "Vérifier la compréhension",
    tip: "Termine par « Avez-vous des questions ? » après avoir expliqué la suite.",
    check: ({ report, questions }) => questions ? report.behaviours.understanding : null,
  },
  {
    id: "one-question",
    label: "Une question à la fois",
    tip: "Pose une seule question par message : le patient ne répond qu’à une partie quand tu les enchaînes.",
    check: ({ report, questions }) => questions ? report.stacked.count === 0 : null,
  },
  {
    id: "plain-words",
    label: "Parler sans jargon",
    tip: "Traduis chaque terme médical : « essoufflement » plutôt que « dyspnée ».",
    check: ({ report, questions }) => questions ? report.jargon.length === 0 : null,
  },
  {
    id: "targeted-exams",
    label: "Examens ciblés, sans examen inutile",
    tip: "Avant chaque examen, demande-toi ce qu’il changera à ta décision : chaque examen inutile coûte un demi-point.",
    check: ({ scenario, messages }) => {
      if (!messages.some((message) => message.role === "student" && message.content.startsWith(PROCEDURE_PREFIX))) return null;
      return resolveExamOrders(scenario, messages).unhelpful.length === 0;
    },
  },
];

export type ReflexStat = { id: string; label: string; tip: string; done: number; total: number };

/** Ce que l'étudiant a dit au patient : ni gestes, ni diagnostic, ni analyse écrite. */
function interviewText(messages: readonly EcosMessage[]): string {
  return normalizeEcosText(messages
    .filter((message) => message.role === "student" && ![PROCEDURE_PREFIX, DIAGNOSIS_PREFIX, ANALYSIS_PREFIX, FOLLOW_UP_PREFIX, ANNOUNCE_PREFIX, DIFFERENTIALS_PREFIX].some((prefix) => message.content.startsWith(prefix)))
    .map((message) => message.content.startsWith(PLAN_PREFIX) ? message.content.slice(PLAN_PREFIX.length) : message.content)
    .join(" | "));
}

/** Réflexes acquis sur un ensemble de stations terminées. */
export function reflexStats(stations: ReadonlyArray<{ scenario: EcosScenario; messages: readonly EcosMessage[] }>): ReflexStat[] {
  const contexts = stations.map(({ scenario, messages }) => {
    const report = communicationReport(messages);
    const questions = report.questions.open + report.questions.targeted + report.questions.closed;
    return { scenario, messages, report, questions, text: interviewText(messages) };
  });
  return REFLEXES.map(({ id, label, tip, check }) => {
    const results = contexts.map(check).filter((value): value is boolean => value !== null);
    return { id, label, tip, done: results.filter(Boolean).length, total: results.length };
  });
}

/** Réflexes acquis dans une seule station (pour son XP). */
export function stationReflexCount(scenario: EcosScenario, messages: readonly EcosMessage[]): number {
  return reflexStats([{ scenario, messages }]).reduce((sum, stat) => sum + stat.done, 0);
}

/** Réflexes à travailler en priorité : les plus souvent oubliés (au moins deux stations jugées). */
export function reflexesToWork(stats: readonly ReflexStat[], count = 3): ReflexStat[] {
  return stats
    .filter((stat) => stat.total >= 2 && stat.done / stat.total < 0.67)
    .sort((left, right) => left.done / left.total - right.done / right.total || right.total - left.total)
    .slice(0, count);
}
