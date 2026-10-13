import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ANALYSIS_PREFIX, SYNTHESIS_MARKER } from "./text.ts";

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

/** Longueur maximale de l'analyse écrite des examens. */
export const MAX_ANALYSIS_LENGTH = 1_200;

/**
 * Enregistre l'analyse écrite des examens complémentaires, une seule fois.
 * L'appelant vérifie que la synthèse n'est pas ouverte : les quatre
 * propositions de diagnostic ne doivent pas pouvoir inspirer l'analyse.
 */
export async function recordAnalysis(admin: SupabaseClient, sessionId: string, userId: string, analysis: string): Promise<void> {
  const { data, error } = await admin
    .from("ecos_messages")
    .select("sequence")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .eq("role", "student")
    .like("content", `${ANALYSIS_PREFIX}%`)
    .limit(1);
  if (error) throw error;
  if (data?.length) return;
  const { error: appendError } = await admin.rpc("append_ecos_message", {
    p_user_id: userId,
    p_session_id: sessionId,
    p_role: "student",
    p_content: `${ANALYSIS_PREFIX}${analysis}`,
  });
  if (appendError) throw appendError;
}
