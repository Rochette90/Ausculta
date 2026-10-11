import type { EcosCriterion, EcosCriterionDefinition, EcosMessage, EcosProcedure, EcosScenario } from "./types.ts";
import { storedReview } from "./review.ts";
import { calculateEcosCriteria, ecosXp, maxEcosScore } from "./scoring.ts";
import { DIAGNOSIS_PREFIX, normalizeEcosText, PROCEDURE_PREFIX } from "./text.ts";

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
export const DIAGNOSIS_POINTS = 2;
/** Grid line scored from the gestures chosen in the exam phase. */
export const EXAM_CRITERION_ID = "exam";
/** Each unhelpful gesture costs half a point on the exam line. */
const UNHELPFUL_GESTURE_PENALTY = 0.5;

export function stationMaxScore(scenario: EcosScenario): number {
  return maxEcosScore(scenario.criteria) + DIAGNOSIS_POINTS;
}

export function findProcedure(scenario: EcosScenario, id: string): EcosProcedure | null {
  return scenario.examination.find((procedure) => procedure.id === id) ?? null;
}

/** Result unlocked by a gesture: its own text, or the examiner rule it points to. */
export function procedureResult(scenario: EcosScenario, procedure: EcosProcedure): string {
  if (procedure.result) return procedure.result;
  const rule = scenario.rules.find((candidate) => candidate.examiner && candidate.topic === procedure.topic);
  if (!rule) throw new Error(`Missing result for ${scenario.slug}/${procedure.id}`);
  return rule.reply;
}

/** Stable pseudo-random order, so a reload shows the same options. */
function seededOrder(values: readonly string[], seed: string): string[] {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  const next = () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507) >>> 0;
    state = Math.imul(state ^ (state >>> 13), 3266489909) >>> 0;
    state = (state ^ (state >>> 16)) >>> 0;
    return state / 4294967296;
  };
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(next() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function diagnosisOptions(scenario: EcosScenario, seed: string): string[] {
  return seededOrder([scenario.diagnosisChoice.correct, ...scenario.diagnosisChoice.distractors], seed);
}

function studentLines(messages: readonly EcosMessage[], prefix: string) {
  return messages
    .filter((message) => message.role === "student" && message.content.startsWith(prefix))
    .map((message) => message.content.slice(prefix.length).trim());
}

/** Last diagnosis chosen by the student, if any. */
export function chosenDiagnosis(messages: readonly EcosMessage[]): string | null {
  return studentLines(messages, DIAGNOSIS_PREFIX).at(-1) ?? null;
}

export function performedProcedures(scenario: EcosScenario, messages: readonly EcosMessage[]): EcosProcedure[] {
  const labels = new Set(studentLines(messages, PROCEDURE_PREFIX).map(normalizeEcosText));
  return scenario.examination.filter((procedure) => labels.has(normalizeEcosText(procedure.label)));
}

/**
 * Exam line: share of the expected gestures that were chosen, minus half a
 * point per unhelpful gesture (choosing everything is not a strategy).
 */
export function examCriterion(scenario: EcosScenario, definition: EcosCriterionDefinition, performed: readonly EcosProcedure[]): EcosCriterion {
  const expected = scenario.examination.filter((procedure) => procedure.pertinent).length;
  const done = performed.filter((procedure) => procedure.pertinent).length;
  const unhelpful = performed.length - done;
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
    points: DIAGNOSIS_POINTS,
    earned: chosen !== null && normalizeEcosText(chosen) === normalizeEcosText(correct) ? DIAGNOSIS_POINTS : 0,
  };
  const performed = performedProcedures(scenario, messages);
  const performedIds = new Set(performed.map((procedure) => procedure.id));
  // An expected test ordered in the exam phase (hémocultures, angio-CT…) also
  // counts on the management lines; unhelpful gestures never earn keyword points.
  const expectedGestures = performed.filter((procedure) => procedure.pertinent).map((procedure) => ({ role: "student" as const, content: procedure.label }));
  const reviewed = storedReview(scenario, messages, EXAM_CRITERION_ID);
  const keywordCriteria = calculateEcosCriteria(scenario.criteria, [...messages, ...expectedGestures], reviewed ?? undefined);
  const criteria = [
    ...scenario.criteria.map((definition, index) => definition.id === EXAM_CRITERION_ID ? examCriterion(scenario, definition, performed) : keywordCriteria[index]),
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
      unhelpful: performed.filter((procedure) => !procedure.pertinent).map((procedure) => procedure.label),
    },
  };
}
