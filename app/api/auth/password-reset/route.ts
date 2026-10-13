import { createHash } from "node:crypto";
import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  readJsonObject,
} from "@/app/lib/api-security";
import { enforceAnonymousRateLimit } from "@/app/lib/rate-limit";
import { appOrigin } from "@/app/lib/stripe";
import { isPlausibleEmail } from "@/lib/auth/password";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * Demande d'e-mail de réinitialisation. La réponse est toujours `{ ok: true }`
 * pour une adresse plausible, que le compte existe ou non (pas d'énumération).
 * Deux limites : par adresse IP et par adresse e-mail (hachée, jamais stockée en clair).
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJsonObject(request, 1_024);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!isPlausibleEmail(email)) {
      throw new ApiError(400, "invalid_email", "Indiquez une adresse e-mail valide.");
    }

    const admin = createAdminClient();
    await enforceAnonymousRateLimit(admin, request, "password-reset", 5, 900);
    const { data: withinEmailLimit, error: limitError } = await admin.rpc("check_anonymous_rate_limit", {
      p_bucket_key: createHash("sha256").update(`email:${email}`).digest("hex"),
      p_scope: "password-reset-email",
      p_limit: 3,
      p_window_seconds: 3_600,
    });
    if (limitError) throw limitError;
    if (!withinEmailLimit) {
      throw new ApiError(429, "rate_limit_exceeded", "Trop de demandes pour cette adresse. Réessayez dans une heure.", {
        "retry-after": "3600",
      });
    }

    // Le gabarit `supabase/templates/recovery.html` ajoute `token_hash` et `type=recovery` ;
    // `/auth/callback` dépose ensuite l'étudiant sur `/reinitialiser-mot-de-passe` (lib/auth/email-link.ts).
    const redirectTo = `${appOrigin(request)}/auth/callback`;
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    // Une erreur Supabase (compte inconnu, fréquence d'envoi) ne doit pas
    // révéler l'existence du compte : elle est journalisée côté serveur seulement.
    if (error) console.warn("[password-reset] Supabase a refusé l'envoi :", error.message);

    return apiJson({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
