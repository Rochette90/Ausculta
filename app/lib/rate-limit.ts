import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./api-security";

/** Compte l'appel et dit s'il reste dans la limite, sans lever d'erreur. */
export async function withinRateLimit(
  admin: SupabaseClient,
  userId: string,
  scope: string,
  limit: number,
  windowSeconds = 60,
): Promise<boolean> {
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_user_id: userId,
    p_scope: scope,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) throw error;
  return Boolean(data);
}

export async function enforceRateLimit(
  admin: SupabaseClient,
  userId: string,
  scope: string,
  limit: number,
  windowSeconds = 60,
) {
  if (!(await withinRateLimit(admin, userId, scope, limit, windowSeconds))) {
    throw new ApiError(429, "rate_limit_exceeded", "Trop de requêtes", {
      "retry-after": String(windowSeconds),
    });
  }
}

/** Quota journalier : même compteur, message lisible par l'étudiant. */
export async function enforceDailyQuota(
  admin: SupabaseClient,
  userId: string,
  scope: string,
  limit: number,
  message: string,
) {
  if (!(await withinRateLimit(admin, userId, scope, limit, 86_400))) {
    throw new ApiError(429, "daily_quota_exceeded", message);
  }
}

/** Clé partagée des plafonds globaux (table `anonymous_rate_limit_buckets`, clé texte sans lien avec un profil). */
const GLOBAL_BUCKET_KEY = "global";

/**
 * Compte l'appel dans un compteur commun à tous les comptes et dit s'il reste
 * sous le plafond, sans lever d'erreur. Sert à borner la facture des
 * fournisseurs (modèle, voix) : à l'appelant de prévoir le repli.
 */
export async function withinGlobalLimit(
  admin: SupabaseClient,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await admin.rpc("check_anonymous_rate_limit", {
    p_bucket_key: GLOBAL_BUCKET_KEY,
    p_scope: scope,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) throw error;
  return Boolean(data);
}

// Clé de bucket pour les visiteurs anonymes : hash de l'IP, jamais l'IP en clair.
function anonymousBucketKey(request: Request): string {
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
