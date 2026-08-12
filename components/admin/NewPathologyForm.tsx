"use client";

import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAdminPathology, type CreateAdminPathologyInput } from "../../app/actions/admin-pathologies";
import type { AdminSpecialtyOption } from "../../lib/admin/queries";
import { Button } from "../ui/button";

type SectionKey = keyof Pick<CreateAdminPathologyInput,
  "definition" | "pathophysiology" | "symptoms" | "riskFactors" | "complementaryExams" |
  "differentialDiagnosis" | "treatments" | "complications" | "monitoring">;

const sections: Array<{ key: SectionKey; label: string; hint: string }> = [
  { key: "definition", label: "Définition", hint: "Définition concise et directement mémorisable." },
  { key: "pathophysiology", label: "Physiopathologie", hint: "Mécanismes principaux et chaîne causale." },
  { key: "symptoms", label: "Signes et symptômes", hint: "Présentation typique, signes d’alarme et variations." },
  { key: "riskFactors", label: "Facteurs de risque", hint: "Facteurs modifiables, non modifiables et contexte." },
  { key: "complementaryExams", label: "Examens complémentaires", hint: "Examens prioritaires et résultats attendus." },
  { key: "differentialDiagnosis", label: "Diagnostics différentiels", hint: "Principaux diagnostics à exclure." },
  { key: "treatments", label: "Traitements", hint: "Prise en charge initiale et traitement de fond." },
  { key: "complications", label: "Complications", hint: "Complications précoces et tardives." },
  { key: "monitoring", label: "Surveillance", hint: "Paramètres, examens et suivi clinique." },
];

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
}

export function NewPathologyForm({ specialties }: { specialties: AdminSpecialtyOption[] }) {
  const router = useRouter();
  const [slugEdited, setSlugEdited] = useState(false);
  const [form, setForm] = useState<CreateAdminPathologyInput>({
    specialtyId: specialties[0]?.id ?? "", title: "", slug: "", definition: "", pathophysiology: "",
    symptoms: "", riskFactors: "", complementaryExams: "", differentialDiagnosis: "", treatments: "",
    complications: "", monitoring: "", difficulty: "moyen", isPublished: false,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof CreateAdminPathologyInput>(key: K, value: CreateAdminPathologyInput[K]) {
    setCreated(false);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateTitle(title: string) {
    setCreated(false);
    setForm((current) => ({ ...current, title, slug: slugEdited ? current.slug : slugify(title) }));
  }

  function create() {
    setMessage(null);
    startTransition(async () => {
      const result = await createAdminPathology(form);
      if (!result.success || !result.pathologyId) {
        setCreated(false);
        setMessage(result.error ?? "Création impossible");
        return;
      }
      setCreated(true);
      setMessage("Fiche créée. Ouverture de l’éditeur…");
      router.push(`/admin/pathologies/${result.pathologyId}`);
      router.refresh();
    });
  }

  return (
    <div className="pb-32">
      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-2">
        <label className="lg:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Titre de la fiche</span><input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" maxLength={200} onChange={(event) => updateTitle(event.target.value)} placeholder="Ex. Embolie pulmonaire" value={form.title} /></label>
        <label><span className="mb-2 block text-sm font-bold text-slate-700">Spécialité</span><select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" disabled={specialties.length === 0} onChange={(event) => update("specialtyId", event.target.value)} value={form.specialtyId}>{specialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}</select></label>
        <label><span className="mb-2 block text-sm font-bold text-slate-700">Slug URL</span><input className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" maxLength={180} onChange={(event) => { setSlugEdited(true); update("slug", slugify(event.target.value)); }} placeholder="embolie-pulmonaire" value={form.slug} /><small className="mt-1 block text-slate-500">Lettres minuscules, chiffres et tirets uniquement.</small></label>
        <label><span className="mb-2 block text-sm font-bold text-slate-700">Difficulté</span><select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" onChange={(event) => update("difficulty", event.target.value as CreateAdminPathologyInput["difficulty"])} value={form.difficulty}><option value="facile">Facile</option><option value="moyen">Moyen</option><option value="difficile">Difficile</option></select></label>
        <label className="flex flex-col"><span className="mb-2 block text-sm font-bold text-slate-700">Publication</span><span className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-4"><input checked={form.isPublished} onChange={(event) => update("isPublished", event.target.checked)} type="checkbox" /><span className="text-sm font-semibold">{form.isPublished ? "Publier immédiatement" : "Enregistrer en brouillon"}</span></span></label>
      </div>

      <div className="mt-5 grid gap-4">
        {sections.map((section) => <label className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" key={section.key}><span className="block text-lg font-bold text-slate-900">{section.label}</span><small className="mt-1 block text-slate-500">{section.hint}</small><textarea className="mt-4 min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/60 p-4 leading-7 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100" maxLength={30000} onChange={(event) => update(section.key, event.target.value)} value={form[section.key]} /></label>)}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,.08)] backdrop-blur md:bottom-0"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3"><div aria-live="polite">{message && <span className={created ? "inline-flex items-center gap-2 text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-rose-700"}>{created && <CheckCircle2 size={17} />}{message}</span>}</div><Button disabled={pending || specialties.length === 0} onClick={create}>{pending ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{pending ? "Création…" : "Créer la fiche"}</Button></div></div>
    </div>
  );
}
