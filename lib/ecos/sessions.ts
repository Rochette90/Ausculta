import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { SYNTHESIS_MARKER } from "./text.ts";

/**
 * True once the student has opened the synthesis: the four diagnosis options
 * are then known, so history and exam are closed for the rest of the station.
 */
export async function synthesisStarted(admin: SupabaseClient, sessionId: string, userId: string): Promise<boolean> {
  const { data, error } = await admin
    .from("ecos_messages")
    .select("sequence")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .eq("role", "system")
    .eq("content", SYNTHESIS_MARKER)
    .limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}
