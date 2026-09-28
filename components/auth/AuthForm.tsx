"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
    <Card className="auth-card">
      <div className="logo auth-logo"><BrandLogo priority /></div>
      <p className="eyebrow">{isSignup ? "CRÉER VOTRE COMPTE" : "ESPACE ÉTUDIANT SÉCURISÉ"}</p>
      <h1>{isSignup ? "Commencez à pratiquer." : "Retrouvez votre progression."}</h1>
      <p>{isSignup ? "Créez gratuitement votre espace de révision clinique." : "Connectez-vous pour retrouver vos stations, quiz et statistiques."}</p>
      <Button className="full" variant="outline" type="button" disabled={loading} onClick={signInWithGoogle}>Continuer avec Google</Button>
      <div className="auth-divider"><span>ou</span></div>
      <form onSubmit={signInWithEmail}>
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prenom.nom@unil.ch" />
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 caractères minimum" />
        <Button className="full" disabled={loading}>{loading ? isSignup ? "Création…" : "Connexion…" : isSignup ? "Créer mon compte" : "Se connecter"}</Button>
      </form>
      {status && <p className="auth-status" role="status">{status}</p>}
      <p className="auth-switch">{isSignup ? "Déjà inscrit·e ?" : "Pas encore de compte ?"} <Link href={`${isSignup ? "/login" : "/signup"}?next=${encodeURIComponent(switchNextPath)}`}>{isSignup ? "Se connecter" : "S’inscrire"}</Link></p>
      <Link className="auth-back" href="/">← Retour à l’accueil</Link>
    </Card>
  );
}
