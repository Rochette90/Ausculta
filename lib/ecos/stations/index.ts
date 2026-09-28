import type { EcosScenario, EcosStationView } from "../types.ts";
import { stationMaxScore } from "../grading.ts";
import { EXAM_DURATION_SECONDS } from "../timing.ts";
import { acidocetoseDiabetique } from "./acidocetose-diabetique.ts";
import { appendiciteAigue } from "./appendicite-aigue.ts";
import { avcIschemiqueSylvienGauche } from "./avc-ischemique-sylvien-gauche.ts";
import { criseAsthme } from "./crise-asthme.ts";
import { douleurThoraciqueAigue } from "./douleur-thoracique-aigue.ts";
import { emboliePulmonairePostVoyage } from "./embolie-pulmonaire-post-voyage.ts";
import { endocarditeInfectieuse } from "./endocardite-infectieuse.ts";
import { fibrillationAuriculaire } from "./fibrillation-auriculaire.ts";
import { meningiteAigue } from "./meningite-aigue.ts";
import { pancreatiteAigue } from "./pancreatite-aigue.ts";
import { pneumonieCommunautaire } from "./pneumonie-communautaire.ts";
import { pneumothoraxSpontane } from "./pneumothorax-spontane.ts";

/**
 * Scripted ECOS stations. A station is playable only when it is listed here
 * AND its `clinical_cases` row is published: the database keeps the editorial
 * switch, this registry holds the patient script, the grid and the debrief.
 * Import this module from server code only: it contains the answers.
 */
export const ECOS_SCENARIOS: readonly EcosScenario[] = [
  douleurThoraciqueAigue,
  fibrillationAuriculaire,
  avcIschemiqueSylvienGauche,
  meningiteAigue,
  pneumonieCommunautaire,
  pneumothoraxSpontane,
  emboliePulmonairePostVoyage,
  appendiciteAigue,
  pancreatiteAigue,
  acidocetoseDiabetique,
  endocarditeInfectieuse,
  criseAsthme,
];

/**
 * Neutral public identifiers used in URLs and in the browser. The internal
 * slugs name the diagnosis (`meningite-aigue`), which would spoil the station.
 * Never renumber an existing station: bookmarks and history rely on it.
 */
const PUBLIC_CODES: Readonly<Record<string, string>> = {
  "douleur-thoracique-aigue": "station-01",
  "fibrillation-auriculaire": "station-02",
  "avc-ischemique-sylvien-gauche": "station-03",
  "meningite-aigue": "station-04",
  "pneumonie-communautaire": "station-05",
  "pneumothorax-spontane": "station-06",
  "embolie-pulmonaire-post-voyage": "station-07",
  "appendicite-aigue": "station-08",
  "pancreatite-aigue": "station-09",
  "acidocetose-diabetique": "station-10",
  "endocardite-infectieuse": "station-11",
  "crise-asthme": "station-12",
};

const bySlug = new Map(ECOS_SCENARIOS.map((scenario) => [scenario.slug, scenario]));
const byCode = new Map(ECOS_SCENARIOS.map((scenario) => [PUBLIC_CODES[scenario.slug], scenario]));

export function getEcosScenario(slug: string): EcosScenario | null {
  return bySlug.get(slug) ?? null;
}

export function hasEcosScenario(slug: string): boolean {
  return bySlug.has(slug);
}

export function ecosPublicCode(slug: string): string | null {
  return bySlug.has(slug) ? PUBLIC_CODES[slug] ?? null : null;
}

/** Resolves a public code, or a legacy slug still present in old links. */
export function resolveEcosStation(identifier: string): { scenario: EcosScenario; code: string; legacy: boolean } | null {
  const fromCode = byCode.get(identifier);
  if (fromCode) return { scenario: fromCode, code: identifier, legacy: false };
  const fromSlug = bySlug.get(identifier);
  const code = fromSlug ? PUBLIC_CODES[fromSlug.slug] : undefined;
  return fromSlug && code ? { scenario: fromSlug, code, legacy: true } : null;
}

/** Everything the browser needs before and during the station, nothing more. */
export function ecosStationView(
  scenario: EcosScenario,
  details: { candidateTitle: string; specialty: string | null },
): EcosStationView {
  return {
    code: PUBLIC_CODES[scenario.slug],
    candidateTitle: details.candidateTitle,
    specialty: details.specialty,
    patientLabel: `${scenario.patient.name}, ${scenario.patient.age} ans`,
    setting: scenario.setting,
    brief: scenario.brief,
    // Alphabetical: the source lists the expected gestures first.
    procedures: scenario.examination
      .map(({ id, label, category }) => ({ id, label, category }))
      .sort((left, right) => left.label.localeCompare(right.label, "fr")),
    maxScore: stationMaxScore(scenario),
    examDurationSeconds: EXAM_DURATION_SECONDS,
  };
}
