import "server-only";

import { cache } from "react";
import { createAdminClient } from "../supabase/server";
import { FEATURES } from "../features";
import caseCatalog from "@/content/cases/index.json";

export type MarketingStats = {
  specialtyCount: number;
  pathologyCount: number;
  questionCount: number;
  caseCount: number;
  specialties: Array<{ name: string; pathologyCount: number }>;
};

/** Fiches et QCM masqués : leurs chiffres ne sont ni lus ni affichés. */
const libraryEnabled = FEATURES.fiches || FEATURES.quiz;

// Repli hors-ligne calculé depuis les catalogues embarqués : une seule
// source de vérité locale, jamais de chiffres codés en dur. Les catalogues
// volumineux ne sont chargés que si leur module est actif.
async function buildFallback(): Promise<MarketingStats> {
  if (!libraryEnabled) {
    return { specialtyCount: 0, pathologyCount: 0, questionCount: 0, caseCount: caseCatalog.length, specialties: [] };
  }
  const [{ default: pathologyCatalog }, { default: questionCatalog }] = await Promise.all([
    import("@/content/pathologies/index.json"),
    import("@/content/questions/index.json"),
  ]);
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

export const getMarketingStats = cache(async (): Promise<MarketingStats> => {
  try {
    const admin = createAdminClient();
    const publishedCases = admin.from("clinical_cases").select("id", { count: "exact", head: true }).eq("status", "published");
    if (!libraryEnabled) {
      const casesResult = await publishedCases;
      if (casesResult.error) return buildFallback();
      return { specialtyCount: 0, pathologyCount: 0, questionCount: 0, caseCount: casesResult.count ?? 0, specialties: [] };
    }
    const [specialtiesResult, pathologiesResult, questionsResult, casesResult] = await Promise.all([
      admin.from("specialties").select("id, name, order_index").order("order_index"),
      admin.from("pathologies").select("specialty_id").eq("is_published", true),
      admin.from("questions").select("id", { count: "exact", head: true }).eq("is_published", true),
      publishedCases,
    ]);
    if (specialtiesResult.error || pathologiesResult.error || questionsResult.error || casesResult.error) return buildFallback();
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
    return buildFallback();
  }
});
