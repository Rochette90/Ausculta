import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "../../../lib/auth/require-user";
import { BRAND_NAME, BRAND_PLAN_LABEL, BRAND_PRO_PLAN, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Tarifs"),
  description: `Découvrez les offres ${BRAND_NAME} pour préparer vos ECOS avec un patient simulé.`,
};
export const dynamic = "force-dynamic";

// Prix annoncés de la future formule ; elle n’est pas encore en vente (Stripe non ouvert).
const PREMIUM_MONTHLY = "14.90";
const PREMIUM_YEARLY = "119";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const startHref = user ? "/dashboard" : "/signup?next=%2Fcas";

  return (
    <main>
      <header className="mk-head mk-wrap">
        <h1>Gratuit aujourd’hui.</h1>
        <p className="lead">{BRAND_NAME} est aujourd’hui entièrement gratuit, stations comprises. La formule {BRAND_PLAN_LABEL} arrivera plus tard ; votre progression sera conservée si vous changez d’offre.</p>
      </header>

      <section className="mk-section is-surface" aria-label="Les offres">
        <div className="mk-wrap">
          <div className="plans">
            <article className="plan is-current">
              <h2>Découverte</h2>
              <p className="plan-status">Disponible maintenant</p>
              <p className="plan-price"><strong>CHF 0</strong><span>sans carte bancaire</span></p>
              <p className="plan-desc">L’essentiel pour découvrir les stations {BRAND_NAME} et installer une routine régulière.</p>
              <ul>
                <li>Stations ECOS avec patient simulé, à l’écrit ou à la voix</li>
                <li>Modes entraînement et examen</li>
                <li>Grille corrigée et débriefing après chaque station</li>
                <li>Tableau de bord, XP et série quotidienne</li>
                <li>Progression sauvegardée sur tous vos appareils</li>
              </ul>
              <Link className="button primary full" href={startHref}>{user ? "Continuer gratuitement" : "Créer mon compte"}</Link>
            </article>

            <article className="plan">
              <h2>{BRAND_PRO_PLAN}</h2>
              <p className="plan-status">Bientôt disponible</p>
              <p className="plan-price"><strong>CHF {PREMIUM_MONTHLY}</strong><span>par mois</span></p>
              <p className="plan-alt">ou CHF {PREMIUM_YEARLY} par an</p>
              <p className="plan-desc">Pour s’entraîner plus intensément, cibler vos lacunes et consolider votre raisonnement clinique.</p>
              <ul>
                <li>Fiches de révision et QCM à leur arrivée</li>
                <li>Statistiques détaillées de vos stations</li>
                <li>Accès prioritaire aux nouvelles stations</li>
              </ul>
              <button className="button quiet full" disabled type="button">Pas encore en vente</button>
            </article>
          </div>
          <ul className="plans-notes">
            <li>Paiement sécurisé par Stripe, le moment venu</li>
            <li>Résiliable à tout moment</li>
            <li>Support en français</li>
          </ul>
        </div>
      </section>

      <section className="mk-end" aria-labelledby="pricing-end-title">
        <div className="mk-wrap">
          <h2 id="pricing-end-title">Commencez gratuitement, sans engagement.</h2>
          <p>Votre progression reste enregistrée si vous changez d’offre plus tard.</p>
          <Link className="button primary" href={startHref}>{user ? "Retour au tableau de bord" : "Créer mon espace gratuit"}</Link>
        </div>
      </section>
    </main>
  );
}
