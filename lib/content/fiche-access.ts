import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { STATION_FICHE_SLUGS } from "@/lib/ecos/stations/index";
import { FEATURES } from "@/lib/features";

/**
 * Catalogue de fiches masqué : seules les fiches citées par le débriefing
 * d'une station restent accessibles (lecture, progression, signalement).
 */
export async function ficheIsAccessible(admin: SupabaseClient, pathologyId: string): Promise<boolean> {
  if (FEATURES.fiches) return true;
  const { data, error } = await admin.from("pathologies").select("slug").eq("id", pathologyId).maybeSingle();
  if (error) throw error;
  return Boolean(data && STATION_FICHE_SLUGS.has(String(data.slug)));
}
