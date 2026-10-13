"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string; code?: string } | null;
        const readable = body?.code === "billing_cancellation_failed" || response.status === 429;
        throw new Error(readable && body?.error ? body.error : "La suppression a échoué. Réessaie plus tard.");
      }
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La suppression a échoué. Réessaie plus tard.");
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button className="danger-link" onClick={() => setConfirming(true)} type="button">
        <Trash2 aria-hidden="true" size={17} /> Supprimer mon compte
      </button>
    );
  }

  return (
    <div className="danger-confirm" role="group" aria-label="Confirmer la suppression du compte">
      <p><strong>Cette action est définitive.</strong></p>
      <p>Ta progression, tes bilans et ton abonnement seront supprimés immédiatement.</p>
      {error && <p role="alert"><strong>{error}</strong></p>}
      <div className="danger-confirm-actions">
        <button className="button danger small" disabled={pending} onClick={() => void deleteAccount()} type="button">
          {pending ? "Suppression…" : "Supprimer définitivement"}
        </button>
        <button className="button secondary small" disabled={pending} onClick={() => setConfirming(false)} type="button">
          Annuler
        </button>
      </div>
    </div>
  );
}
