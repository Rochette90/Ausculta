import type { EcosCriterion, EcosCriterionDefinition, EcosMessage, EcosProcedure, EcosScenario } from "./types.ts";
import { storedReview } from "./review.ts";
import { ANALYSIS_CRITERION_ID, calculateEcosCriteria, ecosXp, maxEcosScore } from "./scoring.ts";
import { DIAGNOSIS_PREFIX } from "./text.ts";
import { procedureResult, resolveExamOrders } from "./exam-orders.ts";
import { isAcceptedDiagnosis } from "./differentials.ts";

export { procedureResult };

/**
 * Transcript enregistré relu depuis la base : seuls les messages bien formés
 * sont gardés, pour qu'une ligne abîmée ne bloque pas la réouverture du bilan.
 */
export function storedTranscript(value: unknown): EcosMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is EcosMessage => {
    const message = item as { role?: unknown; content?: unknown } | null;
    return typeof message?.content === "string" && (message.role === "student" || message.role === "patient" || message.role === "system");
  });
}

/** Points of the final diagnosis line, added to every station's grid. */
const DIAGNOSIS_POINTS = 2;
/** Grid line scored from the gestures chosen in the exam phase. */
export const EXAM_CRITERION_ID = "exam";
/** Each unhelpful gesture costs half a point on the exam line. */
const UNHELPFUL_GESTURE_PENALTY = 0.5;

function diagnosisPoints(scenario: EcosScenario): number {
  return scenario.diagnosisPoints ?? DIAGNOSIS_POINTS;
}

export function stationMaxScore(scenario: EcosScenario): number {
  return maxEcosScore(scenario.criteria) + diagnosisPoints(scenario);
}

/** La station a-t-elle une étape « Analyse » des examens complémentaires ? */
export function hasAnalysisStep(scenario: EcosScenario): boolean {
  return scenario.criteria.some((criterion) => criterion.id === ANALYSIS_CRITERION_ID);
}


function studentLines(messages: readonly EcosMessage[], prefix: string) {
  return messages
    .filter((message) => message.role === "student" && message.content.startsWith(prefix))
    .map((message) => message.content.slice(prefix.length).trim());
}

/** Last diagnosis chosen by the student, if any. */
function chosenDiagnosis(messages: readonly EcosMessage[]): string | null {
  return studentLines(messages, DIAGNOSIS_PREFIX).at(-1) ?? null;
}

/**
 * Exam line: share of the expected gestures that were chosen, minus half a
 * point per unhelpful test or gesture (choosing everything is not a strategy).
 */
function examCriterion(scenario: EcosScenario, definition: EcosCriterionDefinition, performed: readonly EcosProcedure[], unhelpful: number): EcosCriterion {
  const expected = scenario.examination.filter((procedure) => procedure.pertinent).length;
  const done = performed.filter((procedure) => procedure.pertinent).length;
  const raw = expected ? (definition.points * done) / expected - UNHELPFUL_GESTURE_PENALTY * unhelpful : 0;
  return {
    id: definition.id,
    label: definition.label,
    hint: `${definition.hint}. Chaque geste peu utile coûte un demi-point.`,
    points: definition.points,
    earned: Math.max(0, Math.min(definition.points, Math.round(raw))),
  };
}

/**
 * Full server-side grading: the keyword grid (history, exam, plan,
 * communication) plus the final diagnosis, and feedback on the gestures.
 * A review stored with the transcript (lib/ecos/review.ts) adds the grid
 * items the model found phrased differently.
 */
export function gradeEcosStation(scenario: EcosScenario, messages: readonly EcosMessage[]) {
  const chosen = chosenDiagnosis(messages);
  const correct = scenario.diagnosisChoice.correct;
  const diagnosisCriterion: EcosCriterion = {
    id: "diagnosis",
    label: "Pose le diagnostic",
    hint: "Hypothèse diagnostique principale, étayée par l’anamnèse et l’examen",
    points: diagnosisPoints(scenario),
    // Saisi dans la liste commune : l'entité clinique suffit (`lib/ecos/stations/diagnoses.ts`).
    earned: chosen !== null && isAcceptedDiagnosis(scenario, chosen) ? diagnosisPoints(scenario) : 0,
  };
  const { satisfied: performed, unhelpful } = resolveExamOrders(scenario, messages);
  const performedIds = new Set(performed.map((procedure) => procedure.id));
  // An expected test ordered in the exam phase (hémocultures, angio-CT…) also
  // counts on the management lines; unhelpful gestures never earn keyword points.
  const expectedGestures = performed.filter((procedure) => procedure.pertinent).map((procedure) => ({ role: "student" as const, content: procedure.label }));
  const reviewed = storedReview(scenario, messages, EXAM_CRITERION_ID);
  const keywordCriteria = calculateEcosCriteria(scenario.criteria, [...messages, ...expectedGestures], reviewed ?? undefined);
  // Une analyse n'a de valeur que sur des examens réellement demandés.
  const analysedSomething = performed.some((procedure) => procedure.pertinent && procedure.category === "complementaire");
  const criteria = [
    ...scenario.criteria.map((definition, index) => {
      if (definition.id === EXAM_CRITERION_ID) return examCriterion(scenario, definition, performed, unhelpful.length);
      if (definition.id === ANALYSIS_CRITERION_ID && !analysedSomething) {
        return { id: definition.id, label: definition.label, hint: `${definition.hint}. Sans examen complémentaire utile demandé, il n’y a rien à analyser.`, points: definition.points, earned: 0 };
      }
      return keywordCriteria[index];
    }),
    diagnosisCriterion,
  ];
  const score = criteria.reduce((total, criterion) => total + criterion.earned, 0);
  return {
    criteria,
    score,
    maxScore: stationMaxScore(scenario),
    xp: ecosXp(score),
    synthesis: { chosen, correct },
    /** La grille a-t-elle été relue par le modèle, et combien de points cette relecture a-t-elle ajoutés ? */
    review: { done: reviewed !== null, added: criteria.reduce((total, criterion) => total + (criterion.reviewed ?? 0), 0) },
    procedures: {
      missed: scenario.examination.filter((procedure) => procedure.pertinent && !performedIds.has(procedure.id)).map((procedure) => procedure.label),
      unhelpful,
    },
  };
}
