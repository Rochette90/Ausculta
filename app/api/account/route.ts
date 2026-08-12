import { apiJson, handleApiError, requireAuthenticatedUser } from "../../lib/api-security";
import { enforceRateLimit } from "../../lib/rate-limit";
import { createAdminClient } from "../../../lib/supabase/server";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "account-read", 60, 60);
    const [{ data: profile, error: profileError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
      admin.from("profiles").select("full_name, avatar_url, plan, xp, level, streak, created_at").eq("id", user.id).single(),
      admin.from("subscriptions").select("status, price_id, current_period_end, cancel_at_period_end").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    ]);
    if (profileError) throw profileError;
    if (subscriptionError) throw subscriptionError;
    return apiJson({
      user: { id: user.id, email: user.email, ...profile },
      subscription: subscriptions?.[0] ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
