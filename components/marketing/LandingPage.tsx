import Link from "next/link";
import type { CSSProperties } from "react";
import type { MarketingStats } from "@/lib/marketing/stats";
import { EXAM_DURATION_SECONDS } from "@/lib/ecos/timing";
import { FEATURES, UPCOMING_FEATURE_LABELS } from "@/lib/features";
import { BRAND_NAME } from "@/lib/brand";
import { ListeningBars } from "@/components/brand/BrandLogo";

/** Rang d'une réplique dans l'entrée orchestrée du héros. */
const line = (index: number) => ({ "--line": index }) as CSSProperties;

// Les quatre temps d'une station, chacun relié à sa section de la méthode.
const STEPS = [
  { name: "Anamnèse", say: "Vous l’écoutez.", text: "Le patient répond à vos questions, une par une. Il ne souffle jamais le diagnostic et nie ce qui n’appartient pas au cas.", href: "/methode#anamnese", link: "Comment se passe l’entretien" },
  { name: "Examen clinique", say: "Vous l’examinez.", text: "Une centaine de gestes et d’examens, les mêmes pour chaque station : rien ne vous oriente. Chaque choix débloque son résultat, et un examen inutile coûte un demi-point.", href: "/methode#examen", link: "Les gestes et leurs résultats" },
  { name: "Synthèse", say: "Vous tranchez.", text: "Votre diagnostic et vos différentiels, sans aucune proposition, puis votre prise en charge, que vous expliquez au patient avant les questions de l’examinateur.", href: "/methode#synthese", link: "Ce qu’on attend de la synthèse" },
  { name: "Débriefing", say: "Vous voyez ce qui vous a échappé.", text: "Votre grille sur 22 points, votre entretien annoté phrase par phrase, les drapeaux rouges, les diagnostics différentiels et les sources.", href: "/methode#debriefing", link: "Comment la grille est notée" },
] as const;

