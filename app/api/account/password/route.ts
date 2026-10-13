import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  readJsonObject,
  requireAuthenticatedUser,
} from "@/app/lib/api-security";
import { enforceRateLimit } from "@/app/lib/rate-limit";
import { isRecentRecoverySession, passwordProblem } from "@/lib/auth/password";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/** Client jetable (clé anon, sans cookies) pour vérifier un mot de passe sans toucher la session du navigateur. */
function createVerificationClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase public environment variables are missing");
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * Changement de mot de passe. Deux voies :
 * - depuis le profil : `currentPassword` obligatoire, vérifié par une connexion
 *   jetable ; le nouveau mot de passe est posé sur cette session fraîche (GoTrue
 *   exige une session récente, `secure_password_change`) ;
 * - depuis un lien de réinitialisation : la session courante doit provenir d'une
 *   méthode `recovery` datant de moins d'une heure (claim `amr` du JWT).
 * Dans les deux cas, les autres sessions du compte sont révoquées.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireAuthenticatedUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "password-update", 5, 900);

    const body = await readJsonObject(request, 2_048);
    const problem = passwordProblem(body.password);
    if (problem) throw new ApiError(400, "invalid_password", problem);
    const password = body.password as string;

    const supabase = await createClient();
    if (typeof body.currentPassword === "string" && body.currentPassword.length > 0) {
      if (!user.email) throw new ApiError(400, "password_login_unavailable", "Ce compte n'a pas d'adresse e-mail de connexion.");
      if (body.currentPassword === password) {
        throw new ApiError(400, "invalid_password", "Choisissez un mot de passe différent de l'actuel.");
      }
      const verifier = createVerificationClient();
      const { error: signInError } = await verifier.auth.signInWithPassword({ email: user.email, password: body.currentPassword });
      if (signInError) {
        // Même message pour « mot de passe faux » et « compte sans mot de passe »
        // (connexion Google) : la voie de secours est le lien de réinitialisation.
        throw new ApiError(400, "invalid_current_password", "Le mot de passe actuel est incorrect.");
      }
      const { error: updateError } = await verifier.auth.updateUser({ password });
      if (updateError) throw new ApiError(400, "password_rejected", "Ce mot de passe n'a pas été accepté. Choisissez-en un autre.");
    } else {
      const { data: claimsData } = await supabase.auth.getClaims();
      if (!isRecentRecoverySession(claimsData?.claims?.amr)) {
        throw new ApiError(403, "reauthentication_required", "Indiquez votre mot de passe actuel ou demandez un nouveau lien de réinitialisation.");
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new ApiError(400, "password_rejected", "Ce mot de passe n'a pas été accepté. Choisissez-en un autre.");
    }

    // Un mot de passe changé invalide les autres appareils connectés.
    await supabase.auth.signOut({ scope: "others" }).catch(() => undefined);

    return apiJson({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
