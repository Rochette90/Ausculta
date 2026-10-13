import type { DifferentialCard, GridContent, GridRubric, GridSection, GridTab } from "./types.ts";

/**
 * Une grille vit en base sous forme JSON : elle est revalidée à l'écriture
 * (éditeur d'administration) comme à la lecture, pour qu'un contenu mal formé
 * ne casse jamais la page d'entraînement.
 */
export type GridValidation = { ok: true; content: GridContent } | { ok: false; errors: string[] };

// Les ids servent de clés aux grilles sauvegardées dans le navigateur : les
// changer efface les coches en cours. Les anciens ids (`auscC`, `tep_resp`) restent valides.
const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;
const LEVELS = new Set<DifferentialCard["level"]>(["urgent", "high", "mid", "low"]);
const GRID_LIMITS = { text: 2_000, sections: 40, items: 30, criteria: 12, cards: 40, tags: 12 } as const;

type Issues = string[];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown, where: string, issues: Issues, { required = true } = {}): string | undefined {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || (required && !value.trim()) || value.length > GRID_LIMITS.text) {
    issues.push(`${where} : texte manquant ou trop long`);
    return undefined;
  }
  return value.trim() || undefined;
}

function list<T>(value: unknown, where: string, max: number, issues: Issues, read: (entry: unknown, index: number) => T | undefined, min = 1): T[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    issues.push(`${where} : entre ${min} et ${max} éléments attendus`);
    return [];
  }
  return value.map(read).filter((entry): entry is T => entry !== undefined);
}

function rubric(value: unknown, where: string, issues: Issues): GridRubric | undefined {
  if (value === undefined || value === "quality") return value;
  const lines = list(value, `${where}, barème`, 6, issues, (line, index) => text(line, `${where}, barème ${index + 1}`, issues));
  return lines.length ? lines : undefined;
}

function uniqueIds(ids: string[], where: string, issues: Issues) {
  for (const id of ids) if (!ID_PATTERN.test(id)) issues.push(`${where} : identifiant « ${id} » invalide (lettres, chiffres, - ou _)`);
  if (new Set(ids).size !== ids.length) issues.push(`${where} : identifiants en double`);
}

function section(value: unknown, where: string, issues: Issues): GridSection | undefined {
  if (!isRecord(value)) return void issues.push(`${where} : section invalide`);
  const id = String(value.id ?? "");
  const title = text(value.title, `${where}, titre`, issues) ?? "";
  if (value.kind === "judgement") {
    const judged = rubric(value.rubric, where, issues);
    return judged === undefined ? { id, title, kind: "judgement" } : { id, title, kind: "judgement", rubric: judged };
  }
  if (value.kind !== "checklist") return void issues.push(`${where} : type de section inconnu`);
  const items = list(value.items, `${where}, items`, GRID_LIMITS.items, issues, (item, index) => text(item, `${where}, item ${index + 1}`, issues), 2);
  const rule = isRecord(value.rule) ? value.rule : {};
  const yes = Number(rule.yes);
  const partial = Number(rule.partial);
  if (!Number.isInteger(yes) || !Number.isInteger(partial) || partial < 1 || partial >= yes || yes > items.length) {
    issues.push(`${where} : règle impossible (il faut 1 ≤ ± < oui ≤ ${items.length} items)`);
  }
  return { id, title, kind: "checklist", items, rule: { yes, partial } };
}

function tab(value: unknown, where: string, issues: Issues): GridTab {
  const record = isRecord(value) ? value : {};
  if (!isRecord(value)) issues.push(`${where} : onglet manquant`);
  const sections = list(record.sections, `${where}, sections`, GRID_LIMITS.sections, issues, (entry, index) => section(entry, `${where}, section ${index + 1}`, issues));
  uniqueIds(sections.map((entry) => entry.id), where, issues);
  const label = text(record.label, `${where}, nom de l'onglet`, issues) ?? "";
  const alert = text(record.alert, `${where}, alerte`, issues, { required: false });
  return alert ? { label, alert, sections } : { label, sections };
}

function card(value: unknown, where: string, issues: Issues): DifferentialCard | undefined {
  if (!isRecord(value)) return void issues.push(`${where} : carte invalide`);
  const level = value.level as DifferentialCard["level"];
  if (!LEVELS.has(level)) issues.push(`${where} : niveau inconnu`);
  return {
    name: text(value.name, `${where}, nom`, issues) ?? "",
    level,
    levelLabel: text(value.levelLabel, `${where}, étiquette`, issues) ?? "",
    description: text(value.description, `${where}, description`, issues, { required: false }) ?? "",
    tags: list(value.tags ?? [], `${where}, tags`, GRID_LIMITS.tags, issues, (tag, index) => text(tag, `${where}, tag ${index + 1}`, issues), 0),
  };
}

export function validateGridContent(value: unknown): GridValidation {
  const issues: Issues = [];
  const record = isRecord(value) ? value : {};
  const history = tab(record.history, "Anamnèse", issues);
  const exam = tab(record.exam, "Examen", issues);
  const synthesis = isRecord(record.synthesis) ? record.synthesis : {};
  if (!isRecord(record.synthesis)) issues.push("Synthèse : onglet manquant");
  const criteria = list(synthesis.criteria, "Synthèse, critères", GRID_LIMITS.criteria, issues, (entry, index) => {
    const where = `Synthèse, critère ${index + 1}`;
    if (!isRecord(entry)) return void issues.push(`${where} : critère invalide`);
    const judged = rubric(entry.rubric, where, issues);
    const criterion = { id: String(entry.id ?? ""), title: text(entry.title, `${where}, titre`, issues) ?? "" };
    return judged === undefined ? criterion : { ...criterion, rubric: judged };
  });
  uniqueIds(criteria.map((entry) => entry.id), "Synthèse", issues);
  const content: GridContent = {
    history,
    exam,
    synthesis: {
      label: text(synthesis.label, "Synthèse, nom de l'onglet", issues) ?? "",
      criteria,
      cardsLabel: text(synthesis.cardsLabel, "Synthèse, titre des cartes", issues) ?? "",
      cards: list(synthesis.cards ?? [], "Synthèse, cartes", GRID_LIMITS.cards, issues, (entry, index) => card(entry, `Carte ${index + 1}`, issues), 0),
    },
  };
  return issues.length ? { ok: false, errors: issues } : { ok: true, content };
}

/** Squelette d'une nouvelle grille : valide, à compléter dans l'éditeur. */
export function emptyGridContent(): GridContent {
  return {
    history: { label: "Anamnèse", sections: [{ id: "motif", title: "Motif de consultation", kind: "judgement", rubric: "quality" }] },
    exam: { label: "Examen clinique", sections: [{ id: "inspection", title: "Inspection", kind: "judgement", rubric: "quality" }] },
    synthesis: {
      label: "Diagnostic différentiel",
      criteria: [{ id: "resume", title: "Résumé de la situation", rubric: "quality" }],
      cardsLabel: "Diagnostics à cocher si évoqués",
      cards: [],
    },
  };
}
