import { NextResponse, type NextRequest } from "next/server";
import { disabledRouteFallback } from "./lib/features";
import { updateSession } from "./lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Un module masqué (voir lib/features.ts) renvoie vers la page utile la plus
  // proche plutôt que vers une erreur : les anciens liens restent valables.
  const fallback = disabledRouteFallback(request.nextUrl.pathname);
  if (fallback) return NextResponse.redirect(new URL(fallback, request.url));
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
