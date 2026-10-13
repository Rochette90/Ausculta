"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

/** Choix d'un nouveau mot de passe après un lien de réinitialisation (session déjà ouverte par `/auth/callback`). */
export function NewPasswordForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      setStatus("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string; code?: string } | null;
        if (body?.code === "reauthentication_required") setExpired(true);
        throw new Error([400, 403, 429].includes(response.status) ? body?.error : undefined);
      }
      router.push(nextPath);
      router.refresh();
    } catch (cause) {
      setStatus(cause instanceof Error && cause.message ? cause.message : "La mise à jour a échoué. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <Link className="logo auth-mobile-logo" href="/" aria-label="Retour à l’accueil"><BrandLogo /></Link>
      <h1>Nouveau mot de passe</h1>
      <p className="auth-intro">Choisissez un mot de passe d’au moins {PASSWORD_MIN_LENGTH} caractères. Vos autres appareils seront déconnectés.</p>
      <form onSubmit={savePassword}>
        <label htmlFor="password">Nouveau mot de passe</label>
        <input className="field" id="password" type="password" autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} required value={password} onChange={(event) => setPassword(event.target.value)} />
        <label htmlFor="confirmation">Confirmer le mot de passe</label>
        <input className="field" id="confirmation" type="password" autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        <button className="button primary full" disabled={loading} type="submit">{loading ? "Enregistrement…" : "Enregistrer le mot de passe"}</button>
      </form>
      {status && <p className="auth-status" role="status">{status}</p>}
      {expired && <p className="auth-switch"><Link href="/mot-de-passe-oublie">Demander un nouveau lien</Link></p>}
      <Link className="auth-back" href="/">Retour à l’accueil</Link>
    </div>
  );
}
