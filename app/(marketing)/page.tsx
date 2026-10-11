import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/LandingPage";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getMarketingStats } from "@/lib/marketing/stats";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
  description: "Préparez vos ECOS face à un patient simulé, puis consolidez avec des fiches structurées, des QCM expliqués et l’anatomie clinique.",
};
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [user, stats] = await Promise.all([getCurrentUser(), getMarketingStats()]);
  return <LandingPage signedIn={Boolean(user)} stats={stats} />;
}
