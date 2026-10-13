/**
 * Ouvre une session Stripe (Checkout ou portail) créée par l'API et y envoie
 * le navigateur. Les refus métier (abonnement déjà en cours, limite de
 * tentatives) portent un message destiné à l'utilisateur ; le reste reste
 * générique.
 */
export async function openBillingSession(path: "/api/billing/checkout" | "/api/billing/portal"): Promise<void> {
  const response = await fetch(path, { method: "POST" });
  const data = await response.json().catch(() => ({})) as { url?: string; error?: string; code?: string };
  if (!response.ok || !data.url) {
    const readable = data.code === "subscription_exists" || response.status === 429;
    throw new Error(readable && data.error ? data.error : "La facturation est momentanément indisponible.");
  }
  window.location.assign(data.url);
}
