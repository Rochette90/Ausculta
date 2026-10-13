"use client";

import { useState } from "react";
import { BRAND_PRO_PLAN } from "@/lib/brand";
import { openBillingSession } from "@/components/billing/open-billing";

/** `canSubscribe` : formule en vente (flag + prix Stripe), décidé côté serveur. */
export function BillingActions({ hasCustomer, isPro, canSubscribe }: { hasCustomer: boolean; isPro: boolean; canSubscribe: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openBilling(path: "/api/billing/checkout" | "/api/billing/portal") {
    setLoading(true);
    setError(null);
    try {
      await openBillingSession(path);
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "La facturation est momentanément indisponible.");
      setLoading(false);
    }
  }

  return (
    <div className="billing-actions">
      {canSubscribe && !isPro && <button className="button primary small" disabled={loading} onClick={() => void openBilling("/api/billing/checkout")} type="button">Passer à {BRAND_PRO_PLAN}</button>}
      {hasCustomer && <button className="button secondary small" disabled={loading} onClick={() => void openBilling("/api/billing/portal")} type="button">Gérer l’abonnement</button>}
      {error && <p role="status">{error}</p>}
    </div>
  );
}
