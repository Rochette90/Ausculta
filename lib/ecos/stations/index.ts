import type { EcosScenario, EcosStationView } from "../types.ts";
import { patientLabel } from "../text.ts";
import { hasAnalysisStep, stationMaxScore } from "../grading.ts";
import { EXAM_DURATION_SECONDS } from "../timing.ts";
import { examCatalogForScenario } from "../exam-orders.ts";
import { acidocetoseDiabetique } from "./acidocetose-diabetique.ts";
import { appendiciteAigue } from "./appendicite-aigue.ts";
import { avcIschemiqueSylvienGauche } from "./avc-ischemique-sylvien-gauche.ts";
import { cholecystiteAigue } from "./cholecystite-aigue.ts";
import { coliqueNephretique } from "./colique-nephretique.ts";
import { convulsionFebrile } from "./convulsion-febrile.ts";
import { criseAsthme } from "./crise-asthme.ts";
import { douleurThoraciqueAigue } from "./douleur-thoracique-aigue.ts";
import { emboliePulmonairePostVoyage } from "./embolie-pulmonaire-post-voyage.ts";
import { endocarditeInfectieuse } from "./endocardite-infectieuse.ts";
import { erysipeleJambe } from "./erysipele-jambe.ts";
import { fibrillationAuriculaire } from "./fibrillation-auriculaire.ts";
import { fractureChevilleWeberB } from "./fracture-cheville-weber-b.ts";
import { fractureColFemoral } from "./fracture-col-femoral.ts";
import { hemorragieSousArachnoidienne } from "./hemorragie-sous-arachnoidienne.ts";
import { humeurDepressiveIdeesSuicidaires } from "./humeur-depressive-idees-suicidaires.ts";
import { insuffisanceCardiaqueDecompensee } from "./insuffisance-cardiaque-decompensee.ts";
import { meningiteAigue } from "./meningite-aigue.ts";
import { pancreatiteAigue } from "./pancreatite-aigue.ts";
import { pneumonieCommunautaire } from "./pneumonie-communautaire.ts";
import { pneumothoraxSpontane } from "./pneumothorax-spontane.ts";
import { pyelonephriteAigue } from "./pyelonephrite-aigue.ts";
import { ruptureLigamentCroiseAnterieur } from "./rupture-ligament-croise-anterieur.ts";
import { MOCK_CODES, MOCK_STATIONS } from "./mock/index.ts";

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
  humeurDepressiveIdeesSuicidaires,
  convulsionFebrile,
  erysipeleJambe,
  cholecystiteAigue,
  coliqueNephretique,
  hemorragieSousArachnoidienne,
  pyelonephriteAigue,
  insuffisanceCardiaqueDecompensee,
  ruptureLigamentCroiseAnterieur,
  fractureColFemoral,
  fractureChevilleWeberB,
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
  "humeur-depressive-idees-suicidaires": "station-13",
  "convulsion-febrile": "station-14",
  "erysipele-jambe": "station-15",
  "cholecystite-aigue": "station-16",
  "colique-nephretique": "station-17",
  "hemorragie-sous-arachnoidienne": "station-18",
  "pyelonephrite-aigue": "station-19",
  "insuffisance-cardiaque-decompensee": "station-20",
  "rupture-ligament-croise-anterieur": "station-21",
  "fracture-col-femoral": "station-22",
  "fracture-cheville-weber-b": "station-23",
};

/**
 * Fiches citées par le débriefing d'au moins une station. Quand le catalogue
 * de fiches est masqué, ce sont les seules fiches encore lisibles. L'ensemble
 * est global : il ne dit pas quelle fiche appartient à quelle station.
 */
export const STATION_FICHE_SLUGS: ReadonlySet<string> = new Set(
  ECOS_SCENARIOS.flatMap((scenario) => scenario.debrief.pathologySlugs),
);

/** Stations réservées à l'examen blanc (`./mock/`) : hors catalogue et hors `/cas`. */
export const MOCK_SCENARIOS: readonly EcosScenario[] = MOCK_STATIONS.map((station) => station.scenario);

/** Toutes les stations jouables, entraînement et examen blanc (tests, administration). */
export const ALL_ECOS_SCENARIOS: readonly EcosScenario[] = [...ECOS_SCENARIOS, ...MOCK_SCENARIOS];

const bySlug = new Map(ALL_ECOS_SCENARIOS.map((scenario) => [scenario.slug, scenario]));
const byCode = new Map(ECOS_SCENARIOS.map((scenario) => [PUBLIC_CODES[scenario.slug], scenario]));
const mockByCode = new Map(MOCK_SCENARIOS.map((scenario) => [MOCK_CODES[scenario.slug], scenario]));
const mockSlugs = new Set(MOCK_SCENARIOS.map((scenario) => scenario.slug));

function publicCode(slug: string): string | undefined {
  return Object.hasOwn(PUBLIC_CODES, slug) ? PUBLIC_CODES[slug] : Object.hasOwn(MOCK_CODES, slug) ? MOCK_CODES[slug] : undefined;
}

export function getEcosScenario(slug: string): EcosScenario | null {
  return bySlug.get(slug) ?? null;
}

export function hasEcosScenario(slug: string): boolean {
  return bySlug.has(slug);
}

export function ecosPublicCode(slug: string): string | null {
  return bySlug.has(slug) ? publicCode(slug) ?? null : null;
}

/** Station réservée à l'examen blanc ? */
export function isMockStation(slug: string): boolean {
  return mockSlugs.has(slug);
}

/** Station d'examen blanc depuis son code public (`blanc-03`) ; jamais une station d'entraînement. */
export function resolveMockStation(code: string): EcosScenario | null {
  return mockByCode.get(code) ?? null;
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
/**
 * Feuille de porte de la station, comme au vrai ECOS : qui, où, pour quel
 * motif, en mots de patient. Elle sert de titre partout où l'étudiant choisit
 * une station : ni diagnostic, ni spécialité.
 */
export function ecosDoorNote(scenario: EcosScenario): string {
  return scenario.brief[1] ?? scenario.brief[0] ?? "";
}

export function ecosStationView(
  scenario: EcosScenario,
  details: { candidateTitle: string; specialty: string | null },
): EcosStationView {
  return {
    code: publicCode(scenario.slug) ?? "",
    candidateTitle: details.candidateTitle,
    specialty: details.specialty,
    patientLabel: patientLabel(scenario.patient),
    setting: scenario.setting,
    brief: scenario.brief,
    // Catalogue commun à toutes les stations (filtré par le sexe et l'âge du
    // patient) : la liste ne dit plus quels examens la station attend.
    procedures: examCatalogForScenario(scenario)
      .map(({ id, label, category, group }) => ({ id, label, category, group }))
      .sort((left, right) => left.label.localeCompare(right.label, "fr")),
    analysis: hasAnalysisStep(scenario),
    maxScore: stationMaxScore(scenario),
    examDurationSeconds: EXAM_DURATION_SECONDS,
  };
}
