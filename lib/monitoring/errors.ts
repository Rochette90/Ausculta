import "server-only";

import { BRAND_NAME } from "../brand";
import { createAdminClient } from "../supabase/server";

export type AppErrorSource = "server" | "client";

export type AppErrorInput = {
  source: AppErrorSource;
  path: string;
  message: string;
  digest?: string;
  userId?: string | null;
};

/**
 * Garde une trace d'une erreur dans `app_errors` (lisible dans /admin/stations).
 * Ne lève jamais : journaliser ne doit pas faire échouer la requête d'origine.
 */
export async function recordAppError({ source, path, message, digest, userId }: AppErrorInput) {
  try {
    const { error } = await createAdminClient().rpc("log_app_error", {
      p_source: source,
      p_path: path.slice(0, 300),
      p_message: (message || "Erreur inconnue").slice(0, 1000),
      p_digest: digest?.slice(0, 100) ?? null,
      p_user_id: userId ?? null,
    });
    if (error) console.error(`${BRAND_NAME} error log failed`, error.message);
  } catch (error) {
    console.error(`${BRAND_NAME} error log failed`, error instanceof Error ? error.message : error);
  }
}
