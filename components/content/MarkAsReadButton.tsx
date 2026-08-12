"use client";

import { CheckCircle2, LoaderCircle, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markPathologyAsRead } from "../../app/actions/pathologies";
import { Button } from "../ui/button";

export function MarkAsReadButton({ pathologyId, initiallyCompleted }: { pathologyId: string; initiallyCompleted: boolean }) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [message, setMessage] = useState(initiallyCompleted ? "Progression enregistrée" : "5 XP lors de la première lecture");
  const [pending, startTransition] = useTransition();

  function completePathology() {
    startTransition(async () => {
      const result = await markPathologyAsRead(pathologyId);
      if (!result.success) {
        setMessage(result.error ?? "Impossible d’enregistrer la fiche");
        return;
      }
      setCompleted(true);
      setMessage(result.xpEarned > 0 ? `+${result.xpEarned} XP · niveau ${result.newLevel}` : "Cette fiche était déjà terminée");
      window.dispatchEvent(new Event("medtrain:progress"));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3" aria-live="polite">
      <Button disabled={completed || pending} onClick={completePathology} type="button">
        {pending ? <LoaderCircle className="animate-spin" size={18} /> : completed ? <CheckCircle2 size={18} /> : <Star size={18} />}
        {pending ? "Enregistrement…" : completed ? "Fiche terminée" : "Marquer comme lue"}
      </Button>
      <span className={completed ? "text-sm font-semibold text-emerald-700" : "text-sm text-slate-500"}>{message}</span>
    </div>
  );
}
