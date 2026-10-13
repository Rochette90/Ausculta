import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { UUID_PATTERN } from "@/lib/validation";
import { isAcceptedDiagnosis } from "./differentials.ts";
import { storedTranscript } from "./grading.ts";
import { buildStationReport } from "./report.ts";
import { ecosDoorNote, ecosPublicCode, ecosStationView, getEcosScenario } from "./stations/index.ts";
import { DIAGNOSIS_PREFIX } from "./text.ts";
import type { EcosMessage } from "./types.ts";

/** Passages pris en compte dans l'historique. */
const HISTORY_LIMIT = 200;

export type HistoryEntry = {
  sessionId: string;
  code: string;
  doorNote: string;
  mode: "training" | "exam";
  score: number;
  maxScore: number;
  percent: number;
  completedAt: string;
  diagnosisRight: boolean | null;
  /** Rang du passage sur cette station (1 = premier) et écart avec le précédent. */
  attempt: number;
  delta: number | null;
};

function chosenDiagnosis(messages: readonly EcosMessage[]): string | null {
  let chosen: string | null = null;
  for (const message of messages) if (message.role === "student" && message.content.startsWith(DIAGNOSIS_PREFIX)) chosen = message.content.slice(DIAGNOSIS_PREFIX.length).trim();
  return chosen;
}

/**
 * Stations terminées par ce compte, de la plus récente à la plus ancienne.
 * Lecture par le service role (`ecos_sessions` n'est pas lisible depuis le
 * navigateur) ; seuls des codes publics et des feuilles de porte en sortent.
 */
export async function getStationHistory(userId: string): Promise<HistoryEntry[]> {
  const { data, error } = await createAdminClient()
    .from("ecos_sessions")
    .select("id, station_slug, score, max_score, mode, completed_at, transcript")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: true })
    .limit(HISTORY_LIMIT);
  if (error) throw error;
  const previous = new Map<string, { attempt: number; score: number }>();
  const entries: HistoryEntry[] = [];
  for (const row of data ?? []) {
    const scenario = getEcosScenario(String(row.station_slug));
    const code = scenario ? ecosPublicCode(scenario.slug) : null;
    if (!scenario || !code) continue;
    const score = Number(row.score ?? 0);
    const maxScore = Number(row.max_score ?? 0) || 22;
    const before = previous.get(code);
    const chosen = chosenDiagnosis(storedTranscript(row.transcript));
    entries.push({
      sessionId: String(row.id),
      code,
      doorNote: ecosDoorNote(scenario),
      mode: row.mode === "exam" ? "exam" : "training",
      score,
      maxScore,
      percent: Math.round((score / maxScore) * 100),
      completedAt: String(row.completed_at),
      diagnosisRight: chosen === null ? null : isAcceptedDiagnosis(scenario, chosen),
      attempt: (before?.attempt ?? 0) + 1,
      delta: before ? score - before.score : null,
    });
    previous.set(code, { attempt: (before?.attempt ?? 0) + 1, score });
  }
  return entries.reverse();
}

/** Bilan d'un passage terminé de ce compte, tel qu'il a été enregistré ; `null` sinon. */
export async function getSessionReport(userId: string, sessionId: string) {
  if (!UUID_PATTERN.test(sessionId)) return null;
  const admin = createAdminClient();
  const { data: session, error } = await admin
    .from("ecos_sessions")
    .select("id, station_slug, mode, status, transcript")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!session || session.status !== "completed") return null;
  const scenario = getEcosScenario(String(session.station_slug));
  if (!scenario) return null;
  const { data: credited } = await admin.from("xp_events").select("amount").eq("session_id", sessionId).eq("user_id", userId).maybeSingle();
  const report = { ...buildStationReport(scenario, storedTranscript(session.transcript), sessionId), xp: Number(credited?.amount ?? 0) };
  return {
    view: ecosStationView(scenario, { candidateTitle: ecosDoorNote(scenario), specialty: null }),
    mode: session.mode === "exam" ? "exam" as const : "training" as const,
    report,
  };
}
