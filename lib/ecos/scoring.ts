import type { EcosCriterion, EcosCriterionDefinition, EcosMessage } from "./types.ts";
import { DIAGNOSIS_PREFIX, hasAnyKeyword, normalizeEcosText, PROCEDURE_PREFIX } from "./text.ts";

/**
 * Keyword-based grading shared by the live training view and the server.
 * It detects the themes a student addressed; it does not judge whether the
 * clinical decisions were appropriate.
 */
export function calculateEcosCriteria(criteria: readonly EcosCriterionDefinition[], messages: readonly EcosMessage[]): EcosCriterion[] {
  // Gestures and the final diagnosis are graded on their own
  // (lib/ecos/grading.ts): their labels must not earn keyword points.
  const text = normalizeEcosText(
    messages
      .filter((message) => message.role === "student" && !message.content.startsWith(DIAGNOSIS_PREFIX) && !message.content.startsWith(PROCEDURE_PREFIX))
      .map((message) => message.content)
      .join(" | "),
  );

  return criteria.map((criterion) => {
    const matchedGroups = criterion.groups.filter((group) => hasAnyKeyword(text, group)).length;
    const earned = criterion.groups.length <= 1
      ? matchedGroups > 0 ? criterion.points : 0
      : Math.min(criterion.points, Math.round((criterion.points * matchedGroups) / criterion.groups.length));
    return { id: criterion.id, label: criterion.label, hint: criterion.hint, points: criterion.points, earned };
  });
}

export function maxEcosScore(criteria: readonly EcosCriterionDefinition[]): number {
  return criteria.reduce((total, criterion) => total + criterion.points, 0);
}

export function ecosXp(score: number): number {
  return Math.max(20, score * 3);
}

export function scoreEcosTranscript(criteria: readonly EcosCriterionDefinition[], messages: readonly EcosMessage[]) {
  const graded = calculateEcosCriteria(criteria, messages);
  const score = graded.reduce((total, criterion) => total + criterion.earned, 0);
  return { criteria: graded, score, maxScore: maxEcosScore(criteria), xp: ecosXp(score) };
}
