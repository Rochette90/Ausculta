import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  requireAuthenticatedUser,
} from "../../lib/api-security";
import { needsCancellation } from "../../lib/billing";
import { getStripe } from "../../lib/stripe";
import { enforceRateLimit } from "../../lib/rate-limit";
import { createAdminClient } from "../../../lib/supabase/server";
import { isOwnAvatarPath } from "../../../lib/profile/avatar-path";

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
        // Tous les statuts, pas seulement `active` : un essai (`trialing`) ou un
        // impayé (`past_due`, `unpaid`) continuerait sinon à être facturé.
        for await (const subscription of stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: "all",
          limit: 100,
        })) {
          if (needsCancellation(subscription.status)) await stripe.subscriptions.cancel(subscription.id);
        }
      } catch {
        throw new ApiError(502, "billing_cancellation_failed", "La résiliation de l’abonnement a échoué. Réessayez ou contactez le support.");
      }
    }

    if (profile?.avatar_url && isOwnAvatarPath(user.id, profile.avatar_url)) {
      await admin.storage.from("avatars").remove([profile.avatar_url]);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return apiJson({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
