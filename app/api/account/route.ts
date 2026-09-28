import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  requireAuthenticatedUser,
} from "../../lib/api-security";
import { getStripe } from "../../lib/stripe";
import { enforceRateLimit } from "../../lib/rate-limit";
import { createAdminClient } from "../../../lib/supabase/server";

export async function DELETE(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "account-delete", 3, 3_600);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("stripe_customer_id, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    // Résilier la facturation avant de supprimer le compte : un échec ici
    // doit bloquer la suppression pour ne pas laisser un abonnement orphelin.
    if (profile?.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = getStripe();
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: "active",
          limit: 10,
        });
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id);
        }
      } catch {
        throw new ApiError(502, "billing_cancellation_failed", "La résiliation de l’abonnement a échoué. Réessayez ou contactez le support.");
      }
    }

    if (profile?.avatar_url?.startsWith(`${user.id}/`)) {
      await admin.storage.from("avatars").remove([profile.avatar_url]);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return apiJson({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
