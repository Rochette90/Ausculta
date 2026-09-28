import Stripe from "stripe";
import { ApiError, apiJson, handleApiError } from "../../../lib/api-security";
import { grantsPro } from "../../../lib/billing";
import { getStripe } from "../../../lib/stripe";
import { createAdminClient } from "../../../../lib/supabase/server";
import { UUID_PATTERN } from "@/lib/validation";

type SubscriptionShape = {
  id: string;
  customer: string | { id: string };
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  items?: { data?: Array<{ price?: { id?: string }; current_period_end?: number }> };
  metadata?: Record<string, string>;
};

function idOf(value: string | { id: string }) {
  return typeof value === "string" ? value : value.id;
}

/**
 * Stripe may deliver events out of order or retry them days later, so the
 * subscription is re-read from Stripe instead of trusting the event snapshot.
 */
async function currentSubscription(snapshot: SubscriptionShape): Promise<SubscriptionShape> {
  try {
    return (await getStripe().subscriptions.retrieve(snapshot.id)) as unknown as SubscriptionShape;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing") return snapshot;
    throw error;
  }
}

async function syncSubscription(snapshot: SubscriptionShape) {
  const admin = createAdminClient();
  const subscription = await currentSubscription(snapshot);
  const customerId = idOf(subscription.customer);
  const metadataUserId = subscription.metadata?.supabase_user_id;
  const ownerQuery = metadataUserId && UUID_PATTERN.test(metadataUserId)
    ? admin.from("profiles").select("id").eq("id", metadataUserId).maybeSingle()
    : admin.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  const { data: owner, error: ownerError } = await ownerQuery;
  if (ownerError) throw ownerError;
  // Compte supprimé (ses abonnements sont résiliés juste avant) : rien à
  // synchroniser. Répondre 200 évite que Stripe relance l'événement.
  if (!owner) return;

  const userId = owner.id as string;
  const periodEnd = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
  const { error } = await admin.from("subscriptions").upsert({
    id: subscription.id,
    user_id: userId,
    customer_id: customerId,
    price_id: subscription.items?.data?.[0]?.price?.id ?? null,
    status: subscription.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
  });
  if (error) throw error;

  // Le plan dépend de tous les abonnements de l'utilisateur, pas seulement de
  // celui de l'événement : résilier un doublon ne doit pas retirer l'accès Pro.
  const { data: subscriptions, error: listError } = await admin
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId);
  if (listError) throw listError;
  const plan = (subscriptions ?? []).some((row) => grantsPro(String(row.status))) ? "pro" : "free";
  const { error: profileError } = await admin.from("profiles").update({ plan }).eq("id", userId);
  if (profileError) throw profileError;
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !secret) {
      throw new ApiError(400, "invalid_webhook", "Signature webhook invalide");
    }
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > 1_000_000) {
      throw new ApiError(413, "payload_too_large", "Webhook trop volumineux");
    }
    const payload = await request.text();
    if (new TextEncoder().encode(payload).byteLength > 1_000_000) {
      throw new ApiError(413, "payload_too_large", "Webhook trop volumineux");
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(payload, signature, secret);
    } catch {
      throw new ApiError(400, "invalid_webhook", "Signature webhook invalide");
    }

    const admin = createAdminClient();
    const { data: existing, error: lookupError } = await admin
      .from("stripe_webhook_events")
      .select("id")
      .eq("id", event.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return apiJson({ received: true, duplicate: true });

    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      await syncSubscription(event.data.object as unknown as SubscriptionShape);
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (userId && customerId) {
        const { error } = await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
        if (error) throw error;
      }
    }

    const { error: recordError } = await admin.from("stripe_webhook_events").insert({ id: event.id, event_type: event.type });
    if (recordError && recordError.code !== "23505") throw recordError;
    return apiJson({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
