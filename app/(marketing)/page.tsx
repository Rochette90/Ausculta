import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/LandingPage";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getMarketingStats } from "@/lib/marketing/stats";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Fiches, QCM et cas cliniques`,
  description: "Comprenez les pathologies, entraînez-vous avec des QCM expliqués et développez votre raisonnement clinique.",
};
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [user, stats] = await Promise.all([getCurrentUser(), getMarketingStats()]);
  return <LandingPage signedIn={Boolean(user)} stats={stats} />;
}
