/**
 * Stripe subscription states shared by checkout, webhooks and account deletion.
 * `incomplete` is left out on purpose: an abandoned 3-D Secure checkout expires
 * by itself after 23 hours and must not block a new attempt.
 */
export const BLOCKING_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "unpaid", "paused"] as const;
export const PRO_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
export const TERMINAL_SUBSCRIPTION_STATUSES = ["canceled", "incomplete_expired"] as const;

export function blocksNewCheckout(status: string) {
  return (BLOCKING_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

export function grantsPro(status: string) {
  return (PRO_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

export function needsCancellation(status: string) {
  return !(TERMINAL_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}
