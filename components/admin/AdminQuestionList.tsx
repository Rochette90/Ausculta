"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminQuestionListItem } from "../../lib/admin/questions";

const reviewLabels = { draft: "Brouillon", in_review: "À relire", approved: "Approuvée", rejected: "Rejetée" };

export function AdminQuestionList({ questions }: { questions: AdminQuestionListItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AdminQuestionListItem["reviewStatus"]>("all");
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr-CH");
    return questions.filter((question) => (status === "all" || question.reviewStatus === status)
      && (!normalized || `${question.text} ${question.specialtyName} ${question.pathologyTitle ?? ""}`.toLocaleLowerCase("fr-CH").includes(normalized)));
  }, [query, questions, status]);
  return <><div className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="flex min-h-11 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4"><Search className="text-slate-400" size={18} /><span className="sr-only">Rechercher une question</span><input className="min-w-0 flex-1 border-0 bg-transparent py-3 outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Question, fiche ou spécialité…" value={query} /></label><select className="rounded-xl border border-slate-200 bg-white px-4 font-semibold" onChange={(event) => setStatus(event.target.value as typeof status)} value={status}><option value="all">Tous les statuts</option><option value="draft">Brouillons</option><option value="in_review">À relire</option><option value="approved">Approuvées</option><option value="rejected">Rejetées</option></select></div><p className="mt-4 text-sm text-slate-500">{visible.length} question{visible.length > 1 ? "s" : ""}</p><div className="mt-4 grid gap-3">{visible.map((question) => <Link className="group grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 no-underline shadow-sm transition hover:border-teal-300 sm:grid-cols-[1fr_auto] sm:items-center" href={`/admin/questions/${question.id}`} key={question.id}><span><span className="line-clamp-2 font-semibold">{question.text}</span><small className="mt-1 block text-slate-500">{question.specialtyName}{question.pathologyTitle ? ` · ${question.pathologyTitle}` : ""} · {question.difficulty} · v{question.version}</small><span className={question.isPublished ? "mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700" : "mt-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700"}>{question.isPublished ? "Publiée" : reviewLabels[question.reviewStatus]}</span></span><ArrowRight className="hidden text-slate-400 transition group-hover:translate-x-1 sm:block" size={18} /></Link>)}</div></>;
}
