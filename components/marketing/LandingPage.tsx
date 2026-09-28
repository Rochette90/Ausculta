import { Activity, ArrowRight, BookOpenCheck, BrainCircuit, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, CreditCard, Flame, Gauge, LibraryBig, Newspaper, ShieldCheck, Sparkles, Stethoscope, Target } from "lucide-react";
import Link from "next/link";
import type { MarketingStats } from "@/lib/marketing/stats";
import { featuredStudySession } from "@/lib/study-sessions/catalog";
import { studySessionTitle } from "@/lib/study-sessions/mastery";
import { BRAND_NAME, BRAND_NAME_UPPER, BRAND_PRO_PLAN } from "@/lib/brand";

export function LandingPage({ signedIn, stats }: { signedIn: boolean; stats: MarketingStats }) {
  // Un visiteur anonyme n'a ni tableau de bord ni espace : le premier écran
  // propose d'essayer une séance, et mène en un clic au parcours d'inscription.
  const trySessionHref = `/signup?next=${encodeURIComponent(`/sessions/${featuredStudySession.slug}`)}`;
  const enterHref = signedIn ? "/dashboard" : trySessionHref;
  const primaryLabel = signedIn ? "Ouvrir mon tableau de bord" : "Essayer une séance gratuite";
  // Maîtrise illustrée dans la maquette produit du hero.
  const heroMastery = 72;
  const hasPublishedContent = stats.pathologyCount > 0 || stats.questionCount > 0 || stats.caseCount > 0;

  return (
    <div className="landing-page page-enter">
      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <h1 id="landing-title">Réviser moins au hasard.<br /><span className="landing-hero-emphasis">Raisonner comme en clinique.</span></h1>
            <p>Fiches structurées, anatomie clinique, QCM expliqués et cas cliniques réunis dans un parcours qui transforme vos révisions en décisions solides.</p>
            <div className="landing-actions">
              <Link className="button primary" href={enterHref}>{primaryLabel} <ArrowRight aria-hidden="true" size={17} /></Link>
              <Link className="button secondary" href="/methode">Découvrir la méthode <ChevronRight aria-hidden="true" size={16} /></Link>
            </div>
          </div>

          <div className="landing-hero-product" aria-label={`Aperçu du tableau de bord ${BRAND_NAME}`}>
            <div className="hero-product-glow" aria-hidden="true" />
            <div className="hero-product-card">
              <div className="hero-product-topbar">
                <div><span className="hero-product-status" /> Aujourd’hui</div>
                <span><Flame aria-hidden="true" size={14} /> 7 jours</span>
              </div>
              <div className="hero-product-welcome">
                <div><small>VOTRE PROCHAINE ÉTAPE</small><h2>{studySessionTitle(featuredStudySession.subject, heroMastery)}</h2></div>
                <span className="hero-level-ring"><b>{heroMastery}%</b><small>maîtrisé</small></span>
              </div>
              <div className="hero-study-plan">
                <div className="hero-plan-item is-complete"><span><BookOpenCheck aria-hidden="true" size={18} /></span><div><strong>Fiche · Syndrome coronarien aigu</strong><small>Lecture terminée · +20 XP</small></div><CheckCircle2 aria-hidden="true" size={18} /></div>
                <div className="hero-plan-item is-current"><span><BrainCircuit aria-hidden="true" size={18} /></span><div><strong>QCM · Douleur thoracique</strong><small>4 questions · environ 6 min</small></div><ArrowRight aria-hidden="true" size={18} /></div>
                <div className="hero-plan-item"><span><Stethoscope aria-hidden="true" size={18} /></span><div><strong>Cas clinique · Urgences</strong><small>Débloqué après le QCM</small></div><Clock3 aria-hidden="true" size={17} /></div>
              </div>
              <div className="hero-product-progress"><div><span>Objectif hebdomadaire</span><strong>3 activités sur 5</strong></div><i><b /></i></div>
            </div>
            <div className="hero-floating-proof hero-proof-xp"><Sparkles aria-hidden="true" size={17} /><span><strong>+45 XP</strong><small>aujourd’hui</small></span></div>
            <div className="hero-floating-proof hero-proof-focus"><Gauge aria-hidden="true" size={17} /><span><strong>12 min</strong><small>session ciblée</small></span></div>
          </div>
        </section>

        <section className="landing-method" id="methode">
          <div className="landing-section-head landing-method-heading"><div><p className="eyebrow">UNE BOUCLE D’APPRENTISSAGE COMPLÈTE</p><h2>Chaque format prépare le suivant</h2></div><p>Comprendre une pathologie, vérifier ses acquis, décider dans un cas concret puis revenir sur les points fragiles.</p></div>
          <p className="landing-catalog-proof">{hasPublishedContent ? "Fiches · QCM · Cas cliniques · Progression" : "Contenu en préparation"}</p>
          <div className="pillar-grid four-pillars">
            <article className="pillar-card"><span className="pillar-number">01</span><div className="pillar-icon"><BookOpenCheck size={23} /></div><p className="pillar-step">COMPRENDRE</p><h3>Fiches structurées</h3><p>Pathologies claires et structurées&nbsp;: définition, symptômes, examens, traitements.</p><Link href="/methode#fiches">Voir comment ça fonctionne <ArrowRight aria-hidden="true" size={14} /></Link></article>
            <article className="pillar-card pillar-card-accent" id="qcm"><span className="pillar-number">02</span><div className="pillar-icon"><ClipboardCheck size={23} /></div><p className="pillar-step">TESTER</p><h3>QCM avec correction</h3><p>Questions avec correction détaillée. Entraînez-vous par spécialité ou en mode examen.</p><Link href="/methode#qcm">Explorer les QCM <ArrowRight aria-hidden="true" size={14} /></Link></article>
            <article className="pillar-card" id="cas-cliniques"><span className="pillar-number">03</span><div className="pillar-icon"><Stethoscope size={23} /></div><p className="pillar-step">APPLIQUER</p><h3>Cas cliniques</h3><p>Scénarios réalistes pour travailler le raisonnement diagnostique et thérapeutique.</p><Link href="/methode#cas-cliniques">Découvrir les cas <ArrowRight aria-hidden="true" size={14} /></Link></article>
            <article className="pillar-card"><span className="pillar-number">04</span><div className="pillar-icon"><Target size={23} /></div><p className="pillar-step">CONSOLIDER</p><h3>Progression visible</h3><p>XP, niveaux, série quotidienne et suivi de vos points forts et de vos lacunes.</p><Link href="/methode#progression">Comprendre le suivi <ArrowRight aria-hidden="true" size={14} /></Link></article>
          </div>
          <Link className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 font-bold text-[var(--ink)] no-underline transition hover:border-[var(--primary)] hover:text-[var(--primary)]" href="/methode">Découvrir toute la méthode <ArrowRight aria-hidden="true" size={16} /></Link>
        </section>

        <section className="landing-method" aria-labelledby="landing-anatomy-title">
          <div className="landing-section-head"><div><p className="eyebrow">ANATOMIE CLINIQUE</p><h2 id="landing-anatomy-title">Comprendre la structure.<br />Expliquer le symptôme.</h2></div><p>Six modules relient les repères anatomiques aux fiches médicales. Explorez, testez votre mémoire, puis appliquez vos connaissances à un mini-cas corrigé.</p></div>
          <Link className="button primary" href={signedIn ? "/anatomie" : "/signup?next=%2Fanatomie"}>Explorer l’anatomie <ArrowRight aria-hidden="true" size={16} /></Link>
        </section>

        <section className="landing-discover" aria-labelledby="landing-discover-title">
          <div className="landing-discover-head"><div><p className="eyebrow">EXPLORER {BRAND_NAME_UPPER}</p><h2 id="landing-discover-title">Les réponses importantes, avant même de créer un compte</h2></div><p>Voyez ce qui est disponible, comment le contenu est validé et dans quelle direction le projet avance.</p></div>
          <div className="landing-discover-grid">
            <Link className="landing-discover-card is-featured" href="/catalogue"><span><LibraryBig aria-hidden="true" size={23} /></span><small>{stats.pathologyCount} FICHES · {stats.specialtyCount} SPÉCIALITÉS</small><h3>Explorer le catalogue médical</h3><p>Recherchez une pathologie et découvrez tous les sujets déjà disponibles.</p><b>Voir le catalogue <ArrowRight aria-hidden="true" size={15} /></b></Link>
            <Link className="landing-discover-card" href="/qualite"><span><ShieldCheck aria-hidden="true" size={22} /></span><small>TRANSPARENCE ÉDITORIALE</small><h3>Comprendre la qualité scientifique</h3><p>Statut de révision, signature et mise à jour des fiches.</p><b>Notre processus <ArrowRight aria-hidden="true" size={15} /></b></Link>
            <Link className="landing-discover-card" href="/pricing"><span><CreditCard aria-hidden="true" size={22} /></span><small>ACCÈS ET FORMULES</small><h3>Voir les tarifs</h3><p>Commencez gratuitement et découvrez ce que prépare {BRAND_PRO_PLAN}.</p><b>Comparer les offres <ArrowRight aria-hidden="true" size={15} /></b></Link>
            <Link className="landing-discover-card" href="/tutoriels"><span><Activity aria-hidden="true" size={22} /></span><small>ECG · RADIO THORAX</small><h3>Apprendre une lecture systématique</h3><p>Deux parcours interactifs avec étapes, check-lists et auto-évaluation.</p><b>Ouvrir les tutoriels <ArrowRight aria-hidden="true" size={15} /></b></Link>
            <Link className="landing-discover-card" href="/nouveautes"><span><Newspaper aria-hidden="true" size={22} /></span><small>JOURNAL DU PRODUIT</small><h3>Suivre les nouveautés</h3><p>Contenu, fonctionnalités et améliorations récemment livrées.</p><b>Voir les évolutions <ArrowRight aria-hidden="true" size={15} /></b></Link>
          </div>
        </section>

        <section className="landing-audience">
          <div><p className="eyebrow">PENSÉ POUR VOTRE CURSUS</p><h2>Conçu pour les étudiants en médecine en Suisse</h2><p>Un outil de révision exigeant, utilisable au quotidien et centré sur les situations que vous devez maîtriser.</p></div>
          <ul>
            <li><CheckCircle2 aria-hidden="true" size={20} /><span>Aligné sur les besoins du cursus et de l’examen fédéral</span></li>
            <li><CheckCircle2 aria-hidden="true" size={20} /><span>Utilisable sur mobile entre deux cours ou en session de révision</span></li>
            <li><CheckCircle2 aria-hidden="true" size={20} /><span>Idéal pour installer une routine régulière sans se disperser</span></li>
          </ul>
        </section>

        <section className="landing-cta">
          <span className="landing-cta-icon"><Sparkles aria-hidden="true" size={23} /></span>
          <p className="eyebrow">VOTRE PROCHAINE SESSION PEUT COMMENCER ICI</p>
          <h2>Passez des révisions passives à un vrai entraînement clinique</h2>
          <p className="landing-cta-copy">Créez votre espace, choisissez une spécialité et laissez {BRAND_NAME} organiser la suite.</p>
          <div className="landing-cta-prices"><span><b>Découverte</b> CHF 0</span><span><b>{BRAND_PRO_PLAN}</b> CHF 14.90/mois</span></div>
          <div className="landing-cta-actions"><Link className="button primary" href={enterHref}>{signedIn ? "Ouvrir mon espace" : "Créer mon compte gratuit"} <ArrowRight aria-hidden="true" size={17} /></Link><Link className="button secondary" href="/faq">Consulter la FAQ</Link></div>
        </section>
      </main>
    </div>
  );
}
