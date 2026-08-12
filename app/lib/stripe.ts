import "server-only";

import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe secret key is missing");
  stripe ??= new Stripe(secretKey, { appInfo: { name: "MedTrain", version: "0.1.0" } });
  return stripe;
}

export function appOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    const url = new URL(configured);
    if (url.protocol === "https:" || url.hostname === "localhost") return url.origin;
  }
  return new URL(request.url).origin;
}
