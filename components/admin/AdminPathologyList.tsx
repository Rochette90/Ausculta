"use client";

import { ArrowRight, BadgeCheck, FilePenLine, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminPathologyListItem } from "../../lib/admin/queries";

export function AdminPathologyList({ pathologies }: { pathologies: AdminPathologyListItem[] }) {
  const [query, setQuery] = useState("");
  const [publication, setPublication] = useState<"all" | "published" | "draft">("all");
  const [reviewStatus, setReviewStatus] = useState<"all" | "needs_review" | "reviewed">("all");
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr-CH");
    return pathologies.filter((pathology) => {
      const matchesQuery = !normalized || `${pathology.title} ${pathology.specialtyName}`.toLocaleLowerCase("fr-CH").includes(normalized);
      const matchesPublication = publication === "all" || (publication === "published" ? pathology.isPublished : !pathology.isPublished);
      const matchesReview = reviewStatus === "all" || pathology.reviewStatus === reviewStatus;
      return matchesQuery && matchesPublication && matchesReview;
    });
  }, [pathologies, publication, query, reviewStatus]);

  return (
    <>
      <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="flex min-h-11 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4"><Search className="text-slate-400" size={18} /><span className="sr-only">Rechercher une fiche</span><input className="min-w-0 flex-1 border-0 bg-transparent py-3 outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Pathologie ou spécialité…" value={query} /></label>
        <select className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700" onChange={(event) => setPublication(event.target.value as typeof publication)} value={publication}><option value="all">Toutes</option><option value="published">Publiées</option><option value="draft">Brouillons</option></select>
        <select className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700" onChange={(event) => setReviewStatus(event.target.value as typeof reviewStatus)} value={reviewStatus}><option value="all">Tous les états</option><option value="needs_review">À réviser</option><option value="reviewed">Révisées</option></select>
      </div>
      <p className="mt-4 text-sm text-slate-500">{visible.length} fiche{visible.length > 1 ? "s" : ""}</p>
      <div className="mt-4 grid gap-3">
        {visible.map((pathology) => (
          <Link className="group grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 no-underline shadow-sm transition hover:border-teal-300 hover:shadow-md sm:grid-cols-[auto_1fr_auto] sm:items-center" href={`/admin/pathologies/${pathology.id}`} key={pathology.id}>
            <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><FilePenLine size={20} /></span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <strong className="truncate">{pathology.title}</strong>
                <small className={pathology.isPublished ? "rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700" : "rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600"}>{pathology.isPublished ? "Publiée" : "Brouillon"}</small>
                <small className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${pathology.reviewStatus === "reviewed" ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-800"}`}>{pathology.reviewStatus === "reviewed" ? <BadgeCheck size={12} /> : <RotateCcw size={12} />}{pathology.reviewStatus === "reviewed" ? "Révisée" : "À réviser"}</small>
              </span>
              <small className="mt-1 block text-slate-500">{pathology.specialtyName} · {pathology.difficulty} · version {pathology.version}{pathology.reviewStatus === "reviewed" && pathology.reviewerName ? ` · signée par ${pathology.reviewerName}` : ""}</small>
            </span>
            <ArrowRight className="hidden text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-700 sm:block" size={18} />
          </Link>
        ))}
      </div>
    </>
  );
}
