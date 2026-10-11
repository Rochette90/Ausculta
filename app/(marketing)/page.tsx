import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/LandingPage";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getMarketingStats } from "@/lib/marketing/stats";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
  description: "Entraînez-vous aux ECOS face à un patient simulé qui vous répond, à l’écrit ou à la voix, puis recevez votre grille corrigée et un débriefing.",
};
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [user, stats] = await Promise.all([getCurrentUser(), getMarketingStats()]);
  return <LandingPage signedIn={Boolean(user)} stats={stats} />;
}
