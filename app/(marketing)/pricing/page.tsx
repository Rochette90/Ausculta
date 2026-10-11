import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pricing, type PricingPlan } from "../../../components/ui/pricing";
import { getCurrentUser } from "../../../lib/auth/require-user";
import { BRAND_NAME, BRAND_PLAN_LABEL, BRAND_PRO_PLAN, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Tarifs"),
  description: `Découvrez les offres ${BRAND_NAME} pour préparer vos ECOS avec un patient simulé.`,
};
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const startHref = user ? "/dashboard" : "/signup?next=%2Fcas";
  const proHref = user ? "/profil" : "/signup?next=%2Fprofil";
  const plans: PricingPlan[] = [
    {
      name: "Découverte",
      eyebrow: "POUR COMMENCER",
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: `L’essentiel pour découvrir les stations ${BRAND_NAME} et installer une routine régulière.`,
      features: [
        "Stations ECOS avec patient simulé, à l’écrit ou à la voix",
        "Modes entraînement et examen",
        "Grille corrigée et débriefing après chaque station",
        "Tableau de bord, XP et série quotidienne",
        "Progression sauvegardée sur tous vos appareils",
      ],
      buttonText: user ? "Continuer gratuitement" : "Créer mon compte",
      href: startHref,
    },
    {
      name: BRAND_PRO_PLAN,
      eyebrow: "ENTRAÎNEMENT COMPLET",
      monthlyPrice: 14.9,
      yearlyPrice: 119,
      description: "Pour s’entraîner plus intensément, cibler vos lacunes et consolider votre raisonnement clinique.",
      features: [
        "Fiches de révision et QCM à leur arrivée",
        "Statistiques détaillées de vos stations",
        "Accès prioritaire aux nouvelles stations",
      ],
      buttonText: "Bientôt disponible",
      href: proHref,
      isPopular: false,
      isAvailable: false,
    },
  ];

  return (
    <>
      <main>
        <Pricing plans={plans} description={`${BRAND_NAME} est aujourd’hui 100% gratuit. La formule ${BRAND_PLAN_LABEL} arrive bientôt.`} />
        <section className="mx-auto mb-20 w-[calc(100%-2rem)] max-w-[1180px] overflow-hidden rounded-[32px] bg-[var(--surface-dark)] px-6 py-10 text-center sm:px-10 sm:py-14">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-teal-300">UNE QUESTION AVANT DE COMMENCER ?</p>
          <h2 className="mx-auto mb-0 mt-3 max-w-2xl text-balance text-3xl text-white sm:text-4xl">Commencez gratuitement, choisissez {BRAND_PLAN_LABEL} quand vous en avez besoin.</h2>
          <p className="mx-auto mb-0 mt-4 max-w-xl text-sm leading-6 text-slate-300">Votre progression reste enregistrée si vous changez d’offre. Aucun engagement à long terme.</p>
          <Link className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-950 no-underline transition-transform hover:-translate-y-0.5" href={startHref}>
            <ArrowLeft aria-hidden="true" size={16} /> {user ? "Retour au tableau de bord" : "Créer mon espace gratuit"}
          </Link>
        </section>
      </main>
    </>
  );
}
