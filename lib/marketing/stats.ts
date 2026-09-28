import "server-only";

import { cache } from "react";
import { createAdminClient } from "../supabase/server";
import pathologyCatalog from "@/content/pathologies/index.json";
import questionCatalog from "@/content/questions/index.json";
import caseCatalog from "@/content/cases/index.json";

export type MarketingStats = {
  specialtyCount: number;
  pathologyCount: number;
  questionCount: number;
  caseCount: number;
  specialties: Array<{ name: string; pathologyCount: number }>;
};

// Repli hors-ligne calculé depuis les catalogues embarqués : une seule
// source de vérité locale, jamais de chiffres codés en dur.
function buildFallback(): MarketingStats {
  const ready = (pathologyCatalog as Array<{ specialty: string; status: string }>)
    .filter((item) => item.status === "ready");
  const bySpecialty = new Map<string, number>();
  for (const item of ready) {
    bySpecialty.set(item.specialty, (bySpecialty.get(item.specialty) ?? 0) + 1);
  }
  const specialties = [...bySpecialty.entries()]
    .map(([name, pathologyCount]) => ({ name, pathologyCount }))
    .sort((first, second) => first.name.localeCompare(second.name, "fr-CH"));
  return {
    specialtyCount: specialties.length,
    pathologyCount: ready.length,
    questionCount: questionCatalog.length,
    caseCount: caseCatalog.length,
    specialties,
  };
}

const fallback = buildFallback();
export const getMarketingStats = cache(async (): Promise<MarketingStats> => {
  try {
    const admin = createAdminClient();
    const [specialtiesResult, pathologiesResult, questionsResult, casesResult] = await Promise.all([
      admin.from("specialties").select("id, name, order_index").order("order_index"),
      admin.from("pathologies").select("specialty_id").eq("is_published", true),
      admin.from("questions").select("id", { count: "exact", head: true }).eq("is_published", true),
      admin.from("clinical_cases").select("id", { count: "exact", head: true }).eq("status", "published"),
    ]);
    if (specialtiesResult.error || pathologiesResult.error || questionsResult.error || casesResult.error) return fallback;
    const pathologies = pathologiesResult.data ?? [];
    const specialties = (specialtiesResult.data ?? []).map((specialty) => ({
      name: specialty.name,
      pathologyCount: pathologies.filter((pathology) => pathology.specialty_id === specialty.id).length,
    })).filter((specialty) => specialty.pathologyCount > 0);
    return {
      specialtyCount: specialties.length,
      pathologyCount: pathologies.length,
      questionCount: questionsResult.count ?? 0,
      caseCount: casesResult.count ?? 0,
      specialties,
    };
  } catch {
    return fallback;
  }
});
