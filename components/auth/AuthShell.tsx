import Link from "next/link";
import { BrandLogo, ListeningBars } from "@/components/brand/BrandLogo";
import { BRAND_NAME } from "@/lib/brand";

/** Cadre commun des pages d'authentification : la voix du patient à gauche, le formulaire à droite. */
export function AuthShell({ children }: { children: React.ReactNode }) {
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
      <div className="auth-panel">{children}</div>
    </main>
  );
}
