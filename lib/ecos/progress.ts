import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { storedTranscript } from "./grading.ts";
import { milestones, type CompletedStation, type Milestone } from "./milestones.ts";
import { reflexStats, type ReflexStat } from "./reflexes.ts";
import { ecosPublicCode, getEcosScenario } from "./stations/index.ts";

/** Stations terminées prises en compte pour les réflexes : les plus récentes, pour suivre la progression actuelle. */
const RECENT_STATIONS = 12;
/** Plafond de lecture pour les jalons et les meilleurs scores. */
const ALL_STATIONS = 300;

export type EcosProgress = {
  reflexes: { stations: number; stats: ReflexStat[] };
  milestones: Milestone[];
  /** Meilleur pourcentage par code public de station. */
  best: Record<string, number>;
};

/** Stations terminées les plus récentes de ce compte, prêtes à être relues. */
async function completedStations(userId: string, limit: number): Promise<CompletedStation[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ecos_sessions")
    .select("station_slug, transcript, score, max_score, mode")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const scenario = getEcosScenario(String(row.station_slug));
    return scenario ? [{ scenario, messages: storedTranscript(row.transcript), score: Number(row.score ?? 0), maxScore: Number(row.max_score ?? 0), mode: String(row.mode) }] : [];
  });
}

/**
 * Progression de l'étudiant recalculée depuis ses stations terminées :
 * réflexes, jalons, meilleurs scores. Lecture par le service role
 * (`ecos_sessions` n'est plus lisible depuis le navigateur) ; rien de
 * sensible n'en sort : libellés, compteurs et codes publics.
 */
export async function getEcosProgress(userId: string): Promise<EcosProgress> {
  const stations = await completedStations(userId, ALL_STATIONS);
  const best: Record<string, number> = {};
  for (const station of stations) {
    const code = ecosPublicCode(station.scenario.slug);
    if (!code || !station.maxScore) continue;
    best[code] = Math.max(best[code] ?? 0, Math.round((station.score / station.maxScore) * 100));
  }
  const recent = stations.slice(0, RECENT_STATIONS);
  return {
    reflexes: { stations: recent.length, stats: reflexStats(recent) },
    milestones: milestones(stations),
    best,
  };
}

/** Réflexes seuls (tableau de bord), sur les dernières stations terminées. */
export async function getEcosReflexes(userId: string): Promise<EcosProgress["reflexes"]> {
  const recent = await completedStations(userId, RECENT_STATIONS);
  return { stations: recent.length, stats: reflexStats(recent) };
}
