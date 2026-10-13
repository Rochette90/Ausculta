"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

type Feedback = { tone: "success" | "error"; message: string };

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [saving, setSaving] = useState(false);

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      setFeedback({ tone: "error", message: "Les deux nouveaux mots de passe ne correspondent pas." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error([400, 403, 429].includes(response.status) && body?.error ? body.error : "Le changement a échoué. Réessaie plus tard.");
      }
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
      setFeedback({ tone: "success", message: "Ton mot de passe a été mis à jour. Tes autres appareils ont été déconnectés." });
    } catch (cause) {
      setFeedback({ tone: "error", message: cause instanceof Error ? cause.message : "Le changement a échoué. Réessaie plus tard." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mt-6" onSubmit={(event) => void changePassword(event)}>
      <div className="profile-password-grid">
        <div>
          <Label htmlFor="current-password">Mot de passe actuel</Label>
          <Input autoComplete="current-password" className="mt-2" id="current-password" onChange={(event) => setCurrentPassword(event.target.value)} required type="password" value={currentPassword} />
        </div>
        <div>
          <Label htmlFor="new-password">Nouveau mot de passe</Label>
          <Input autoComplete="new-password" className="mt-2" id="new-password" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          <p className="mb-0 mt-1.5 text-sm text-[var(--muted)]">{PASSWORD_MIN_LENGTH} caractères minimum.</p>
        </div>
        <div>
          <Label htmlFor="new-password-confirmation">Confirmer le nouveau mot de passe</Label>
          <Input autoComplete="new-password" className="mt-2" id="new-password-confirmation" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} onChange={(event) => setConfirmation(event.target.value)} required type="password" value={confirmation} />
        </div>
      </div>
      <p className="mb-0 mt-4 text-sm text-[var(--muted)]">
        Compte créé avec Google ? Utilise plutôt <Link className="text-link" href="/mot-de-passe-oublie">le lien de réinitialisation</Link> pour définir un mot de passe.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled={saving} type="submit" variant="outline">
          {saving && <LoaderCircle className="animate-spin" size={17} />}
          {saving ? "Mise à jour…" : "Changer le mot de passe"}
        </Button>
        {feedback && (
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${feedback.tone === "success" ? "text-[var(--primary)]" : "text-[var(--red)]"}`} role="status">
            {feedback.tone === "success" && <CheckCircle2 size={15} />}
            {feedback.message}
          </span>
        )}
      </div>
    </form>
  );
}
