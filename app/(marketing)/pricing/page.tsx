import type { Metadata } from "next";
import Link from "next/link";
import { PricingCheckoutButton } from "@/components/marketing/PricingCheckoutButton";
import { getCurrentUser } from "@/lib/auth/require-user";
import { BRAND_NAME, BRAND_PLAN_LABEL, BRAND_PRO_PLAN, pageTitle } from "@/lib/brand";
import { ecosQuotasForUser } from "@/lib/ecos/plan";
import { ecosQuotas, type EcosQuotas } from "@/lib/ecos/quotas";
import { premiumOnSale } from "@/lib/features";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: pageTitle("Tarifs"),
  description: `Découverte gratuite ou ${BRAND_PLAN_LABEL} : les offres ${BRAND_NAME} pour préparer vos ECOS avec un patient simulé.`,
};
export const dynamic = "force-dynamic";

// Prix annoncés de la formule Premium ; le montant facturé est celui du prix Stripe.
const PREMIUM_MONTHLY = "14.90";
const PREMIUM_YEARLY = "119";

/** Nombre à la suisse (« 100'000 »), comme ailleurs dans l'application. */
const count = (value: number) => value.toLocaleString("fr-CH");
const plural = (value: number, singular: string, pluralForm = `${singular}s`) => `${count(value)} ${value > 1 ? pluralForm : singular}`;

/** Lignes du comparatif : une étiquette et la valeur de chaque offre. */
function comparison(free: EcosQuotas, pro: EcosQuotas) {
  return [
    { label: "Stations par jour", free: plural(free.dailySessions, "station"), pro: plural(pro.dailySessions, "station") },
    { label: "Questions au patient par jour", free: count(free.dailyMessages), pro: count(pro.dailyMessages) },
    { label: "Voix réaliste du patient", free: `${plural(free.dailyVoiceReplies, "réplique")} par jour en aperçu, puis voix du navigateur`, pro: `${plural(pro.dailyVoiceReplies, "réplique")} par jour` },
    { label: "Modes entraînement et examen", free: "Oui", pro: "Oui" },
    { label: "Grille corrigée et débriefing", free: "Oui", pro: "Oui" },
    { label: "Tableau de bord, XP et jalons", free: "Oui", pro: "Oui" },
    { label: "Fiches de révision et QCM, à leur arrivée", free: "—", pro: "Inclus" },
  ];
}

export default async function PricingPage() {
  const user = await getCurrentUser();
  const { plan } = user ? await ecosQuotasForUser(createAdminClient(), user.id) : { plan: "free" as const };
  const free = ecosQuotas(process.env, "free");
  const pro = ecosQuotas(process.env, "pro");
  const onSale = premiumOnSale();
  const isPro = plan === "pro";
  const startHref = user ? "/dashboard" : "/signup?next=%2Fcas";
  const rows = comparison(free, pro);

  return (
    <main>
      <header className="mk-head mk-wrap">
        <h1>Gratuit pour s’entraîner. {BRAND_PLAN_LABEL} pour s’entraîner sans compter.</h1>
        <p className="lead">Les deux offres donnent accès aux mêmes stations, à la même notation et au même débriefing. Elles diffèrent par le volume quotidien et par la voix réaliste du patient, qui a un coût réel à chaque réplique.</p>
      </header>

      <section className="mk-section is-surface" aria-label="Les offres">
        <div className="mk-wrap">
          <div className="plans">
            <article className={`plan${isPro ? "" : " is-current"}`}>
              <h2>Découverte</h2>
              <p className="plan-status">{isPro ? "Inclus dans votre offre" : user ? "Votre offre actuelle" : "Sans carte bancaire"}</p>
              <p className="plan-price"><strong>CHF 0</strong><span>pour toujours</span></p>
              <p className="plan-desc">De quoi s’entraîner chaque jour et installer une routine, avec un aperçu de la voix réaliste.</p>
              <ul>
                <li>{plural(free.dailySessions, "station")} par jour, en mode entraînement ou examen</li>
                <li>{count(free.dailyMessages)} questions au patient par jour</li>
                <li>Voix réaliste du patient : {plural(free.dailyVoiceReplies, "réplique")} par jour, puis la voix du navigateur prend le relais</li>
                <li>Grille corrigée et débriefing après chaque station</li>
                <li>Tableau de bord, XP et jalons, sur tous vos appareils</li>
              </ul>
              <Link className={`button ${isPro ? "quiet" : "primary"} full`} href={startHref}>{user ? "Aller aux stations" : "Créer mon compte"}</Link>
            </article>

            <article className={`plan is-featured${isPro ? " is-current" : ""}`}>
              <p className="plan-ribbon">Pour préparer un examen</p>
              <h2>{BRAND_PRO_PLAN}</h2>
              <p className="plan-status">{isPro ? "Votre offre actuelle" : onSale ? "Résiliable à tout moment" : "Bientôt disponible"}</p>
              <p className="plan-price"><strong>CHF {PREMIUM_MONTHLY}</strong><span>par mois</span></p>
              <p className="plan-alt">ou CHF {PREMIUM_YEARLY} par an</p>
              <p className="plan-desc">Pour enchaîner les stations avant un examen, à la voix, sans surveiller un compteur.</p>
              <ul>
                <li>{plural(pro.dailySessions, "station")} par jour</li>
                <li>{count(pro.dailyMessages)} questions au patient par jour</li>
                <li>Voix réaliste du patient : {plural(pro.dailyVoiceReplies, "réplique")} par jour</li>
                <li>Fiches de révision et QCM, dès leur arrivée</li>
                <li>Accès prioritaire aux nouvelles stations</li>
              </ul>
              {isPro
                ? <Link className="button quiet full" href="/profil">Gérer mon abonnement</Link>
                : !onSale
                  ? <button className="button quiet full" disabled type="button">Pas encore en vente</button>
                  : user
                    ? <PricingCheckoutButton label={`Passer à ${BRAND_PLAN_LABEL}`} />
                    : <Link className="button primary full" href="/signup?next=%2Fpricing">Créer mon compte pour m’abonner</Link>}
            </article>
          </div>

          <table className="plans-table">
            <caption>Ce que comprend chaque offre</caption>
            <thead>
              <tr><th scope="col">Chaque jour</th><th scope="col">Découverte</th><th scope="col">{BRAND_PLAN_LABEL}</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}><th scope="row">{row.label}</th><td>{row.free}</td><td>{row.pro}</td></tr>
              ))}
            </tbody>
          </table>

          <ul className="plans-notes">
            <li>Les limites sont quotidiennes et se remettent à zéro chaque jour</li>
            <li>Au-delà, la station continue : le patient répond toujours, avec la voix du navigateur</li>
            <li>Paiement sécurisé par Stripe, résiliable à tout moment</li>
            <li>Votre progression est conservée si vous changez d’offre</li>
          </ul>
        </div>
      </section>

      <section className="mk-end" aria-labelledby="pricing-end-title">
        <div className="mk-wrap">
          <h2 id="pricing-end-title">Commencez gratuitement, sans engagement.</h2>
          <p>Passez à {BRAND_PLAN_LABEL} le jour où le compteur vous gêne, pas avant.</p>
          <Link className="button primary" href={startHref}>{user ? "Retour au tableau de bord" : "Créer mon espace gratuit"}</Link>
        </div>
      </section>
    </main>
  );
}
