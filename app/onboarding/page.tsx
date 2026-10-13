import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { requireUser } from "@/lib/auth/require-user";
import { DEFAULT_AFTER_LOGIN_PATH, safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingMetadata } from "@/lib/onboarding/metadata";
import { pageTitle } from "@/lib/brand";
import { ONBOARDING_ASKS_SPECIALTIES } from "@/lib/features";
import { zurichDate } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Personnaliser votre espace") };

function safeNext(value?: string) {
  const path = safeRedirectPath(value);
  return path.startsWith("/onboarding") ? DEFAULT_AFTER_LOGIN_PATH : path;
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const nextPath = safeNext((await searchParams).next);
  const user = await requireUser(`/onboarding?next=${encodeURIComponent(nextPath)}`);
  const onboarding = getOnboardingMetadata(user);
  const supabase = await createClient();
  const [{ data: profile }, { data: specialties, error: specialtiesError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarding_completed_at, onboarding_skipped_at")
      .eq("id", user.id)
      .maybeSingle(),
    !ONBOARDING_ASKS_SPECIALTIES ? { data: [], error: null } : supabase
      .from("specialties")
      .select("id, name, icon")
      .order("order_index"),
  ]);

  if (profile?.onboarding_completed_at || profile?.onboarding_skipped_at || onboarding.completedAt || onboarding.skippedAt) redirect(nextPath);
  if (specialtiesError) throw new Error("Les spécialités sont momentanément indisponibles.");

  return <OnboardingFlow minimumExamDate={zurichDate()} nextPath={nextPath} specialties={specialties ?? []} />;
}
