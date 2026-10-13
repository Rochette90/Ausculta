import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { DAY_SECONDS, ecosPlan, ecosQuotas } from "./quotas.ts";

export type QuotaUsage = { used: number; limit: number };

/**
 * Consommation du jour, lue dans les compteurs qui appliquent les quotas
 * (`check_rate_limit` : fenêtre de 24 h calée sur minuit UTC). Lecture par
 * le service role ; un appel refusé compte aussi, d'où le plafonnement.
 */
export async function ecosUsageToday(userId: string, plan: unknown) {
  const quotas = ecosQuotas(process.env, ecosPlan(plan));
  const windowStart = Math.floor(Date.now() / 1000 / DAY_SECONDS) * DAY_SECONDS;
  const { data, error } = await createAdminClient()
    .from("rate_limit_buckets")
    .select("scope, request_count")
    .eq("user_id", userId)
    .eq("window_started_at", new Date(windowStart * 1000).toISOString())
    .in("scope", ["ecos-session-day", "ecos-chat-day", "ecos-voice-day"]);
  if (error) throw error;
  const count = (scope: string) => Number((data ?? []).find((row) => row.scope === scope)?.request_count ?? 0);
  const usage = (scope: string, limit: number): QuotaUsage => ({ used: Math.min(count(scope), limit), limit });
  return {
    sessions: usage("ecos-session-day", quotas.dailySessions),
    messages: usage("ecos-chat-day", quotas.dailyMessages),
    voice: usage("ecos-voice-day", quotas.dailyVoiceReplies),
    resetsAt: new Date((windowStart + DAY_SECONDS) * 1000),
  };
}
