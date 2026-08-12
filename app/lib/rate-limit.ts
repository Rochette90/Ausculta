import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./api-security";

export async function enforceRateLimit(
  admin: SupabaseClient,
  userId: string,
  scope: string,
  limit: number,
  windowSeconds = 60,
) {
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_user_id: userId,
    p_scope: scope,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) throw error;
  if (!data) {
    throw new ApiError(429, "rate_limit_exceeded", "Trop de requêtes", {
      "retry-after": String(windowSeconds),
    });
  }
}
