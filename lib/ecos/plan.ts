import type { SupabaseClient } from "@supabase/supabase-js";
import { ecosPlan, ecosQuotas, type EcosPlan, type EcosQuotas } from "./quotas";

/**
 * Offre et quotas du compte qui appelle une route ECOS. Le plan vient de
 * `profiles.plan`, tenu à jour par le webhook Stripe ; un profil absent ou
 * une erreur de lecture valent Découverte, jamais Premium.
 */
export async function ecosQuotasForUser(admin: SupabaseClient, userId: string): Promise<{ plan: EcosPlan; quotas: EcosQuotas }> {
  const { data, error } = await admin.from("profiles").select("plan").eq("id", userId).maybeSingle();
  if (error) throw error;
  const plan = ecosPlan(data?.plan);
  return { plan, quotas: ecosQuotas(process.env, plan) };
}
