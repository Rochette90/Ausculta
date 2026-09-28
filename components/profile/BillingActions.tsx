"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { BRAND_PRO_PLAN } from "@/lib/brand";

export function BillingActions({ hasCustomer, isPro }: { hasCustomer: boolean; isPro: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openBilling(path: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(path, { method: "POST" });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error);
      window.location.assign(data.url);
    } catch {
      setError("La facturation est momentanément indisponible.");
      setLoading(false);
    }
  }

  return (
    <div className="billing-actions">
      {!isPro && <Button disabled={loading} onClick={() => void openBilling("/api/billing/checkout")}>Passer à {BRAND_PRO_PLAN}</Button>}
      {hasCustomer && <Button variant="outline" disabled={loading} onClick={() => void openBilling("/api/billing/portal")}>Gérer l’abonnement</Button>}
      {error && <p role="status">{error}</p>}
    </div>
  );
}
