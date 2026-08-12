import "server-only";

import { cache } from "react";
import { createAdminClient } from "../supabase/server";

export type MarketingStats = {
  specialtyCount: number;
  pathologyCount: number;
  questionCount: number;
  caseCount: number;
  specialties: Array<{ name: string; pathologyCount: number }>;
};

const fallback: MarketingStats = {
  specialtyCount: 16,
  pathologyCount: 83,
  questionCount: 12,
  caseCount: 12,
  specialties: [
    { name: "Cardiologie", pathologyCount: 15 },
    { name: "Neurologie", pathologyCount: 15 },
    { name: "Pneumologie", pathologyCount: 15 },
    { name: "Urgences", pathologyCount: 0 },
    { name: "Radiologie", pathologyCount: 0 },
    { name: "Infectiologie", pathologyCount: 15 },
  ],
};

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
    }));
    return {
      specialtyCount: specialties.length,
      pathologyCount: pathologies.length,
      questionCount: questionsResult.count ?? 0,
      caseCount: casesResult.count ?? 0,
      specialties: specialties.slice(0, 8),
    };
  } catch {
    return fallback;
  }
});
