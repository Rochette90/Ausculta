"use client";

import { initialsFrom } from "@/lib/profile/presentation";
import { Camera, CheckCircle2, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_NAME } from "@/lib/brand";
import { FEATURES } from "@/lib/features";

type SpecialtyOption = { id: string; name: string };

type ProfileSettingsProps = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  dailyQuestions: number;
  weeklyQuestions: number;
  targetSpecialtyId: string | null;
  specialties: SpecialtyOption[];
};

type Feedback = { tone: "success" | "error"; message: string } | null;


export function ProfileSettings({
  fullName: initialFullName,
  email,
  avatarUrl: initialAvatarUrl,
  dailyQuestions: initialDailyQuestions,
  weeklyQuestions: initialWeeklyQuestions,
  targetSpecialtyId: initialTargetSpecialtyId,
  specialties,
}: ProfileSettingsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(initialFullName);
  const [dailyQuestions, setDailyQuestions] = useState(initialDailyQuestions);
  const [weeklyQuestions, setWeeklyQuestions] = useState(initialWeeklyQuestions);
  const [targetSpecialtyId, setTargetSpecialtyId] = useState(initialTargetSpecialtyId ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [avatarFeedback, setAvatarFeedback] = useState<Feedback>(null);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          dailyQuestions,
          weeklyQuestions,
          targetSpecialtyId: targetSpecialtyId || null,
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Mise à jour impossible.");
      setFeedback({ tone: "success", message: "Ton profil et tes objectifs sont à jour." });
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Mise à jour impossible.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAvatarFeedback({ tone: "error", message: "La photo ne doit pas dépasser 2 Mo." });
      return;
    }

    const previousUrl = avatarUrl;
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
    setAvatarBusy(true);
    setAvatarFeedback(null);
    try {
      const form = new FormData();
      form.set("avatar", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await response.json() as { avatarUrl?: string; error?: string };
      if (!response.ok || !data.avatarUrl) throw new Error(data.error || "Envoi impossible.");
      setAvatarUrl(data.avatarUrl);
      setAvatarFeedback({ tone: "success", message: "Ta photo de profil a été mise à jour." });
      router.refresh();
    } catch (error) {
      setAvatarUrl(previousUrl);
      setAvatarFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Envoi impossible.",
      });
    } finally {
      URL.revokeObjectURL(previewUrl);
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true);
    setAvatarFeedback(null);
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Suppression impossible.");
      setAvatarUrl(null);
      setAvatarFeedback({ tone: "success", message: "La photo de profil a été supprimée." });
      router.refresh();
    } catch (error) {
      setAvatarFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Suppression impossible.",
      });
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <section className="profile-card" id="infos" aria-labelledby="infos-title">
      <div className="profile-card-head">
        <div>
          <h2 id="infos-title">Informations</h2>
          <p>Ton nom et ta photo dans {BRAND_NAME}{FEATURES.quiz ? ", et la cadence proposée" : ""}. Ils ne sont visibles que par toi.</p>
        </div>
      </div>

      <div className="profile-avatar-row">
        <span
          aria-label={avatarUrl ? `Photo de profil de ${fullName}` : `Initiales de ${fullName}`}
          className="profile-head-avatar"
          role="img"
          style={avatarUrl ? { backgroundImage: `url(${JSON.stringify(avatarUrl).slice(1, -1)})` } : undefined}
        >
          {!avatarUrl && (initialsFrom(fullName) || "ÉT")}
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block text-base">Photo de profil</strong>
          <p className="mb-3 mt-1 text-sm leading-5 text-[var(--muted)]">JPG, PNG ou WebP, 2 Mo maximum.</p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => void uploadAvatar(event)}
              type="file"
            />
            <Button disabled={avatarBusy} onClick={() => fileInputRef.current?.click()} size="sm" type="button">
              {avatarBusy ? <LoaderCircle className="animate-spin" size={15} /> : <Camera size={15} />}
              {avatarUrl ? "Changer" : "Ajouter une photo"}
            </Button>
            {avatarUrl && (
              <Button disabled={avatarBusy} onClick={() => void removeAvatar()} size="sm" type="button" variant="ghost">
                <Trash2 size={15} /> Supprimer
              </Button>
            )}
          </div>
          {avatarFeedback && (
            <p className={`mb-0 mt-3 text-sm font-semibold ${avatarFeedback.tone === "success" ? "text-[var(--primary)]" : "text-[var(--red)]"}`} role="status">
              {avatarFeedback.message}
            </p>
          )}
        </div>
      </div>

      <form className="mt-7" onSubmit={(event) => void saveProfile(event)}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="profile-full-name">Nom affiché</Label>
            <Input
              autoComplete="name"
              className="mt-2"
              id="profile-full-name"
              maxLength={80}
              minLength={2}
              onChange={(event) => setFullName(event.target.value)}
              required
              value={fullName}
            />
          </div>
          <div>
            <Label htmlFor="profile-email">Adresse e-mail</Label>
            <Input className="mt-2" disabled id="profile-email" value={email} />
            <p className="mb-0 mt-1.5 text-sm text-[var(--muted)]">Adresse de connexion, non modifiable ici.</p>
          </div>
        </div>

        {/* Objectifs de QCM : affichés seulement quand le module est actif (lib/features.ts). */}
        {FEATURES.quiz && <>
        <div className="my-7 h-px bg-[var(--line)]" />

        <div className="flex items-center gap-3">
          <div>
            <strong className="block text-sm">Objectifs d’entraînement</strong>
            <span className="text-sm text-[var(--muted)]">Utilisés pour personnaliser ton tableau de bord.</span>
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="daily-questions">Questions par jour</Label>
            <Input
              className="mt-2"
              id="daily-questions"
              max={200}
              min={1}
              onChange={(event) => setDailyQuestions(Number(event.target.value))}
              required
              type="number"
              value={dailyQuestions}
            />
          </div>
          <div>
            <Label htmlFor="weekly-questions">Questions par semaine</Label>
            <Input
              className="mt-2"
              id="weekly-questions"
              max={1000}
              min={1}
              onChange={(event) => setWeeklyQuestions(Number(event.target.value))}
              required
              type="number"
              value={weeklyQuestions}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="target-specialty">Spécialité prioritaire</Label>
            <select
              className="field mt-2"
              id="target-specialty"
              onChange={(event) => setTargetSpecialtyId(event.target.value)}
              value={targetSpecialtyId}
            >
              <option value="">Toutes les spécialités</option>
              {specialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}
            </select>
          </div>
        </div>
        </>}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button disabled={saving || avatarBusy} type="submit">
            {saving && <LoaderCircle className="animate-spin" size={17} />}
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
          {feedback && (
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${feedback.tone === "success" ? "text-[var(--primary)]" : "text-[var(--red)]"}`} role="status">
              {feedback.tone === "success" && <CheckCircle2 size={15} />}
              {feedback.message}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
