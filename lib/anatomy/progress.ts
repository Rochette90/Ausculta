import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AnatomyProgress } from "./types";

export async function getAnatomyProgress(userId: string): Promise<{ attempts: AnatomyProgress[]; available: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("anatomy_attempts")
    .select("module_slug, mode, score, total, created_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(500);
  // Reading remains available before the additive migration is applied.
  if (error) return { attempts: [], available: false };
  return { attempts: (data ?? []) as AnatomyProgress[], available: true };
}
