"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setEcosFeedbackStatus } from "@/app/actions/ecos-feedback";
import { Button } from "@/components/ui/button";
import type { AdminEcosFeedback } from "@/lib/admin/ecos-insights";
import { ECOS_FEEDBACK_CATEGORIES } from "@/lib/ecos/feedback";

const CATEGORY_LABELS = Object.fromEntries(ECOS_FEEDBACK_CATEGORIES.map((item) => [item.key, item.label]));
const ROLE_LABELS: Record<string, string> = { student: "Étudiant", patient: "Patient", system: "Système" };
const dateFormat = new Intl.DateTimeFormat("fr-CH", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Zurich" });

export function AdminEcosFeedbackList({ items }: { items: AdminEcosFeedback[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggle(item: AdminEcosFeedback) {
    setError("");
    startTransition(async () => {
      const result = await setEcosFeedbackStatus(item.id, item.status === "open" ? "resolved" : "open");
      if (!result.success) setError(result.error ?? "Erreur");
      else router.refresh();
    });
  }

  if (!items.length) return <p className="mt-3 text-sm text-slate-500">Aucun avis pour le moment.</p>;
  return (
    <div className="mt-4 grid gap-3">
      {error && <p className="m-0 text-sm text-rose-700" role="alert">{error}</p>}
      {items.map((item) => (
        <article className={`rounded-2xl border bg-white p-4 ${item.status === "open" ? "border-amber-300" : "border-slate-200 opacity-75"}`} key={item.id}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <strong>{item.code}</strong>
            <span className="text-slate-600">{item.diagnosis}</span>
            <span className="text-amber-600" aria-label={`${item.rating} sur 5`}>{"★".repeat(item.rating)}<span className="text-slate-300">{"★".repeat(5 - item.rating)}</span></span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{CATEGORY_LABELS[item.category]}</span>
            {item.score !== null && item.maxScore ? <span className="text-slate-500">Score {Math.round((100 * item.score) / item.maxScore)} %</span> : null}
            <span className="ml-auto text-xs text-slate-500">{dateFormat.format(new Date(item.createdAt))}</span>
          </div>
          {item.comment ? <p className="mb-0 mt-2 whitespace-pre-wrap">{item.comment}</p> : <p className="mb-0 mt-2 text-sm italic text-slate-500">Sans commentaire.</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button disabled={pending} onClick={() => toggle(item)} size="sm" variant="outline">{item.status === "open" ? "Marquer traité" : "Rouvrir"}</Button>
            {item.transcript.length > 0 && (
              <details className="w-full text-sm">
                <summary className="cursor-pointer font-semibold text-teal-700">Transcript ({item.transcript.length} messages)</summary>
                <ol className="mt-2 grid max-h-96 gap-1 overflow-y-auto pl-5">
                  {item.transcript.map((message, index) => <li key={index}><strong>{ROLE_LABELS[message.role] ?? message.role} :</strong> {message.content}</li>)}
                </ol>
              </details>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
