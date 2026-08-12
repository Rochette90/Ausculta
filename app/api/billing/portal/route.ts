import { ApiError, apiJson, assertSameOrigin, handleApiError, requireAuthenticatedUser } from "../../../lib/api-security";
import { enforceRateLimit } from "../../../lib/rate-limit";
import { appOrigin, getStripe } from "../../../lib/stripe";
import { createAdminClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "billing-portal", 10, 300);
    const { data: profile, error } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    if (!profile.stripe_customer_id) {
      throw new ApiError(404, "customer_not_found", "Aucun abonnement à gérer");
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appOrigin(request)}/?app=1`,
    });
    return apiJson({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
