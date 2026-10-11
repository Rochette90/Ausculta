"use client";

import { initialsFrom } from "@/lib/profile/presentation";
import { Camera, CheckCircle2, LoaderCircle, Save, Target, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <UserRound size={21} />
        </span>
        <div>
          <p className="m-0 text-xs font-extrabold uppercase tracking-[.14em] text-teal-700">Paramètres du profil</p>
          <h2 className="mb-0 mt-1 !text-2xl">Ton identité et tes objectifs</h2>
          <p className="mb-0 mt-2 text-sm text-slate-500">Personnalise ce que {BRAND_NAME} affiche et la cadence proposée.</p>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-5 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:p-5">
        <span
          aria-label={avatarUrl ? `Photo de profil de ${fullName}` : `Initiales de ${fullName}`}
          className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-teal-300 to-teal-800 bg-cover bg-center text-2xl font-extrabold text-white ring-4 ring-white"
          role="img"
          style={avatarUrl ? { backgroundImage: `url(${JSON.stringify(avatarUrl).slice(1, -1)})` } : undefined}
        >
          {!avatarUrl && (initialsFrom(fullName) || "ÉT")}
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block text-base">Photo de profil</strong>
          <p className="mb-4 mt-1 text-xs leading-5 text-slate-500">JPG, PNG ou WebP · 2 Mo maximum. La photo reste privée à ton compte.</p>
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
            <p className={`mb-0 mt-3 text-xs font-semibold ${avatarFeedback.tone === "success" ? "text-emerald-700" : "text-rose-700"}`} role="status">
              {avatarFeedback.message}
            </p>
          )}
        </div>
      </div>

      <form className="mt-7" onSubmit={(event) => void saveProfile(event)}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
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
          <div className="sm:col-span-2">
            <Label htmlFor="profile-email">Adresse e-mail</Label>
            <Input className="mt-2 bg-slate-50 text-slate-500" disabled id="profile-email" value={email} />
            <p className="mb-0 mt-1.5 text-xs text-slate-400">Ton adresse de connexion n’est pas affichée publiquement.</p>
          </div>
        </div>

        {/* Objectifs de QCM : affichés seulement quand le module est actif (lib/features.ts). */}
        {FEATURES.quiz && <>
        <div className="my-7 h-px bg-slate-100" />

        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><Target size={18} /></span>
          <div>
            <strong className="block text-sm">Objectifs d’entraînement</strong>
            <span className="text-xs text-slate-500">Utilisés pour personnaliser ton tableau de bord.</span>
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
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
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
            {saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
          {feedback && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${feedback.tone === "success" ? "text-emerald-700" : "text-rose-700"}`} role="status">
              {feedback.tone === "success" && <CheckCircle2 size={15} />}
              {feedback.message}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
