import type { EcosCriterion, EcosCriterionDefinition, EcosMessage } from "./types.ts";
import { ANALYSIS_PREFIX, DIAGNOSIS_PREFIX, hasAnyKeyword, normalizeEcosText, PROCEDURE_PREFIX } from "./text.ts";

/**
 * Ligne de la grille notée sur la seule analyse écrite des examens
 * complémentaires : une station qui l'a propose l'étape « Analyse ».
 */
export const ANALYSIS_CRITERION_ID = "analysis";

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

/** Texte de l'étudiant lu par les mots-clés : ni gestes, ni diagnostic final, ni analyse écrite. */
function keywordText(messages: readonly EcosMessage[]): string {
  // Gestures and the final diagnosis are graded on their own
  // (lib/ecos/grading.ts): their labels must not earn keyword points.
  return normalizeEcosText(
    messages
      .filter((message) => message.role === "student" && ![DIAGNOSIS_PREFIX, PROCEDURE_PREFIX, ANALYSIS_PREFIX].some((prefix) => message.content.startsWith(prefix)))
      .map((message) => message.content)
      .join(" | "),
  );
}

/** Analyse écrite des examens, seule lue par la ligne `analysis` de la grille. */
function analysisText(messages: readonly EcosMessage[]): string {
  return normalizeEcosText(
    messages
      .filter((message) => message.role === "student" && message.content.startsWith(ANALYSIS_PREFIX))
      .map((message) => message.content.slice(ANALYSIS_PREFIX.length))
      .join(" | "),
  );
}

/** Groupes de chaque critère trouvés par les mots-clés. */
export function keywordGroupMatches(criteria: readonly EcosCriterionDefinition[], messages: readonly EcosMessage[]): boolean[][] {
  const text = keywordText(messages);
  const analysis = analysisText(messages);
  return criteria.map((criterion) => criterion.groups.map((group) => hasAnyKeyword(criterion.id === ANALYSIS_CRITERION_ID ? analysis : text, group)));
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
