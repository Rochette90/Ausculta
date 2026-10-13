import type { EcosMessage, EcosScenario } from "./types.ts";
import { ANALYSIS_CRITERION_ID, groupId } from "./scoring.ts";
import { storedReviewFindings } from "./review.ts";
import { ANALYSIS_PREFIX, ANNOUNCE_PREFIX, DIAGNOSIS_PREFIX, DIFFERENTIALS_PREFIX, EXAMINER_PREFIX, FOLLOW_UP_PREFIX, hasAnyKeyword, normalizeEcosText, PLAN_PREFIX, PROCEDURE_PREFIX } from "./text.ts";

/** Ligne de l'entretien au bilan, avec les points de grille qu'elle a fait gagner. */
export type AnnotatedLine = { role: "student" | "patient" | "examiner" | "gesture" | "plan" | "announce"; text: string; criteria: string[] };

/** Ligne calculée à part (examen par les gestes, analyse écrite) : pas d'annotation par mots-clés. */
const NOT_KEYWORD_LINES = new Set(["exam", ANALYSIS_CRITERION_ID]);

/**
 * Entretien relu au bilan : chaque message de l'étudiant porte le libellé des
 * lignes de grille dont il a apporté un élément pour la première fois, selon
 * les mêmes mots-clés que la correction. Calculé sur le serveur : seuls les
 * libellés partent au navigateur, jamais les mots-clés.
 */
export function annotatedInterview(scenario: EcosScenario, messages: readonly EcosMessage[]): AnnotatedLine[] {
  const criteria = scenario.criteria.filter((criterion) => !NOT_KEYWORD_LINES.has(criterion.id));
  const credited = new Set<string>();
  const lines: AnnotatedLine[] = [];
  for (const message of messages) {
    const { content } = message;
    if (message.role === "system") continue;
    if (message.role === "patient") {
      lines.push(content.startsWith(EXAMINER_PREFIX)
        ? { role: "examiner", text: content.slice(EXAMINER_PREFIX.length), criteria: [] }
        : { role: "patient", text: content, criteria: [] });
      continue;
    }
    if ([DIAGNOSIS_PREFIX, ANALYSIS_PREFIX, FOLLOW_UP_PREFIX, DIFFERENTIALS_PREFIX].some((prefix) => content.startsWith(prefix))) continue;
    // Annonce au patient : affichée, jamais créditée (elle suit la révélation des diagnostics proposés).
    if (content.startsWith(ANNOUNCE_PREFIX)) {
      lines.push({ role: "announce", text: content.slice(ANNOUNCE_PREFIX.length), criteria: [] });
      continue;
    }
    if (content.startsWith(PROCEDURE_PREFIX)) {
      lines.push({ role: "gesture", text: content.slice(PROCEDURE_PREFIX.length), criteria: [] });
      continue;
    }
    const isPlan = content.startsWith(PLAN_PREFIX);
    const text = isPlan ? content.slice(PLAN_PREFIX.length) : content;
    const normalized = normalizeEcosText(text);
    const earned: string[] = [];
    for (const criterion of criteria) {
      let found = false;
      criterion.groups.forEach((group, index) => {
        const key = `${criterion.id}:${index}`;
        if (credited.has(key) || !hasAnyKeyword(normalized, group)) return;
        credited.add(key);
        found = true;
      });
      if (found) earned.push(criterion.label);
    }
    lines.push({ role: isPlan ? "plan" : "student", text, criteria: earned });
  }
  // Points accordés par la relecture du modèle : sur la phrase qu'il a citée.
  for (const finding of storedReviewFindings(scenario, messages, "exam")) {
    const criterion = criteria.find((candidate) => candidate.groups.some((group) => groupId(candidate.id, group) === finding.id));
    const quote = normalizeEcosText(finding.quote).trim();
    const line = quote ? lines.find((candidate) => (candidate.role === "student" || candidate.role === "plan") && normalizeEcosText(candidate.text).includes(quote)) : undefined;
    if (!line || !criterion) continue;
    const label = `${criterion.label} (relecture)`;
    if (!line.criteria.includes(criterion.label) && !line.criteria.includes(label)) line.criteria.push(label);
  }
  return lines;
}
