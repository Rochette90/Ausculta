import "server-only";
import { SUPPORTED_ECOS_SLUG } from "./timing";

import { cache } from "react";
import caseCatalog from "@/content/cases/index.json";
import { SLUG_PATTERN } from "@/lib/validation";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type ClinicalCaseSummary = {
  slug: string;
  candidateTitle: string;
  diagnosis: string | null;
  specialty: string | null;
  difficulty: "easy" | "medium" | "hard";
  published: boolean;
  patientLabel: string | null;
  setting: string | null;
  duration: string | null;
  tags: string[];
};

type CaseRow = {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  status: string;
  patient: { label?: string } | null;
  scenario: { setting?: string; duration?: string; tags?: string[]; candidate_title?: string; diagnosis?: string } | null;
  specialties: { name: string } | null;
};

const editorialDetails = new Map(caseCatalog.map((item) => [item.slug, {
  candidateTitle: item.candidateTitle,
  diagnosis: item.diagnosis,
}]));

function fallbackCandidateTitle(setting: string | undefined) {
  if (setting?.toLocaleLowerCase("fr").includes("urgence")) return "Consultation aux urgences";
  if (setting?.toLocaleLowerCase("fr").includes("cabinet")) return "Consultation au cabinet";
  return "Situation clinique à analyser";
}

function toSummary(row: CaseRow): ClinicalCaseSummary {
  const details = editorialDetails.get(row.slug);
  return {
    slug: row.slug,
    candidateTitle: row.scenario?.candidate_title?.trim()
      || details?.candidateTitle
      || fallbackCandidateTitle(row.scenario?.setting),
    diagnosis: row.scenario?.diagnosis?.trim() || details?.diagnosis || null,
    specialty: row.specialties?.name ?? null,
    difficulty: row.difficulty,
    published: row.status === "published" && row.slug === SUPPORTED_ECOS_SLUG,
    patientLabel: row.patient?.label ?? null,
    setting: row.scenario?.setting ?? null,
    duration: row.scenario?.duration ?? null,
    tags: row.scenario?.tags ?? [],
  };
}

// Le catalogue affiche aussi les stations en préparation (status draft),
// que la policy RLS masque volontairement : lecture via le client admin,
// limitée à des champs non sensibles.
export const getClinicalCaseCatalog = cache(async (): Promise<ClinicalCaseSummary[]> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clinical_cases")
    .select("slug, title, difficulty, status, patient, scenario, specialties(name)")
    .neq("status", "archived")
    .order("status", { ascending: false })
    .order("title");
  if (error) throw error;
  return ((data ?? []) as unknown as CaseRow[]).map(toSummary);
});

export async function getPublishedClinicalCase(slug: string): Promise<ClinicalCaseSummary | null> {
  if (!SLUG_PATTERN.test(slug) || slug !== SUPPORTED_ECOS_SLUG) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_cases")
    .select("slug, title, difficulty, status, patient, scenario, specialties(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data ? toSummary(data as unknown as CaseRow) : null;
}
