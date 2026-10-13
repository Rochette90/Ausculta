import "server-only";

export { drawMockExam, mockExamTypes, parseMockPlan, parseMockSessions } from "./mock-plan.ts";

import { createAdminClient } from "@/lib/supabase/server";
import { ecos3Parcours } from "./curriculum.ts";
import { mockTypeOf } from "./mock-plan.ts";
import { isAcceptedDiagnosis } from "./differentials.ts";
import { storedTranscript } from "./grading.ts";
import { reflexStats, reflexesToWork } from "./reflexes.ts";
import { ecosDoorNote, ecosPublicCode, getEcosScenario, isMockStation, MOCK_SCENARIOS } from "./stations/index.ts";
import { DIAGNOSIS_PREFIX } from "./text.ts";

/** Codes des stations d'examen blanc déjà terminées par ce compte (pour en tirer de nouvelles). */
export async function playedMockCodes(userId: string): Promise<Set<string>> {
  const { data, error } = await createAdminClient()
    .from("ecos_sessions")
    .select("station_slug")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("station_slug", MOCK_SCENARIOS.map((scenario) => scenario.slug));
  if (error) throw error;
  return new Set((data ?? []).flatMap((row) => ecosPublicCode(String(row.station_slug)) ?? []));
}

/** Bilan global : chaque station du circuit, par type, et les réflexes de l'ensemble. */
export async function getMockExamResults(userId: string, sessionIds: readonly string[]) {
  if (!sessionIds.length) return null;
  const { data, error } = await createAdminClient()
    .from("ecos_sessions")
    .select("id, station_slug, score, max_score, mode, status, transcript")
    .eq("user_id", userId)
    .in("id", [...sessionIds]);
  if (error) throw error;
  const types = new Map(ecos3Parcours().map((type) => [type.id, type.label]));
  const rows = sessionIds.flatMap((id) => {
    const row = (data ?? []).find((item) => item.id === id);
    const scenario = row ? getEcosScenario(String(row.station_slug)) : null;
    if (!row || !scenario || !isMockStation(scenario.slug) || row.status !== "completed") return [];
    const messages = storedTranscript(row.transcript);
    let chosen: string | null = null;
    for (const message of messages) if (message.role === "student" && message.content.startsWith(DIAGNOSIS_PREFIX)) chosen = message.content.slice(DIAGNOSIS_PREFIX.length).trim();
    const score = Number(row.score ?? 0);
    const maxScore = Number(row.max_score ?? 0) || 22;
    return [{
      sessionId: id,
      code: ecosPublicCode(scenario.slug) ?? "",
      type: types.get(mockTypeOf(scenario.slug) ?? "") ?? "Autre",
      doorNote: ecosDoorNote(scenario),
      score,
      maxScore,
      percent: Math.round((score / maxScore) * 100),
      diagnosisRight: chosen !== null && isAcceptedDiagnosis(scenario, chosen),
      scenario,
      messages,
    }];
  });
  if (!rows.length) return null;
  const total = rows.reduce((sum, row) => sum + row.score, 0);
  const max = rows.reduce((sum, row) => sum + row.maxScore, 0);
  const sorted = [...rows].sort((left, right) => right.percent - left.percent);
  const reflexes = reflexStats(rows.map(({ scenario, messages }) => ({ scenario, messages })));
  return {
    stations: rows.map((row) => ({ sessionId: row.sessionId, code: row.code, type: row.type, doorNote: row.doorNote, score: row.score, maxScore: row.maxScore, percent: row.percent, diagnosisRight: row.diagnosisRight })),
    total,
    max,
    percent: Math.round((total / max) * 100),
    diagnoses: rows.filter((row) => row.diagnosisRight).length,
    strongest: sorted[0] ? { type: sorted[0].type, percent: sorted[0].percent } : null,
    weakest: sorted.at(-1) ? { type: sorted.at(-1)!.type, percent: sorted.at(-1)!.percent } : null,
    reflexesToWork: reflexesToWork(reflexes).map(({ id, label, tip, done, total: count }) => ({ id, label, tip, done, total: count })),
  };
}