export function LandingPage({ signedIn, stats }: { signedIn: boolean; stats: MarketingStats }) {
  // Les stations supposent un compte : un visiteur anonyme passe par
  // l'inscription, puis arrive directement sur le catalogue des stations.
  const stationsHref = signedIn ? "/cas" : "/signup?next=%2Fcas";
  const enterHref = signedIn ? "/dashboard" : stationsHref;
  const primaryLabel = signedIn ? "Ouvrir mon tableau de bord" : "Essayer une station gratuite";
  const hasStations = stats.caseCount > 0;
  const examMinutes = Math.round(EXAM_DURATION_SECONDS / 60);
  // Modules masqués pour l'instant (lib/features.ts), annoncés sans promesse de date.
  const upcoming = UPCOMING_FEATURE_LABELS.filter(({ feature }) => !FEATURES[feature]).map(({ label }) => label);

  return (
    <main className="landing">
      <section className="landing-hero mk-wrap" aria-labelledby="landing-title">
        <ol className="script" aria-label="Extrait d’un entretien avec un patient simulé">
          <li className="script-line" style={line(0)}>
            <span className="script-who">Vous</span>
            <p className="script-student">Bonjour Monsieur Favre. Qu’est-ce qui vous amène aujourd’hui ?</p>
          </li>
          <li className="script-line is-patient" style={line(1)}>
            <span className="script-who">M. Favre, 62 ans</span>
            <p className="script-patient voice">Bonjour docteur… j’ai une douleur très forte dans la poitrine depuis presque une heure, et ça ne passe pas.</p>
          </li>
          <li className="script-line" style={line(2)}>
            <span className="script-who">Vous</span>
            <p className="script-student">Est-ce que la douleur se déplace quelque part ?</p>
          </li>
          <li className="script-line is-patient" style={line(3)}>
            <span className="script-who">M. Favre</span>
            <p className="script-pending"><ListeningBars state="speaking" /> répond…</p>
          </li>
        </ol>

        <div className="landing-intro script-line">
          <span className="script-spacer" />
          <div>
            <h1 id="landing-title">{BRAND_NAME} vous entraîne aux ECOS face à un patient simulé qui vous répond, à l’écrit ou à la voix.</h1>
            <div className="landing-actions">
              <Link className="button primary" href={enterHref}>{primaryLabel}</Link>
              <Link className="text-link" href="/methode">Voir le déroulé d’une station</Link>
            </div>
            <p className="landing-note">{hasStations ? `${stats.caseCount} stations jouables, en mode entraînement ou en mode examen.` : "Les stations sont en préparation."}</p>
          </div>
        </div>
      </section>

      <ProductPreview />

      <section className="landing-steps" aria-labelledby="landing-steps-title">
        <div className="mk-wrap">
          <div className="script-line">
            <span className="script-spacer" />
            <h2 className="landing-steps-title" id="landing-steps-title">Après l’entretien, la station continue comme le jour de l’examen.</h2>
          </div>
          <ol className="steps">
            {STEPS.map((step) => (
              <li className="script-line" key={step.name}>
                <h3>{step.name}</h3>
                <div>
                  <p className="step-say voice">{step.say}</p>
                  <p className="step-text">{step.text}</p>
                  <Link className="text-link" href={step.href}>{step.link}</Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-voice mk-wrap" aria-labelledby="landing-voice-title">
        <div className="voice-panel">
          <div>
            <h2 id="landing-voice-title">Parlez-lui à voix haute.</h2>
            <p>Activez le micro et menez l’entretien comme le jour de l’examen. Le patient vous répond à l’oral, l’échange reste écrit à l’écran et le clavier reste disponible. La voix fonctionne sur Chrome, Edge et Safari.</p>
            <dl>
              <div><dt>Entraînement</dt><dd>Sans chronomètre, à votre rythme.</dd></div>
              <div><dt>Examen</dt><dd>{examMinutes} minutes pour toute la station, ni indice ni score avant la fin.</dd></div>
            </dl>
            <Link className="button primary" href={stationsHref}>Essayer à la voix</Link>
          </div>
          <div className="voice-disc" aria-hidden="true"><ListeningBars state="speaking" /></div>
        </div>
      </section>

      <section className="landing-more mk-wrap" aria-label={`Découvrir ${BRAND_NAME}`}>
        <div className="script-line">
          <span className="script-who">Pour qui</span>
          <div>
            <h2>Conçu pour les étudiants en médecine en Suisse</h2>
            <p>Un entraînement exigeant, aligné sur le cursus et l’examen fédéral, que l’on peut reprendre sur son téléphone entre deux cours. Une station à la fois suffit pour installer une routine.</p>
          </div>
        </div>
        <div className="script-line">
          <span className="script-who">Avant de commencer</span>
          <div>
            <ul className="link-list">
              <li><Link href="/methode">La méthode</Link><span>Le déroulé d’une station, les deux modes et la notation</span></li>
              {FEATURES.premium && <li><Link href="/pricing">Les tarifs</Link><span>Gratuit aujourd’hui, et ce que prépare la suite</span></li>}
              <li><Link href="/faq">Les questions fréquentes</Link><span>Patient simulé, voix, notation, compte</span></li>
              <li><Link href="/a-propos">Le projet</Link><span>Pourquoi {BRAND_NAME} existe</span></li>
              <li><Link href="/nouveautes">Les nouveautés</Link><span>Ce qui a changé récemment</span></li>
            </ul>
            {upcoming.length > 0 && <p className="landing-upcoming">Prochainement : {upcoming.join(" et ")}.</p>}
          </div>
        </div>
      </section>

      <section className="landing-end mk-wrap" aria-labelledby="landing-end-title">
        <div className="script-line is-patient">
          <span className="script-who">Votre patient</span>
          <div>
            <p className="script-patient voice">« Bonjour docteur… »</p>
            <div className="landing-end-actions">
              <h2 id="landing-end-title">{hasStations ? "Toutes les stations sont gratuites pour l’instant." : "Les premières stations arrivent bientôt."}</h2>
              <Link className="button primary" href={enterHref}>{signedIn ? "Ouvrir mon espace" : "Créer mon compte gratuit"}</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * Aperçu du produit, dessiné en HTML (pas de capture d'écran) : une station
 * à l'examen clinique et le haut d'un bilan, avec des données d'exemple.
 */
function ProductPreview() {
  const cells = Array.from({ length: 22 }, (_, index) => index);
  return (
    <section className="landing-preview mk-wrap" aria-labelledby="landing-preview-title">
      <div className="script-line">
        <span className="script-spacer" />
        <h2 id="landing-preview-title" className="landing-steps-title">Une vraie station, du premier mot au bilan.</h2>
      </div>
      <div className="preview-grid" aria-hidden="true">
        <div className="preview-window">
          <div className="preview-bar"><span>Station 17 · examen clinique</span><b>08:42</b></div>
          <div className="preview-station">
            <div className="preview-chat">
              <p className="preview-who">Vous</p>
              <p>Est-ce que la douleur descend vers l’aine ?</p>
              <p className="preview-who is-patient">M. Duc</p>
              <p className="preview-voice">Oui, jusque dans le testicule gauche.</p>
              <p className="preview-who">Examinateur</p>
              <p className="preview-result">Bandelette urinaire : sang +++, leucocytes et nitrites négatifs.</p>
            </div>
            <div className="preview-exam">
              <p className="preview-label">Que faites-vous ?</p>
              <div className="preview-search">ct low</div>
              <div className="preview-chips"><span className="is-on">CT abdominal low-dose sans injection</span></div>
              <ul>
                <li>Constantes et mesures</li>
                <li>Abdomen et urogénital</li>
                <li>Biologie sanguine</li>
                <li>Imagerie</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="preview-window preview-report">
          <div className="preview-bar"><span>Bilan</span></div>
          <div className="preview-score">
            <p><strong>18</strong> sur 22 points</p>
            <div className="preview-cells">{cells.map((index) => <i key={index} className={index < 18 ? "is-on" : ""} />)}</div>
            <p className="preview-xp">+58 XP · record battu</p>
          </div>
          <div className="preview-takeaways">
            <div className="good"><span>Bon diagnostic</span>Colique néphrétique gauche</div>
            <div className="improve"><span>À travailler</span>Vérifier la compréhension du patient</div>
          </div>
          <div className="preview-tabs"><span className="is-on">Grille</span><span>Entretien annoté</span><span>Débriefing</span></div>
        </div>
      </div>
    </section>
  );
}
