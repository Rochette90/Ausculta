"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { BrandLogo } from "../brand/BrandLogo";

export function AuthForm({ nextPath, switchNextPath = nextPath, mode }: { nextPath: string; switchNextPath?: string; mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function signInWithEmail(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const result = isSignup
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
        : await supabase.auth.signInWithPassword({ email, password });
      const { error } = result;
      if (error) throw error;
      if (!isSignup || result.data.session) {
        router.push(nextPath);
        router.refresh();
      } else setStatus("Compte créé. Confirmez votre adresse e-mail pour continuer.");
    } catch {
      setStatus(isSignup ? "L’inscription est momentanément indisponible." : "Compte introuvable ou connexion indisponible.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setStatus(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
      if (error) throw error;
    } catch {
      setStatus("La connexion Google est momentanément indisponible.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <Link className="logo auth-mobile-logo" href="/" aria-label="Retour à l’accueil"><BrandLogo /></Link>
      <h1>{isSignup ? "Créer votre compte" : "Se connecter"}</h1>
      <p className="auth-intro">{isSignup ? "Gratuit, sans carte bancaire. Votre première station vous attend juste après." : "Retrouvez vos stations et votre progression."}</p>
      <button className="button quiet full" type="button" disabled={loading} onClick={signInWithGoogle}>Continuer avec Google</button>
      <div className="auth-divider"><span>ou avec votre e-mail</span></div>
      <form onSubmit={signInWithEmail}>
        <label htmlFor="email">Adresse e-mail</label>
        <input className="field" id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prenom.nom@unil.ch" />
        <label htmlFor="password">Mot de passe</label>
        <input className="field" id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 caractères minimum" />
        <button className="button primary full" disabled={loading} type="submit">{loading ? isSignup ? "Création…" : "Connexion…" : isSignup ? "Créer mon compte" : "Se connecter"}</button>
      </form>
      {status && <p className="auth-status" role="status">{status}</p>}
      <p className="auth-switch">{isSignup ? "Déjà inscrit·e ?" : "Pas encore de compte ?"} <Link href={`${isSignup ? "/login" : "/signup"}?next=${encodeURIComponent(switchNextPath)}`}>{isSignup ? "Se connecter" : "Créer un compte"}</Link></p>
      <Link className="auth-back" href="/">Retour à l’accueil</Link>
    </div>
  );
}
