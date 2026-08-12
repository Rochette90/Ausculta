import Stripe from "stripe";
import { ApiError, apiJson, handleApiError } from "../../../lib/api-security";
import { getStripe } from "../../../lib/stripe";
import { createAdminClient } from "../../../../lib/supabase/server";

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

async function syncSubscription(subscription: SubscriptionShape) {
  const admin = createAdminClient();
  const customerId = idOf(subscription.customer);
  const userId = subscription.metadata?.supabase_user_id ||
    (await admin.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle()).data?.id;
  if (!userId) throw new Error("Subscription owner not found");
  const periodEnd = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
  const active = ["active", "trialing"].includes(subscription.status);
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
  const { error: profileError } = await admin.from("profiles").update({ plan: active ? "pro" : "free" }).eq("id", userId);
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
