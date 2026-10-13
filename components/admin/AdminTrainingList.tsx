import { ArrowRight, FilePenLine } from "lucide-react";
import Link from "next/link";
import type { AdminTrainingListItem } from "@/lib/admin/training-content";

export function AdminTrainingList({ items, basePath, empty }: { items: AdminTrainingListItem[]; basePath: string; empty: string }) {
  if (items.length === 0) return <p className="mt-4 text-sm text-slate-500">{empty}</p>;
  return (
    <div className="mt-4 grid gap-3">
      {items.map((item) => (
        <Link className="group grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 no-underline shadow-sm transition hover:border-teal-300 hover:shadow-md sm:grid-cols-[auto_1fr_auto] sm:items-center" href={`${basePath}/${item.id}`} key={item.id}>
          <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><FilePenLine size={20} /></span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <strong className="truncate">{item.title}</strong>
              <small className={item.isPublished ? "rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700" : "rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600"}>{item.isPublished ? "Publiée" : "Brouillon"}</small>
            </span>
            <small className="mt-1 block truncate text-slate-500">{item.subtitle || item.slug} · position {item.position} · version {item.version}</small>
          </span>
          <ArrowRight className="hidden text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-700 sm:block" size={18} />
        </Link>
      ))}
    </div>
  );
}
