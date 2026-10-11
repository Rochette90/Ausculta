import type { EcosCriterion, EcosCriterionDefinition, EcosMessage } from "./types.ts";
import { DIAGNOSIS_PREFIX, hasAnyKeyword, normalizeEcosText, PROCEDURE_PREFIX } from "./text.ts";

/**
 * Identifiant stable d'un élément de la grille : le critère et une empreinte
 * de ses mots-clés. Réordonner les groupes d'une station ne déplace pas une
 * relecture enregistrée ; modifier un groupe l'invalide pour ce seul élément.
 */
export function groupId(criterionId: string, group: readonly string[]): string {
  let hash = 2166136261;
  for (const char of group.join("|")) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return `${criterionId}.${hash.toString(36)}`;
}

/** Texte de l'étudiant lu par les mots-clés : ni gestes, ni diagnostic final. */
export function keywordText(messages: readonly EcosMessage[]): string {
  // Gestures and the final diagnosis are graded on their own
  // (lib/ecos/grading.ts): their labels must not earn keyword points.
  return normalizeEcosText(
    messages
      .filter((message) => message.role === "student" && !message.content.startsWith(DIAGNOSIS_PREFIX) && !message.content.startsWith(PROCEDURE_PREFIX))
      .map((message) => message.content)
      .join(" | "),
  );
}

/** Groupes de chaque critère trouvés par les mots-clés. */
export function keywordGroupMatches(criteria: readonly EcosCriterionDefinition[], messages: readonly EcosMessage[]): boolean[][] {
  const text = keywordText(messages);
  return criteria.map((criterion) => criterion.groups.map((group) => hasAnyKeyword(text, group)));
}

function earnedPoints(criterion: EcosCriterionDefinition, matchedGroups: number): number {
  return criterion.groups.length <= 1
    ? matchedGroups > 0 ? criterion.points : 0
    : Math.min(criterion.points, Math.round((criterion.points * matchedGroups) / criterion.groups.length));
}

/**
 * Keyword-based grading shared by the live training view and the server.
 * It detects the themes a student addressed; it does not judge whether the
 * clinical decisions were appropriate. `reviewed` holds the grid items
 * (`groupId`) that the model found phrased differently: they count too.
 */
export function calculateEcosCriteria(
  criteria: readonly EcosCriterionDefinition[],
  messages: readonly EcosMessage[],
  reviewed: ReadonlySet<string> = new Set(),
): EcosCriterion[] {
  const matches = keywordGroupMatches(criteria, messages);
  return criteria.map((criterion, index) => {
    const byKeyword = matches[index].filter(Boolean).length;
    const withReview = matches[index].filter((matched, group) => matched || reviewed.has(groupId(criterion.id, criterion.groups[group]))).length;
    const earned = earnedPoints(criterion, withReview);
    const result: EcosCriterion = { id: criterion.id, label: criterion.label, hint: criterion.hint, points: criterion.points, earned };
    const added = earned - earnedPoints(criterion, byKeyword);
    if (added > 0) result.reviewed = added;
    return result;
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
