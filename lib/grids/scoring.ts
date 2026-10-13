import type { ChecklistSection, GridMark, GridRubric, PracticeGrid } from "./types.ts";

export const GRID_DURATION_SECONDS = 13 * 60;
export const GRID_WARNING_SECONDS = 2 * 60;

const MARK_POINTS: Record<GridMark, number> = { yes: 2, partial: 1, no: 0 };

const QUALITY_RUBRIC = ["bien = oui", "suffisant = ±", "insuffisant = non"] as const;

/** Note proposée d'après le nombre d'items cochés ; l'évaluateur peut la corriger. */
export function markFromChecked(section: ChecklistSection, checked: number): GridMark {
  if (checked >= section.rule.yes) return "yes";
  if (checked >= section.rule.partial) return "partial";
  return "no";
}

const NUMBERS = ["aucun", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"];
const spell = (n: number) => NUMBERS[n] ?? String(n);

/** Le barème affiché se déduit de la règle : ils ne peuvent plus diverger. */
export function checklistRubric(section: ChecklistSection): string[] {
  const { yes, partial } = section.rule;
  const total = section.items.length;
  return [
    yes === total ? `les ${spell(total)} = oui` : `au moins ${spell(yes)} = oui`,
    yes - 1 === partial ? `${spell(partial)} = ±` : `${spell(partial)} à ${spell(yes - 1)} = ±`,
    partial - 1 === 0 ? "aucun = non" : `aucun à ${spell(partial - 1)} = non`,
  ];
}

export function rubricLines(rubric: GridRubric | undefined): ReadonlyArray<string> {
  if (!rubric) return [];
  return rubric === "quality" ? QUALITY_RUBRIC : rubric;
}

export type GridPart = "history" | "exam" | "synthesis";

export function partMaximum(grid: PracticeGrid, part: GridPart): number {
  const count = part === "synthesis" ? grid.synthesis.criteria.length : grid[part].sections.length;
  return count * MARK_POINTS.yes;
}

export function partScore(marks: Record<string, GridMark | undefined>, ids: ReadonlyArray<string>): number {
  return ids.reduce((sum, id) => sum + MARK_POINTS[marks[id] ?? "no"], 0);
}
