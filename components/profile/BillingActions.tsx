"use client";

import { useState } from "react";
import { BRAND_PRO_PLAN } from "@/lib/brand";

export function BillingActions({ hasCustomer, isPro }: { hasCustomer: boolean; isPro: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openBilling(path: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(path, { method: "POST" });
      const data = await response.json().catch(() => ({})) as { url?: string; error?: string; code?: string };
      if (!response.ok || !data.url) {
        // Les refus métier (abonnement déjà en cours, limite de tentatives)
        // portent un message destiné à l'utilisateur.
        const readable = data.code === "subscription_exists" || response.status === 429;
        throw new Error(readable && data.error ? data.error : "La facturation est momentanément indisponible.");
      }
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "La facturation est momentanément indisponible.");
      setLoading(false);
    }
  }

  return (
    <div className="billing-actions">
      {!isPro && <button className="button primary small" disabled={loading} onClick={() => void openBilling("/api/billing/checkout")} type="button">Passer à {BRAND_PRO_PLAN}</button>}
      {hasCustomer && <button className="button secondary small" disabled={loading} onClick={() => void openBilling("/api/billing/portal")} type="button">Gérer l’abonnement</button>}
      {error && <p role="status">{error}</p>}
    </div>
  );
}
