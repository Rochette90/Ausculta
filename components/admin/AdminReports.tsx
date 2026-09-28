"use client";

import { CheckCircle2, ExternalLink, LoaderCircle, MessageSquareWarning, PencilLine, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { reviewPathologyReport } from "../../app/actions/reports";
import type { AdminPathologyReport } from "../../lib/admin/queries";
import { Button, buttonVariants } from "../ui/button";
import { cn } from "../../lib/utils";

const labels = { open: "À traiter", reviewing: "En cours", resolved: "Résolu", rejected: "Rejeté" } as const;

function ReportCard({ report }: { report: AdminPathologyReport }) {
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState(report.adminNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isClosed = status === "resolved" || status === "rejected";

  function review(nextStatus: "reviewing" | "resolved" | "rejected") {
    setMessage(null);
    startTransition(async () => {
      const result = await reviewPathologyReport({ reportId: report.id, status: nextStatus, adminNote: note });
      if (result.success) { setStatus(nextStatus); setMessage("Statut mis à jour"); }
      else setMessage(result.error ?? "Mise à jour impossible");
    });
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", status === "open" ? "bg-rose-50 text-rose-700" : status === "reviewing" ? "bg-amber-50 text-amber-700" : status === "resolved" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>{labels[status]}</span><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{report.sectionKey.replaceAll("_", " ")}</span></div><h2 className="mb-0 mt-3 !text-2xl">{report.pathologyTitle}</h2><p className="mt-1 text-sm text-slate-500">Par {report.reporterName} · {new Date(report.createdAt).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" })}</p></div><div className="flex gap-2"><Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/pathologies/${report.pathologySlug}`} target="_blank">Fiche <ExternalLink size={14} /></Link><Link className={buttonVariants({ size: "sm" })} href={`/admin/pathologies/${report.pathologyId}`}>Éditer <PencilLine size={14} /></Link></div></header>
      <blockquote className="mt-5 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-4 text-slate-800"><span className="text-slate-400">…{report.contextBefore?.slice(-100)}</span><mark className="bg-amber-200 px-1 font-semibold">{report.selectedText}</mark><span className="text-slate-400">{report.contextAfter?.slice(0, 100)}…</span></blockquote>
      <div className="mt-4 flex gap-3 rounded-2xl bg-slate-50 p-4"><MessageSquareWarning className="mt-0.5 shrink-0 text-rose-600" size={19} /><p className="m-0 leading-7 text-slate-700">{report.comment}</p></div>
      <label className="mt-5 block"><span className="mb-2 block text-sm font-bold text-slate-700">Note interne</span><textarea className="min-h-24 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-teal-600" disabled={pending} maxLength={2000} onChange={(event) => setNote(event.target.value)} placeholder="Décision, modification effectuée…" value={note} /></label>
      <div className="mt-4 flex flex-wrap items-center gap-2"><Button disabled={pending || isClosed} onClick={() => review("reviewing")} size="sm" variant="outline">En cours</Button><Button disabled={pending || status === "resolved"} onClick={() => review("resolved")} size="sm"><CheckCircle2 size={15} /> Résoudre</Button><Button disabled={pending || status === "rejected"} onClick={() => review("rejected")} size="sm" variant="destructive"><XCircle size={15} /> Rejeter</Button>{pending && <LoaderCircle className="animate-spin text-slate-400" size={18} />}{message && <span className="ml-2 text-sm font-semibold text-slate-600" aria-live="polite">{message}</span>}</div>
    </article>
  );
}

export function AdminReports({ reports }: { reports: AdminPathologyReport[] }) {
  const [filter, setFilter] = useState<"all" | AdminPathologyReport["status"]>("all");
  const visible = useMemo(() => reports.filter((report) => filter === "all" || report.status === filter), [filter, reports]);
  return <><div className="mt-6 flex flex-wrap gap-2">{(["all", "open", "reviewing", "resolved", "rejected"] as const).map((value) => <button className={cn("rounded-full px-4 py-2 text-sm font-bold", filter === value ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600")} key={value} onClick={() => setFilter(value)}>{value === "all" ? "Tous" : labels[value]}</button>)}</div><p className="mt-4 text-sm text-slate-500">{visible.length} signalement{visible.length > 1 ? "s" : ""}</p><div className="mt-4 grid gap-4">{visible.map((report) => <ReportCard key={report.id} report={report} />)}{visible.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Aucun signalement dans cette catégorie.</div>}</div></>;
}
