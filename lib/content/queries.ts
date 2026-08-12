import "server-only";

import { cache } from "react";
import type { Pathology, Specialty } from "../../types/medtrain";
import { createClient } from "../supabase/server";

export type PathologySummary = Pick<
  Pathology,
  "id" | "specialty_id" | "title" | "slug" | "definition" | "difficulty"
>;

export type SpecialtyCatalogItem = Specialty & {
  pathologies: PathologySummary[];
};

export type PathologyDetails = Pathology & {
  summary: string;
  content: string | null;
  criticality: "standard" | "important" | "urgent";
  specialty: Pick<Specialty, "name" | "slug" | "icon" | "color"> | null;
};

export const getSpecialtyCatalog = cache(async (): Promise<SpecialtyCatalogItem[]> => {
  const supabase = await createClient();
  const [{ data: specialties, error: specialtyError }, { data: pathologies, error: pathologyError }] = await Promise.all([
    supabase
      .from("specialties")
      .select("id, name, slug, description, icon, color, order_index, created_at")
      .order("order_index"),
    supabase
      .from("pathologies")
      .select("id, specialty_id, title, slug, definition, difficulty")
      .eq("is_published", true)
      .order("title"),
  ]);

  if (specialtyError || pathologyError) {
    throw new Error("Le catalogue médical est temporairement indisponible.");
  }

  const published = (pathologies ?? []) as PathologySummary[];
  return ((specialties ?? []) as Specialty[]).map((specialty) => ({
    ...specialty,
    pathologies: published.filter((pathology) => pathology.specialty_id === specialty.id),
  }));
});

export const getPathologyBySlug = cache(async (slug: string): Promise<PathologyDetails | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pathologies")
    .select(`
      id, specialty_id, title, slug, definition, pathophysiology, symptoms,
      risk_factors, complementary_exams, differential_diagnosis, treatments,
      complications, monitoring, difficulty, is_published, created_at, updated_at,
      summary, content, criticality,
      specialty:specialties(name, slug, icon, color)
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as PathologyDetails;
});
