import Link from "next/link";
import { BrandLogo, ListeningBars } from "@/components/brand/BrandLogo";
import { BRAND_NAME } from "@/lib/brand";

/**
 * Cadre commun des pages d'authentification : à gauche, un aperçu de ce qui
 * attend l'étudiant (un échange de station, un résultat d'examen, un bilan),
 * dessiné en HTML ; à droite, le formulaire.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <aside className="auth-voice" aria-label={`Aperçu de ${BRAND_NAME}`}>
        <Link className="logo" href="/" aria-label={`Accueil ${BRAND_NAME}`}><BrandLogo priority /></Link>
        <div className="auth-voice-body">
          <h2 className="voice">Un patient qui vous répond. Une grille qui vous corrige.</h2>
          <div className="auth-preview" aria-hidden="true">
            <div className="auth-preview-bar"><span>Station · urgences</span><b>08:42</b></div>
            <div className="auth-preview-chat">
              <p className="auth-preview-who is-patient"><ListeningBars state="speaking" /> M. Favre, 62 ans</p>
              <p className="auth-preview-voice">« J’ai une douleur très forte dans la poitrine, et ça ne passe pas. »</p>
              <p className="auth-preview-who">Vous</p>
              <p>Depuis quand exactement ? Elle irradie quelque part ?</p>
              <p className="auth-preview-who">Examinateur · ECG 12 dérivations</p>
              <p className="auth-preview-result">Rythme sinusal à 98/min, sus-décalage du segment ST en DII, DIII et aVF.</p>
            </div>
            <div className="auth-preview-score">
              <strong>18<small>/22</small></strong>
              <span>Bilan : grille corrigée, réflexes d’entretien, débriefing sourcé</span>
            </div>
          </div>
        </div>
        <ul className="auth-points">
          <li><b>À l’écrit ou à la voix</b>, en français, comme le jour de l’ECOS</li>
          <li><b>Stations de 3ᵉ et 5ᵉ année</b>, examens, ECG et imagerie</li>
          <li><b>Examen blanc</b> et suivi de vos progrès</li>
        </ul>
      </aside>
      <div className="auth-panel">{children}</div>
    </main>
  );
}
