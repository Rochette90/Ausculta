"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { resolveContactMessage } from "@/app/actions/admin-contact";
import type { AdminContactMessage } from "@/lib/admin/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function MessageCard({ message }: { message: AdminContactMessage }) {
  const [status, setStatus] = useState(message.status);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resolve() {
    setFeedback(null);
    startTransition(async () => {
      const result = await resolveContactMessage(message.id);
      if (result.success) { setStatus("resolved"); setFeedback("Marqué comme traité"); }
      else setFeedback(result.error ?? "Mise à jour impossible");
    });
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", status === "open" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>{status === "open" ? "À traiter" : "Traité"}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{message.topic}</span>
          </div>
          <h2 className="mb-0 mt-3 !text-xl">{message.name}</h2>
          <p className="mt-1 text-sm text-slate-500"><a className="underline" href={`mailto:${message.email}`}>{message.email}</a> · {new Date(message.createdAt).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" })}</p>
        </div>
        <Button disabled={pending || status === "resolved"} onClick={resolve} size="sm"><CheckCircle2 size={15} /> Marquer comme traité</Button>
      </header>
      <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 leading-7 text-slate-700">{message.message}</p>
      {pending && <LoaderCircle className="mt-3 animate-spin text-slate-400" size={18} />}
      {feedback && <span className="mt-3 block text-sm font-semibold text-slate-600" aria-live="polite">{feedback}</span>}
    </article>
  );
}

export function AdminContactMessages({ messages }: { messages: AdminContactMessage[] }) {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const visible = useMemo(() => messages.filter((message) => filter === "all" || message.status === filter), [filter, messages]);
  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "open", "resolved"] as const).map((value) => (
          <button className={cn("rounded-full px-4 py-2 text-sm font-bold", filter === value ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600")} key={value} onClick={() => setFilter(value)}>
            {value === "all" ? "Tous" : value === "open" ? "À traiter" : "Traités"}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">{visible.length} message{visible.length > 1 ? "s" : ""}</p>
      <div className="mt-4 grid gap-4">
        {visible.map((message) => <MessageCard key={message.id} message={message} />)}
        {visible.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Aucun message dans cette catégorie.</div>}
      </div>
    </>
  );
}
