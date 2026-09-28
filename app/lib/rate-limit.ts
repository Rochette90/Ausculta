import { createHash } from "node:crypto";
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

// Clé de bucket pour les visiteurs anonymes : hash de l'IP, jamais l'IP en clair.
export function anonymousBucketKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

export async function enforceAnonymousRateLimit(
  admin: SupabaseClient,
  request: Request,
  scope: string,
  limit: number,
  windowSeconds = 60,
) {
  const { data, error } = await admin.rpc("check_anonymous_rate_limit", {
    p_bucket_key: anonymousBucketKey(request),
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
