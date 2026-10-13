"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveAdminPracticeGrid, saveAdminTheoryFiche } from "@/app/actions/admin-training";
import { Button } from "@/components/ui/button";
import { emptyGridContent } from "@/lib/grids/validate";

const slugify = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);

/** Création en brouillon : la fiche ou la grille s'ouvre ensuite dans son éditeur. */
export function NewTrainingForm({ kind, nextPosition }: { kind: "theory" | "grid"; nextPosition: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const theory = kind === "theory";

  function create() {
    setError(null);
    startTransition(async () => {
      const common = { slug, title, position: nextPosition, isPublished: false };
      const result = theory
        ? await saveAdminTheoryFiche({ ...common, summary: detail, content: "" })
        : await saveAdminPracticeGrid({ ...common, themes: detail, content: emptyGridContent() });
      if (result.success && result.id) router.push(`/admin/${theory ? "theorie" : "grilles"}/${result.id}`);
      else setError(result.error ?? "Création impossible");
    });
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
  return (
    <form className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end" onSubmit={(event) => { event.preventDefault(); create(); }}>
      <label><span className="mb-1 block text-xs font-bold text-slate-600">Titre</span><input className={field} maxLength={200} onChange={(event) => { setTitle(event.target.value); if (!slugEdited) setSlug(slugify(event.target.value)); }} required value={title} /></label>
      <label><span className="mb-1 block text-xs font-bold text-slate-600">Adresse (définitive)</span><input className={`${field} font-mono text-sm`} maxLength={120} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value); }} pattern="[a-z0-9]+(-[a-z0-9]+)*" required value={slug} /></label>
      <label><span className="mb-1 block text-xs font-bold text-slate-600">{theory ? "Résumé (10 caractères min.)" : "Thèmes"}</span><input className={field} maxLength={theory ? 500 : 300} onChange={(event) => setDetail(event.target.value)} required={theory} value={detail} /></label>
      <Button disabled={pending || !title.trim() || !slug} type="submit">{pending ? <LoaderCircle className="animate-spin" size={17} /> : <Plus size={17} />} Créer</Button>
      {error && <p className="m-0 text-sm font-semibold text-rose-700 sm:col-span-4">{error}</p>}
    </form>
  );
}
