import type { EcosMessage, EcosProcedure, EcosScenario } from "./types.ts";
import { BASIC_EXAMS, EXAM_CATALOG_BY_ID, examCatalogFor, type ExamCatalogItem } from "./exam-catalog.ts";
import { normalizeEcosText, PROCEDURE_PREFIX } from "./text.ts";

/** Entrées du catalogue couvertes par un geste de la station. */
export function procedureCovers(procedure: EcosProcedure): readonly string[] {
  return procedure.covers ?? [procedure.id];
}

/** Entrées qui suffisent à valider le geste. */
function procedureKey(procedure: EcosProcedure): readonly string[] {
  return procedure.key ?? procedureCovers(procedure);
}

/** Result unlocked by a gesture: its own text, or the examiner rule it points to. */
export function procedureResult(scenario: EcosScenario, procedure: EcosProcedure): string {
  if (procedure.result) return procedure.result;
  const rule = scenario.rules.find((candidate) => candidate.examiner && candidate.topic === procedure.topic);
  if (!rule) throw new Error(`Missing result for ${scenario.slug}/${procedure.id}`);
  return rule.reply;
}

/** Examens proposés dans cette station : le catalogue commun, filtré par le sexe et l'âge du patient. */
export function examCatalogForScenario(scenario: EcosScenario): ExamCatalogItem[] {
  return examCatalogFor(scenario.patient);
}

/** Gestes de la station qui couvrent cette entrée du catalogue. */
function coveringProcedures(scenario: EcosScenario, catalogId: string): EcosProcedure[] {
  return scenario.examination.filter((procedure) => procedureCovers(procedure).includes(catalogId));
}

/**
 * Ce que l'examinateur rend pour une entrée du catalogue : le résultat
 * propre au cas, sinon celui du ou des gestes de la station qui la
 * couvrent, sinon le résultat normal. `null` si l'entrée n'est pas
 * proposée pour ce patient.
 */
export function examOrderResult(scenario: EcosScenario, catalogId: string): { item: ExamCatalogItem; result: string; image: EcosProcedure["image"] | null } | null {
  const item = examCatalogForScenario(scenario).find((candidate) => candidate.id === catalogId);
  if (!item) return null;
  const covering = coveringProcedures(scenario, catalogId);
  const specific = scenario.catalogResults?.[catalogId];
  const result = specific
    ?? ([...new Set(covering.map((procedure) => procedureResult(scenario, procedure)))].join(" ") || item.normal);
  const image = covering.find((procedure) => procedure.image)?.image ?? null;
  return { item, result, image };
}

type Order = { label: string; catalogId: string | null; procedure: EcosProcedure | null };

/**
 * Lignes « Geste » du transcript. Une ligne porte le libellé d'une entrée du
 * catalogue ; les anciens transcripts portent celui d'un geste de la station.
 */
function procedureOrders(scenario: EcosScenario, messages: readonly EcosMessage[]): Order[] {
  const byCatalogLabel = new Map([...EXAM_CATALOG_BY_ID.values()].map((item) => [normalizeEcosText(item.label), item.id]));
  const byStationLabel = new Map(scenario.examination.map((procedure) => [normalizeEcosText(procedure.label), procedure]));
  const seen = new Set<string>();
  const orders: Order[] = [];
  for (const message of messages) {
    if (message.role !== "student" || !message.content.startsWith(PROCEDURE_PREFIX)) continue;
    const label = message.content.slice(PROCEDURE_PREFIX.length).trim();
    const normalized = normalizeEcosText(label);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    const catalogId = byCatalogLabel.get(normalized) ?? null;
    const procedure = catalogId ? null : byStationLabel.get(normalized) ?? null;
    if (catalogId || procedure) orders.push({ label, catalogId, procedure });
  }
  return orders;
}

/**
 * Gestes de la station validés par les examens demandés, et examens inutiles.
 * Un examen est inutile s'il n'est couvert par aucun geste attendu, sauf s'il
 * est raisonnable ici (gestes de base, `acceptable`) et que la station ne
 * l'a pas explicitement jugé inutile.
 */
export function resolveExamOrders(scenario: EcosScenario, messages: readonly EcosMessage[]) {
  const satisfied = new Set<EcosProcedure>();
  const unhelpful: string[] = [];
  /** Libellés demandés qui relèvent d'un geste attendu. */
  const expected: string[] = [];
  const acceptable = new Set([...BASIC_EXAMS, ...(scenario.acceptable ?? [])]);
  for (const order of procedureOrders(scenario, messages)) {
    if (order.procedure) {
      satisfied.add(order.procedure);
      if (order.procedure.pertinent) expected.push(order.label);
      else unhelpful.push(order.label);
      continue;
    }
    const catalogId = order.catalogId as string;
    const covering = coveringProcedures(scenario, catalogId);
    for (const procedure of covering) if (procedureKey(procedure).includes(catalogId)) satisfied.add(procedure);
    const isExpected = covering.some((procedure) => procedure.pertinent);
    if (isExpected) expected.push(order.label);
    const judgedUseless = covering.length > 0 && !isExpected;
    if (!isExpected && (judgedUseless || !acceptable.has(catalogId))) unhelpful.push(order.label);
  }
  return { satisfied: [...satisfied], unhelpful, expected };
}
