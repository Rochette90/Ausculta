import { NextResponse } from "next/server";
import { emailLinkDefaultPath, emailLinkErrorCode, parseEmailLinkType } from "@/lib/auth/email-link";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'arrivée des liens e-mail et du retour OAuth.
 *
 * - `?token_hash=…&type=…` (gabarits `supabase/templates/*.html`) : le jeton est
 *   vérifié ici, sans cookie PKCE, donc depuis n'importe quel appareil.
 * - `?code=…` (Google OAuth, ou ancien lien `{{ .ConfirmationURL }}`) : échange
 *   PKCE classique, qui exige le navigateur d'origine.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = parseEmailLinkType(url.searchParams.get("type"));
  const code = url.searchParams.get("code");

  if (tokenHash && type) {
    const nextPath = safeRedirectPath(url.searchParams.get("next"), emailLinkDefaultPath(type));
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(nextPath, url.origin));
    return NextResponse.redirect(new URL(`/login?error=${emailLinkErrorCode(type)}`, url.origin));
  }

  if (code) {
    const nextPath = safeRedirectPath(url.searchParams.get("next"));
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(nextPath, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=callback", url.origin));
}
