import { NextResponse, type NextRequest } from "next/server";
import { disabledRouteFallback } from "./lib/features";
import { buildContentSecurityPolicy, createNonce, NONCE_HEADER } from "./lib/security/csp";
import { updateSession } from "./lib/supabase/proxy";

const isDevelopment = process.env.NODE_ENV === "development";

export async function proxy(request: NextRequest) {
  // Un module masqué (voir lib/features.ts) renvoie vers la page utile la plus
  // proche plutôt que vers une erreur : les anciens liens restent valables.
  const fallback = disabledRouteFallback(request.nextUrl.pathname);
  if (fallback) return NextResponse.redirect(new URL(fallback, request.url));

  // Nonce CSP unique par requête : transmis au rendu (Next.js le lit dans
  // l'en-tête CSP de la requête pour marquer ses <script>) et renvoyé au
  // navigateur. Remplace la CSP générique de `next.config.ts` sur cette réponse.
  const nonce = createNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy({ nonce, isDevelopment });
  const response = await updateSession(request, {
    [NONCE_HEADER]: nonce,
    "content-security-policy": contentSecurityPolicy,
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
