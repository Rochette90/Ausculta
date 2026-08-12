import { cache } from "react";
import { createClient } from "../supabase/server";

export const getProfileSummary = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, plan, role, xp, level, streak, stripe_customer_id, created_at")
    .eq("id", userId)
    .maybeSingle();
  return data;
});
