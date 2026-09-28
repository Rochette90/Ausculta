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
        throw new Error(readable && body?.error ? body.error : "La suppression a échoué. Réessayez plus tard.");
      }
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La suppression a échoué. Réessayez plus tard.");
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button className="inline-flex min-h-10 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-rose-700" onClick={() => setConfirming(true)} type="button">
        <Trash2 size={17} /> Supprimer mon compte
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
      <p className="m-0 text-sm font-bold text-rose-800 dark:text-rose-200">Cette action est définitive.</p>
      <p className="mb-0 mt-1 text-sm leading-6 text-rose-700 dark:text-rose-300">Progression, badges et abonnement seront supprimés immédiatement.</p>
      {error && <p className="mb-0 mt-2 text-sm font-semibold text-rose-800 dark:text-rose-200" role="alert">{error}</p>}
      <div className="mt-3 flex gap-3">
        <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white disabled:opacity-60" disabled={pending} onClick={() => void deleteAccount()} type="button">
          {pending ? "Suppression…" : "Confirmer la suppression"}
        </button>
        <button className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-slate-600 dark:text-slate-300" disabled={pending} onClick={() => setConfirming(false)} type="button">
          Annuler
        </button>
      </div>
    </div>
  );
}
