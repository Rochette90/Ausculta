import "server-only";

import { cache } from "react";
import { BRAND_NAME } from "../brand";
import { createClient } from "../supabase/server";
import { SLUG_PATTERN } from "../validation";
import type { PracticeGrid } from "./types";
import { validateGridContent } from "./validate";

export type PracticeGridSummary = Pick<PracticeGrid, "slug" | "title" | "themes">;

export async function getPracticeGrids(): Promise<PracticeGridSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_grids")
    .select("slug, title, themes")
    .eq("is_published", true)
    .order("position")
    .order("title");
  if (error) throw error;
  return data ?? [];
}

/**
 * Une grille mal formée en base est traitée comme absente plutôt que de casser
 * la page. `cache` : la page et ses métadonnées partagent la même lecture.
 */
export const getPracticeGrid = cache(async (slug: string): Promise<PracticeGrid | null> => {
  if (!SLUG_PATTERN.test(slug)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_grids")
    .select("slug, title, themes, content")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const checked = validateGridContent(data.content);
  if (!checked.ok) {
    console.error(`${BRAND_NAME} invalid practice grid`, slug, checked.errors);
    return null;
  }
  return { slug: data.slug, title: data.title, themes: data.themes, ...checked.content };
});
