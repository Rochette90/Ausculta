"use client";

import { CheckCircle2, Code2, ExternalLink, Eye, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveAdminTheoryFiche, type AdminTheoryInput } from "@/app/actions/admin-training";
import { MarkdownBlocks, parseMarkdown } from "@/app/markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import type { AdminTheoryFiche } from "@/lib/admin/training-content";

const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

/** Même éditeur que les pathologies, sans signature médicale (ADR-013). */
export function TheoryFicheEditor({ fiche }: { fiche: AdminTheoryFiche }) {
  const router = useRouter();
  const [form, setForm] = useState<AdminTheoryInput>({
    id: fiche.id, version: fiche.version, slug: fiche.slug, title: fiche.title,
    summary: fiche.summary, content: fiche.content, position: fiche.position, isPublished: fiche.isPublished,
  });
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const previewBlocks = useMemo(() => parseMarkdown(form.content), [form.content]);

  function update<K extends keyof AdminTheoryInput>(key: K, value: AdminTheoryInput[K]) {
    setDirty(true);
    setMessage(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveAdminTheoryFiche(form);
      if (result.success) {
        setDirty(false);
        setForm((current) => ({ ...current, version: result.version }));
        setMessage({ tone: "success", text: "Fiche enregistrée." });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error ?? "Enregistrement impossible" });
      }
    });
  }

  return (
    <div className="pb-32">
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-4">
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Titre</span><input className={`${field} text-lg font-semibold`} maxLength={200} onChange={(event) => update("title", event.target.value)} value={form.title} /></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Résumé (affiché sur la page Théorie)</span><input className={field} maxLength={500} onChange={(event) => update("summary", event.target.value)} value={form.summary} /></label>
        </div>
        <div className="grid grid-cols-2 content-start gap-3 lg:min-w-72">
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Position</span><input className={field} min={0} max={10000} onChange={(event) => update("position", Number(event.target.value))} type="number" value={form.position} /></label>
          <label className="flex flex-col">
            <span className="mb-2 block text-sm font-bold text-slate-700">Publication</span>
            <span className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-3">
              <input checked={form.isPublished} onChange={(event) => update("isPublished", event.target.checked)} type="checkbox" />
              <span className="text-sm font-semibold">{form.isPublished ? "Publiée" : "Brouillon"}</span>
            </span>
          </label>
        </div>
      </div>

      <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-7">
          <div>
            <h2 className="m-0 !text-xl">Contenu de la fiche</h2>
            <p className="mb-0 mt-1 text-sm text-slate-500">Chaque titre <code>##</code> devient une section repliable, dans l&apos;ordre écrit.</p>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1" aria-label="Mode de l’éditeur">
            <button className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${mode === "edit" ? "bg-white text-teal-800 shadow-sm" : "text-slate-600"}`} onClick={() => setMode("edit")} type="button"><Code2 size={16} /> Éditer</button>
            <button className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${mode === "preview" ? "bg-white text-teal-800 shadow-sm" : "text-slate-600"}`} onClick={() => setMode("preview")} type="button"><Eye size={16} /> Aperçu</button>
          </div>
        </header>
        {mode === "edit" ? (
          <div className="p-4 sm:p-6">
            <textarea aria-label="Contenu Markdown de la fiche" className="min-h-[70vh] w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" maxLength={100000} onChange={(event) => update("content", event.target.value)} spellCheck value={form.content} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Titres : <code>##</code> · listes : <code>-</code> · alertes : <code>&gt; [!warning]</code> · tableaux Markdown acceptés</span>
              <span>{form.content.length.toLocaleString("fr-CH")} caractères</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 sm:p-7">
            {previewBlocks.length > 0 ? <article className="pathology-document mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10"><MarkdownBlocks blocks={previewBlocks} /></article> : <p className="py-20 text-center text-slate-500">Le contenu de la fiche est vide.</p>}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,.08)] backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div aria-live="polite">{message && <span className={`inline-flex items-center gap-2 text-sm font-semibold ${message.tone === "success" ? "text-emerald-700" : "text-rose-700"}`}>{message.tone === "success" && <CheckCircle2 size={17} />}{message.text}</span>}</div>
          <div className="flex gap-2">
            <Link className={buttonVariants({ variant: "outline" })} href={`/theorie/${fiche.slug}`} target="_blank">Page étudiante <ExternalLink size={16} /></Link>
            <Button disabled={pending || !form.content.trim() || !dirty} onClick={save}>{pending ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{pending ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
