"use client";

import { useRouter } from "next/navigation";
import { LandingPage } from "../../app/MedTrainApp";
import type { MarketingStats } from "../../lib/marketing/stats";

export function MarketingLanding({ signedIn, stats }: { signedIn: boolean; stats: MarketingStats }) {
  const router = useRouter();
  return <LandingPage onEnter={() => router.push(signedIn ? "/dashboard" : "/signup?next=%2Fdashboard")} signedIn={signedIn} stats={stats} />;
}
