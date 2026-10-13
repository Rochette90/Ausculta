"use client";

import { BadgeCheck, CheckCircle2, Code2, ExternalLink, Eye, LoaderCircle, RotateCcw, Save, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { reviewAdminPathology, updateAdminPathology, type AdminPathologyUpdateInput } from "@/app/actions/admin-pathologies";
import { MarkdownBlocks, parseMarkdown } from "@/app/markdown";
import type { AdminPathologyDetails } from "@/lib/admin/queries";
import type { PathologyReviewStatus } from "@/types/content";
import { Button, buttonVariants } from "@/components/ui/button";

type EditorMode = "edit" | "preview";
type ReviewState = {
  status: PathologyReviewStatus;
  reviewerName: string | null;
  reviewedAt: string | null;
};

export function PathologyEditor({ pathology }: { pathology: AdminPathologyDetails }) {
  const router = useRouter();
  const [form, setForm] = useState<AdminPathologyUpdateInput>({
    id: pathology.id,
    slug: pathology.slug,
    title: pathology.title,
    content: pathology.content,
    difficulty: pathology.difficulty,
    isPublished: pathology.isPublished,
  });
  const [review, setReview] = useState<ReviewState>({
    status: pathology.reviewStatus,
    reviewerName: pathology.reviewerName,
    reviewedAt: pathology.reviewedAt,
  });
  // Version relue : chaque enregistrement l'incrémente côté base.
  const [version, setVersion] = useState(pathology.version);
  const [mode, setMode] = useState<EditorMode>("edit");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const previewBlocks = useMemo(() => parseMarkdown(form.content), [form.content]);

  function update<K extends keyof AdminPathologyUpdateInput>(key: K, value: AdminPathologyUpdateInput[K]) {
    setDirty(true);
    setMessage(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateAdminPathology(form);
      if (result.success) {
        setDirty(false);
        setVersion((current) => current + 1);
        setReview({ status: "needs_review", reviewerName: null, reviewedAt: null });
        setMessageTone("success");
        setMessage("Version enregistrée. La fiche est maintenant à réviser.");
        router.refresh();
      } else {
        setMessageTone("error");
        setMessage(result.error ?? "Enregistrement impossible");
      }
    });
  }

  function signReview() {
    setMessage(null);
    startTransition(async () => {
      const result = await reviewAdminPathology({ id: pathology.id, slug: pathology.slug, version });
      if (result.success && result.reviewerName && result.reviewedAt) {
        setReview({ status: "reviewed", reviewerName: result.reviewerName, reviewedAt: result.reviewedAt });
        setMessageTone("success");
        setMessage(`Révision signée par ${result.reviewerName}.`);
        router.refresh();
      } else {
        setMessageTone("error");
        setMessage(result.error ?? "Signature impossible");
      }
    });
  }

  const reviewed = review.status === "reviewed" && review.reviewerName && review.reviewedAt;

  return (
    <div className="pb-32">
      <section className={`mb-5 rounded-3xl border p-5 sm:p-6 ${reviewed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${reviewed ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
              {reviewed ? <BadgeCheck size={23} /> : <RotateCcw size={22} />}
            </span>
            <div>
              <p className={`m-0 text-sm font-extrabold uppercase tracking-[.12em] ${reviewed ? "text-emerald-800" : "text-amber-800"}`}>{reviewed ? "Révision validée" : "À réviser"}</p>
              <p className="mb-0 mt-1 text-sm leading-6 text-slate-700">
                {reviewed
                  ? <>Signée par <strong>{review.reviewerName}</strong> le {new Date(review.reviewedAt!).toLocaleString("fr-CH", { timeZone: "Europe/Zurich" })}.</>
                  : "Relis le contenu, enregistre tes corrections, puis signe la version finale avec ton compte."}
              </p>
              {dirty && <p className="mb-0 mt-2 text-xs font-bold text-amber-800">Modifications non enregistrées — la signature est bloquée.</p>}
            </div>
          </div>
          <Button disabled={pending || dirty || Boolean(reviewed) || !form.content.trim()} onClick={signReview} variant={reviewed ? "outline" : "default"}>
            {pending ? <LoaderCircle className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
            {reviewed ? "Révision signée" : "Valider et signer"}
          </Button>
        </div>
      </section>

      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[1fr_auto]">
        <label>
          <span className="mb-2 block text-sm font-bold text-slate-700">Titre de la fiche</span>
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" maxLength={200} onChange={(event) => update("title", event.target.value)} value={form.title} />
        </label>
        <div className="grid grid-cols-2 gap-3 lg:min-w-72">
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">Difficulté</span>
            <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" onChange={(event) => update("difficulty", event.target.value as AdminPathologyUpdateInput["difficulty"])} value={form.difficulty}>
              <option value="facile">Facile</option><option value="moyen">Moyen</option><option value="difficile">Difficile</option>
            </select>
          </label>
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
            <h2 className="m-0 !text-xl">Contenu complet de la fiche</h2>
            <p className="mb-0 mt-1 text-sm text-slate-500">Modifiez le Markdown utilisé par la page publique.</p>
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
          <div aria-live="polite">{message && <span className={`inline-flex items-center gap-2 text-sm font-semibold ${messageTone === "success" ? "text-emerald-700" : "text-rose-700"}`}>{messageTone === "success" && <CheckCircle2 size={17} />}{message}</span>}</div>
          <div className="flex gap-2">
            <Link className={buttonVariants({ variant: "outline" })} href={`/pathologies/${pathology.slug}`} target="_blank">Page publique <ExternalLink size={16} /></Link>
            <Button disabled={pending || !form.content.trim() || !dirty} onClick={save}>{pending ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{pending ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
