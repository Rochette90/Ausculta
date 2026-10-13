"use client";

import { useState } from "react";
import { openBillingSession } from "@/components/billing/open-billing";

/** Bouton d'achat de la page des tarifs, pour un compte connecté sans Premium. */
export function PricingCheckoutButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      await openBillingSession("/api/billing/checkout");
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "La facturation est momentanément indisponible.");
      setLoading(false);
    }
  }

  return (
    <>
      <button className="button primary full" disabled={loading} onClick={() => void checkout()} type="button">{label}</button>
      {error && <p className="plan-error" role="status">{error}</p>}
    </>
  );
}
