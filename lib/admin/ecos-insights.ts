import "server-only";

import type { EcosFeedbackCategory } from "../ecos/feedback";
import { ECOS_SCENARIOS, ecosPublicCode } from "../ecos/stations";
import { createAdminClient } from "../supabase/server";

/** Phase de test : fréquentation des stations, avis des étudiants et erreurs récentes. */
export type AdminStationStat = {
  slug: string;
  code: string;
  diagnosis: string;
  started: number;
  completed: number;
  abandoned: number;
  players: number;
  averagePercent: number | null;
  feedbackCount: number;
  averageRating: number | null;
};

export type AdminEcosFeedback = {
  id: string;
  sessionId: string;
  code: string;
  diagnosis: string;
  rating: number;
  category: EcosFeedbackCategory;
  comment: string;
  status: "open" | "resolved";
  createdAt: string;
  score: number | null;
  maxScore: number | null;
  transcript: { role: string; content: string }[];
};

export type AdminAppError = {
  id: string;
  source: "server" | "client";
  path: string;
  message: string;
  digest: string | null;
  createdAt: string;
};

function station(slug: string) {
  const scenario = ECOS_SCENARIOS.find((item) => item.slug === slug);
  return { code: ecosPublicCode(slug) ?? slug, diagnosis: scenario?.debrief.diagnosis ?? slug };
}

const nullableNumber = (value: unknown) => (value === null || value === undefined ? null : Number(value));

/** Toutes les stations du registre, même jamais jouées, dans l'ordre des codes. */
export async function getAdminStationStats(adminUserId: string, days: number): Promise<AdminStationStat[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await createAdminClient().rpc("admin_ecos_station_stats", { p_admin_user_id: adminUserId, p_since: since });
  if (error) throw error;
  const rows = new Map<string, Record<string, unknown>>(((data ?? []) as Record<string, unknown>[]).map((row) => [String(row.station_slug), row]));
  const slugs = [...ECOS_SCENARIOS.map((item) => item.slug), ...[...rows.keys()].filter((slug) => !ECOS_SCENARIOS.some((item) => item.slug === slug))];
  return slugs.map((slug) => {
    const row = rows.get(slug) ?? {};
    return {
      slug,
      ...station(slug),
      started: Number(row.started ?? 0),
      completed: Number(row.completed ?? 0),
      abandoned: Number(row.abandoned ?? 0),
      players: Number(row.players ?? 0),
      averagePercent: nullableNumber(row.average_percent),
      feedbackCount: Number(row.feedback_count ?? 0),
      averageRating: nullableNumber(row.average_rating),
    };
  });
}

/** Derniers avis, chacun avec le transcript de sa session pour comprendre le contexte. */
export async function getAdminEcosFeedback(limit = 50): Promise<AdminEcosFeedback[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ecos_feedback")
    .select("id, session_id, station_slug, rating, category, comment, status, created_at")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const items = data ?? [];
  const sessionIds = items.map((item) => item.session_id as string);
  if (!sessionIds.length) return [];
  const [{ data: sessions, error: sessionError }, { data: messages, error: messageError }] = await Promise.all([
    admin.from("ecos_sessions").select("id, score, max_score").in("id", sessionIds),
    admin.from("ecos_messages").select("session_id, sequence, role, content").in("session_id", sessionIds).order("sequence", { ascending: true }).limit(5000),
  ]);
  if (sessionError) throw sessionError;
  if (messageError) throw messageError;
  const scores = new Map((sessions ?? []).map((row) => [row.id as string, row]));
  return items.map((item) => {
    const session = scores.get(item.session_id as string);
    return {
      id: item.id as string,
      sessionId: item.session_id as string,
      ...station(item.station_slug as string),
      rating: Number(item.rating),
      category: item.category as EcosFeedbackCategory,
      comment: (item.comment as string) ?? "",
      status: item.status as "open" | "resolved",
      createdAt: item.created_at as string,
      score: nullableNumber(session?.score),
      maxScore: nullableNumber(session?.max_score),
      transcript: (messages ?? [])
        .filter((message) => message.session_id === item.session_id)
        .map((message) => ({ role: message.role as string, content: message.content as string })),
    };
  });
}

export async function getAdminAppErrors(limit = 50): Promise<AdminAppError[]> {
  const { data, error } = await createAdminClient()
    .from("app_errors")
    .select("id, source, path, message, digest, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    source: row.source as "server" | "client",
    path: row.path as string,
    message: row.message as string,
    digest: (row.digest as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}
