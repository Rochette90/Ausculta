import { ApiError, apiJson, assertSameOrigin, handleApiError, requireAuthenticatedUser } from "../../../lib/api-security";
import { blocksNewCheckout } from "../../../lib/billing";
import { enforceRateLimit } from "../../../lib/rate-limit";
import { appOrigin, getStripe } from "../../../lib/stripe";
import { createAdminClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId?.startsWith("price_")) {
      throw new ApiError(503, "billing_unavailable", "Abonnement indisponible");
    }

    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "billing-checkout", 5, 300);
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;

    const stripe = getStripe();
    let customerId = profile.stripe_customer_id as string | null;
    if (customerId) {
      // Retour sur /profil avant le webhook, double clic ou second onglet :
      // ne jamais ouvrir un second abonnement pour le même client.
      const existing = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
      if (existing.data.some((subscription) => blocksNewCheckout(subscription.status))) {
        throw new ApiError(409, "subscription_exists", "Un abonnement est déjà en cours. Gérez-le depuis « Gérer l’abonnement ».");
      }
      // En mode abonnement, Stripe ne crée l'abonnement qu'au paiement : une
      // session ouverte dans un autre onglet pourrait encore être payée. Seule
      // la dernière session reste valable.
      const openSessions = await stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 10 });
      await Promise.all(openSessions.data.map((openSession) => stripe.checkout.sessions.expire(openSession.id)));
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      const { error } = await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
      if (error) throw error;
    }

    const origin = appOrigin(request);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/profil?billing=success`,
      cancel_url: `${origin}/profil?billing=cancelled`,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
    });
    if (!session.url) throw new Error("Stripe Checkout URL missing");
    return apiJson({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
