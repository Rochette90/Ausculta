import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth/require-user";
import { safeRedirectPath } from "../../lib/auth/safe-redirect";
import { BrandLogo, ListeningBars } from "../brand/BrandLogo";
import { AuthForm } from "./AuthForm";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export async function AuthPage({ mode, searchParams }: { mode: "login" | "signup"; searchParams: Promise<{ next?: string }> }) {
  const requestedNext = safeRedirectPath((await searchParams).next);
  const nextPath = mode === "signup"
    ? `/onboarding?next=${encodeURIComponent(requestedNext)}`
    : requestedNext;
  if (await getCurrentUser()) redirect(nextPath);
  return (
    <main className="auth-page">
      <aside className="auth-voice" aria-label="Extrait d’une station">
        <Link className="logo" href="/" aria-label={`Accueil ${BRAND_NAME}`}><BrandLogo priority /></Link>
        <figure>
          <blockquote><p className="voice">« Bonjour docteur… j’ai une douleur très forte dans la poitrine, et ça ne passe pas. »</p></blockquote>
          <figcaption><ListeningBars state="speaking" /> M. Favre, 62 ans, station d’urgences</figcaption>
        </figure>
        <p>Un patient simulé qui vous répond, à l’écrit ou à la voix. Puis votre grille corrigée et un débriefing sourcé.</p>
      </aside>
      <div className="auth-panel">
        <AuthForm nextPath={nextPath} switchNextPath={requestedNext} mode={mode} />
      </div>
    </main>
  );
}
