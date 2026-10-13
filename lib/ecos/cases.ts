import "server-only";

import { cache } from "react";
import caseCatalog from "@/content/cases/index.json";
import { SLUG_PATTERN } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/server";
import { ecosPublicCode, hasEcosScenario } from "./stations/index.ts";
import { EXAM_DURATION_SECONDS } from "./timing.ts";

/**
 * Catalog card of a station, safe to send to the browser. Neither the
 * diagnosis nor the internal slug (which names it) is included: the station is
 * addressed by a neutral public code and the diagnosis is only revealed by the
 * debrief, after the server has graded the station.
 */
export type ClinicalCaseSummary = {
  /** Public code (`station-04`), or null for a draft without patient script. */
  code: string | null;
  candidateTitle: string;
  specialty: string | null;
  difficulty: "easy" | "medium" | "hard";
  published: boolean;
  patientLabel: string | null;
  setting: string | null;
  duration: string;
  tags: string[];
};

type CaseRow = {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  status: string;
  patient: { label?: string } | null;
  scenario: { setting?: string; tags?: string[]; candidate_title?: string } | null;
  specialties: { name: string } | null;
};

const editorialTitles = new Map(caseCatalog.map((item) => [item.slug, item.candidateTitle]));
const STATION_DURATION = `${Math.round(EXAM_DURATION_SECONDS / 60)} min`;

/** Titre vu par le candidat pour une station, à partir de son nom interne. */
export function stationCandidateTitle(slug: string): string | null {
  return editorialTitles.get(slug) ?? null;
}

function fallbackCandidateTitle(setting: string | undefined) {
  if (setting?.toLocaleLowerCase("fr").includes("urgence")) return "Consultation aux urgences";
  if (setting?.toLocaleLowerCase("fr").includes("cabinet")) return "Consultation au cabinet";
  return "Situation clinique à analyser";
}

function toSummary(row: CaseRow): ClinicalCaseSummary {
  return {
    code: ecosPublicCode(row.slug),
    candidateTitle: row.scenario?.candidate_title?.trim()
      || editorialTitles.get(row.slug)
      || fallbackCandidateTitle(row.scenario?.setting),
    specialty: row.specialties?.name ?? null,
    difficulty: row.difficulty,
    // Publié en base ET doté d'un patient simulé scripté.
    published: row.status === "published" && hasEcosScenario(row.slug),
    patientLabel: row.patient?.label ?? null,
    setting: row.scenario?.setting ?? null,
    duration: STATION_DURATION,
    tags: row.scenario?.tags ?? [],
  };
}

const CASE_COLUMNS = "slug, title, difficulty, status, patient, scenario, specialties(name)";

// Le catalogue affiche aussi les stations en préparation (status draft),
// que la policy RLS masque volontairement : lecture via le client admin,
// limitée à des champs non sensibles.
/** Codes publics des stations déjà menées à terme par ce compte (pour le catalogue). */
export async function getCompletedStationCodes(userId: string): Promise<Set<string>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ecos_sessions")
    .select("station_slug")
    .eq("user_id", userId)
    .eq("status", "completed");
  if (error) throw error;
  const codes = new Set<string>();
  for (const row of data ?? []) {
    const code = ecosPublicCode(String(row.station_slug));
    if (code) codes.add(code);
  }
  return codes;
}

export const getClinicalCaseCatalog = cache(async (): Promise<ClinicalCaseSummary[]> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clinical_cases")
    .select(CASE_COLUMNS)
    .neq("status", "archived")
    .order("status", { ascending: false })
    .order("title");
  if (error) throw error;
  return ((data ?? []) as unknown as CaseRow[])
    .map(toSummary)
    .sort((left, right) => Number(right.published) - Number(left.published));
});

/**
 * `slug` is the internal station slug. Read with the service role: authenticated
 * clients can no longer select `title` or `scenario`, which name the diagnosis.
 */
export async function getPublishedClinicalCase(slug: string): Promise<ClinicalCaseSummary | null> {
  if (!SLUG_PATTERN.test(slug) || !hasEcosScenario(slug)) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clinical_cases")
    .select(CASE_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data ? toSummary(data as unknown as CaseRow) : null;
}
