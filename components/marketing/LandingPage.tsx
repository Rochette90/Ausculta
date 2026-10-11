import { ArrowRight, CheckCircle2, ChevronRight, ClipboardList, Clock3, CreditCard, Ear, HelpCircle, MessagesSquare, Mic, Newspaper, Route, Sparkles, Stethoscope, Target, Users } from "lucide-react";
import Link from "next/link";
import type { MarketingStats } from "@/lib/marketing/stats";
import { EXAM_DURATION_SECONDS } from "@/lib/ecos/timing";
import { FEATURES, UPCOMING_FEATURE_LABELS } from "@/lib/features";
import { BRAND_NAME, BRAND_NAME_UPPER, BRAND_PRO_PLAN } from "@/lib/brand";

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
    <div className="landing-page page-enter">
      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="eyebrow">ECOS · PATIENT SIMULÉ</p>
            <h1 id="landing-title">Réviser moins au hasard.<br /><span className="landing-hero-emphasis">Raisonner comme en clinique.</span></h1>
            <p>Entraînez-vous aux ECOS face à un patient simulé qui vous répond, à l’écrit ou à la voix. Anamnèse, examen clinique, synthèse&nbsp;: chaque station se termine par votre grille corrigée et un débriefing.</p>
            <div className="landing-actions">
              <Link className="button primary" href={enterHref}>{primaryLabel} <ArrowRight aria-hidden="true" size={17} /></Link>
              <Link className="button secondary" href="/methode">Découvrir la méthode <ChevronRight aria-hidden="true" size={16} /></Link>
            </div>
            <p className="landing-hero-note">{hasStations ? `${stats.caseCount} stations jouables · mode entraînement ou examen` : "Stations en préparation"}</p>
          </div>

          <div className="landing-demo" aria-label={`Aperçu d’une station ${BRAND_NAME}`}>
            <div className="hero-product-glow" aria-hidden="true" />
            <div className="demo-window">
              <div className="demo-top"><span>Station 01 · Urgences</span><span>Entraînement</span></div>
              <div className="demo-patient">
                <span className="patient-portrait" aria-hidden="true">MF<i /></span>
                <div><strong>M. Favre, 62 ans</strong><small>Douleur thoracique d’apparition aiguë</small></div>
              </div>
              <div className="demo-dialogue">
                <div className="student"><small>Vous</small><p>Bonjour Monsieur Favre. Qu’est-ce qui vous amène aujourd’hui&nbsp;?</p></div>
                <div><small>Patient simulé</small><p>J’ai une douleur dans la poitrine depuis ce matin. Ça serre fort.</p></div>
                <div className="student"><small>Vous</small><p>Est-ce que la douleur se déplace quelque part&nbsp;?</p></div>
                <div className="demo-listening"><span className="demo-listening-bars" aria-hidden="true"><i /><i /><i /><i /></span>Le patient répond…</div>
              </div>
              <div className="demo-score"><div><span>Anamnèse en cours</span><strong>6 éléments sur 10 explorés</strong></div><i><b style={{ width: "60%" }} /></i></div>
            </div>
            <div className="floating-card streak-card"><span><Clock3 aria-hidden="true" size={17} /></span><div><strong>{examMinutes} min</strong><small>en mode examen</small></div></div>
            <div className="floating-card xp-card"><span><ClipboardList aria-hidden="true" size={17} /></span><div><strong>22 points</strong><small>grille et diagnostic</small></div></div>
          </div>
        </section>

        <section className="landing-method" id="methode">
          <div className="landing-section-head landing-method-heading"><div><p className="eyebrow">UNE STATION COMPLÈTE</p><h2>Chaque étape prépare la suivante</h2></div><p>Mener l’entretien, examiner, conclure, puis revenir sur ce qui vous a échappé&nbsp;: le même déroulé que le jour de l’examen.</p></div>
          <p className="landing-catalog-proof">{hasStations ? "Anamnèse · Examen clinique · Synthèse · Débriefing" : "Contenu en préparation"}</p>
          <div className="pillar-grid four-pillars">
            <article className="pillar-card pillar-card-accent"><span className="pillar-number">01</span><div className="pillar-icon"><Ear size={23} /></div><p className="pillar-step">ÉCOUTER</p><h3>Anamnèse</h3><p>Menez l’entretien avec le patient simulé. Il répond à vos questions, sans souffler le diagnostic.</p><Link href="/methode#anamnese">Voir comment ça fonctionne <ArrowRight aria-hidden="true" size={14} /></Link></article>
            <article className="pillar-card" id="cas-cliniques"><span className="pillar-number">02</span><div className="pillar-icon"><Stethoscope size={23} /></div><p className="pillar-step">EXAMINER</p><h3>Examen clinique</h3><p>Choisissez vos gestes et vos examens. Chaque geste débloque son résultat.</p><Link href="/methode#examen">Explorer l’examen <ArrowRight aria-hidden="true" size={14} /></Link></article>
            <article className="pillar-card"><span className="pillar-number">03</span><div className="pillar-icon"><MessagesSquare size={23} /></div><p className="pillar-step">CONCLURE</p><h3>Synthèse</h3><p>Retenez un diagnostic parmi quatre propositions et rédigez votre prise en charge.</p><Link href="/methode#synthese">Découvrir la synthèse <ArrowRight aria-hidden="true" size={14} /></Link></article>
            <article className="pillar-card"><span className="pillar-number">04</span><div className="pillar-icon"><Target size={23} /></div><p className="pillar-step">PROGRESSER</p><h3>Débriefing</h3><p>Votre grille corrigée, les gestes oubliés, les drapeaux rouges et les points à revoir.</p><Link href="/methode#debriefing">Comprendre le bilan <ArrowRight aria-hidden="true" size={14} /></Link></article>
          </div>
          <Link className="landing-section-link" href="/methode">Découvrir toute la méthode <ArrowRight aria-hidden="true" size={16} /></Link>
        </section>

        <section className="landing-method" aria-labelledby="landing-voice-title">
          <div className="landing-section-head"><div><p className="eyebrow">MODE VOCAL</p><h2 id="landing-voice-title">Parlez au patient.<br />Il vous répond.</h2></div><p>Activez le micro et menez l’entretien à voix haute, comme le jour de l’examen. Le patient simulé répond à l’oral et tout l’échange reste affiché à l’écran. Le clavier reste disponible à tout moment.</p></div>
          <p className="landing-voice-note"><Mic aria-hidden="true" size={15} /> La voix dépend de votre navigateur&nbsp;: Chrome, Edge et Safari la prennent en charge.</p>
          <Link className="button primary" href={stationsHref}>Essayer à la voix <ArrowRight aria-hidden="true" size={16} /></Link>
        </section>

        <section className="landing-discover" aria-labelledby="landing-discover-title">
          <div className="landing-discover-head"><div><p className="eyebrow">EXPLORER {BRAND_NAME_UPPER}</p><h2 id="landing-discover-title">Les réponses importantes, avant même de créer un compte</h2></div><p>Voyez comment se déroule une station, ce qui est gratuit et dans quelle direction le projet avance.</p></div>
          <div className="landing-discover-grid">
            <Link className="landing-discover-card is-featured" href="/methode"><span><Route aria-hidden="true" size={23} /></span><small>{hasStations ? `${stats.caseCount} STATIONS · ${examMinutes} MIN EN MODE EXAMEN` : "STATIONS EN PRÉPARATION"}</small><h3>Comprendre le déroulé d’une station</h3><p>Les trois temps, les deux modes et la façon dont la grille est notée.</p><b>Voir la méthode <ArrowRight aria-hidden="true" size={15} /></b></Link>
            <Link className="landing-discover-card" href="/pricing"><span><CreditCard aria-hidden="true" size={22} /></span><small>ACCÈS ET FORMULES</small><h3>Voir les tarifs</h3><p>Commencez gratuitement et découvrez ce que prépare {BRAND_PRO_PLAN}.</p><b>Comparer les offres <ArrowRight aria-hidden="true" size={15} /></b></Link>
            <Link className="landing-discover-card" href="/faq"><span><HelpCircle aria-hidden="true" size={22} /></span><small>QUESTIONS FRÉQUENTES</small><h3>Lever les doutes avant de commencer</h3><p>Fonctionnement du patient simulé, notation, compte et progression.</p><b>Consulter la FAQ <ArrowRight aria-hidden="true" size={15} /></b></Link>
            <Link className="landing-discover-card" href="/a-propos"><span><Users aria-hidden="true" size={22} /></span><small>LE PROJET</small><h3>Comprendre le projet</h3><p>Pourquoi {BRAND_NAME} existe et les principes qui le guident.</p><b>Lire à propos <ArrowRight aria-hidden="true" size={15} /></b></Link>
            <Link className="landing-discover-card" href="/nouveautes"><span><Newspaper aria-hidden="true" size={22} /></span><small>JOURNAL DU PRODUIT</small><h3>Suivre les nouveautés</h3><p>Stations, fonctionnalités et améliorations récemment livrées.</p><b>Voir les évolutions <ArrowRight aria-hidden="true" size={15} /></b></Link>
          </div>
          {upcoming.length > 0 && <p className="landing-discover-more">PROCHAINEMENT<span>{upcoming.join(" · ")}</span></p>}
        </section>

        <section className="landing-audience">
          <div><p className="eyebrow">PENSÉ POUR VOTRE CURSUS</p><h2>Conçu pour les étudiants en médecine en Suisse</h2><p>Un outil d’entraînement exigeant, utilisable au quotidien et centré sur les situations que vous devez maîtriser.</p></div>
          <ul>
            <li><CheckCircle2 aria-hidden="true" size={20} /><span>Aligné sur les besoins du cursus et de l’examen fédéral</span></li>
            <li><CheckCircle2 aria-hidden="true" size={20} /><span>Utilisable sur mobile entre deux cours ou en session de révision</span></li>
            <li><CheckCircle2 aria-hidden="true" size={20} /><span>Idéal pour installer une routine régulière sans se disperser</span></li>
          </ul>
        </section>

        <section className="landing-cta">
          <span className="landing-cta-icon"><Sparkles aria-hidden="true" size={23} /></span>
          <p className="eyebrow">VOTRE PROCHAINE STATION PEUT COMMENCER ICI</p>
          <h2>Passez des révisions passives à un vrai entraînement clinique</h2>
          <p className="landing-cta-copy">Créez votre espace, choisissez une station et laissez {BRAND_NAME} organiser la suite.</p>
          <div className="landing-cta-prices"><span><b>Découverte</b> CHF 0</span><span><b>{BRAND_PRO_PLAN}</b> CHF 14.90/mois</span></div>
          <div className="landing-cta-actions"><Link className="button primary" href={enterHref}>{signedIn ? "Ouvrir mon espace" : "Créer mon compte gratuit"} <ArrowRight aria-hidden="true" size={17} /></Link><Link className="button secondary" href="/faq">Consulter la FAQ</Link></div>
        </section>
      </main>
    </div>
  );
}
