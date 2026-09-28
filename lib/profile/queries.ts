import { cache } from "react";
import { zurichDate } from "../dates";
import { activeStreak } from "../progress/streak";
import { createClient } from "../supabase/server";

export const getProfileSummary = cache(async (userId: string) => {
  const supabase = await createClient();
  const [{ data: profile }, { data: onboarding }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, plan, role, xp, level, streak, last_activity_date, stripe_customer_id, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("onboarding_completed_at, onboarding_skipped_at")
      .eq("id", userId)
      .maybeSingle(),
  ]);
  if (!profile) return null;
  return {
    ...profile,
    streak: activeStreak(profile.streak, profile.last_activity_date, zurichDate()),
    onboarding_completed_at: onboarding?.onboarding_completed_at ?? null,
    onboarding_skipped_at: onboarding?.onboarding_skipped_at ?? null,
  };
});
