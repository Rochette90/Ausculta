import "server-only";

import { cache } from "react";
import { createClient } from "../supabase/server";
import { SLUG_PATTERN } from "../validation";

/** Fiches de théorie : la méthode, pas les pathologies. La base est la référence (ADR-013). */
export type TheoryFicheSummary = { slug: string; title: string; summary: string };
export type TheoryFiche = TheoryFicheSummary & { content: string; updatedAt: string };

export async function getTheoryFiches(): Promise<TheoryFicheSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("theory_fiches")
    .select("slug, title, summary")
    .eq("is_published", true)
    .order("position")
    .order("title");
  if (error) throw error;
  return data ?? [];
}

/** `cache` : la page et ses métadonnées partagent la même lecture. */
export const getTheoryFiche = cache(async (slug: string): Promise<TheoryFiche | null> => {
  if (!SLUG_PATTERN.test(slug)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("theory_fiches")
    .select("slug, title, summary, content, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { slug: data.slug, title: data.title, summary: data.summary, content: data.content, updatedAt: data.updated_at };
});
