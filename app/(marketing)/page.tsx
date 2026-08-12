import type { Metadata } from "next";
import { MarketingLanding } from "../../components/marketing/MarketingLanding";
import { getCurrentUser } from "../../lib/auth/require-user";
import { getMarketingStats } from "../../lib/marketing/stats";

export const metadata: Metadata = {
  title: "MedTrain — Fiches, QCM et cas cliniques",
  description: "Comprenez les pathologies, entraînez-vous avec des QCM expliqués et développez votre raisonnement clinique.",
};
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [user, stats] = await Promise.all([getCurrentUser(), getMarketingStats()]);
  return <MarketingLanding signedIn={Boolean(user)} stats={stats} />;
}
