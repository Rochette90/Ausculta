"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function requestReset(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(response.status === 429 || response.status === 400 ? body?.error : undefined);
      }
      setSent(true);
      setStatus("Si un compte existe pour cette adresse, un e-mail avec un lien de réinitialisation vient d’être envoyé. Pensez à vérifier vos courriers indésirables.");
    } catch (cause) {
      setStatus(cause instanceof Error && cause.message ? cause.message : "L’envoi est momentanément indisponible. Réessayez dans quelques minutes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <Link className="logo auth-mobile-logo" href="/" aria-label="Retour à l’accueil"><BrandLogo /></Link>
      <h1>Mot de passe oublié</h1>
      <p className="auth-intro">Indiquez votre adresse e-mail : nous vous envoyons un lien pour en choisir un nouveau.</p>
      <form onSubmit={requestReset}>
        <label htmlFor="email">Adresse e-mail</label>
        <input className="field" id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prenom.nom@unil.ch" disabled={sent} />
        <button className="button primary full" disabled={loading || sent} type="submit">{loading ? "Envoi…" : sent ? "E-mail envoyé" : "Envoyer le lien"}</button>
      </form>
      {status && <p className="auth-status" role="status">{status}</p>}
      <p className="auth-switch">Vous vous en souvenez ? <Link href="/login">Se connecter</Link></p>
      <Link className="auth-back" href="/">Retour à l’accueil</Link>
    </div>
  );
}
