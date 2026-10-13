import type { EcosMessage, EcosScenario } from "./types.ts";
import { diagnosisByLabel, DIAGNOSIS_BY_ID } from "./diagnosis-catalog.ts";
import { STATION_DIAGNOSES } from "./stations/diagnoses.ts";
import { DIFFERENTIALS_PREFIX, normalizeEcosText } from "./text.ts";

/** Diagnostics différentiels saisis en fin de station (au plus trois). */
export const MAX_DIFFERENTIALS = 3;

/** Ligne du transcript : « Diagnostics différentiels : Embolie pulmonaire ; Péricardite aiguë ». */
export function differentialsLine(ids: readonly string[]): string {
  return `${DIFFERENTIALS_PREFIX}${ids.map((id) => DIAGNOSIS_BY_ID.get(id)?.label ?? id).join(" ; ")}`;
}

/** Le diagnostic principal choisi vaut-il la réponse de la station (entité acceptée ou libellé exact) ? */
export function isAcceptedDiagnosis(scenario: EcosScenario, chosen: string): boolean {
  if (normalizeEcosText(chosen) === normalizeEcosText(scenario.diagnosisChoice.correct)) return true;
  const entry = diagnosisByLabel(chosen);
  return Boolean(entry && STATION_DIAGNOSES[scenario.slug]?.accepted.includes(entry.id));
}

/** Différentiels choisis, mis en regard de ceux du débriefing (hors note). */
export function differentialsReport(scenario: EcosScenario, messages: readonly EcosMessage[]) {
  let line = "";
  for (const message of messages) if (message.role === "student" && message.content.startsWith(DIFFERENTIALS_PREFIX)) line = message.content;
  const chosen = line ? line.slice(DIFFERENTIALS_PREFIX.length).split(" ; ").map((item) => item.trim()).filter(Boolean) : [];
  const chosenIds = new Set(chosen.flatMap((label) => diagnosisByLabel(label)?.id ?? []));
  const expected = (STATION_DIAGNOSES[scenario.slug]?.differentials ?? []).map((item) => ({ label: item.label, found: item.ids.some((id) => chosenIds.has(id)) }));
  const expectedIds = new Set((STATION_DIAGNOSES[scenario.slug]?.differentials ?? []).flatMap((item) => item.ids));
  return { chosen: chosen.map((label) => ({ label, expected: expectedIds.has(diagnosisByLabel(label)?.id ?? "") })), expected };
}
