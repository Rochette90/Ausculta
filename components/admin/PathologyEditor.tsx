"use client";

import { CheckCircle2, ExternalLink, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { updateAdminPathology, type AdminPathologyInput } from "../../app/actions/admin-pathologies";
import type { AdminPathologyDetails } from "../../lib/admin/queries";
import { Button, buttonVariants } from "../ui/button";

const sections: Array<{ key: keyof Pick<AdminPathologyInput, "definition" | "pathophysiology" | "symptoms" | "riskFactors" | "complementaryExams" | "differentialDiagnosis" | "treatments" | "complications" | "monitoring">; label: string; hint: string }> = [
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

export function PathologyEditor({ pathology }: { pathology: AdminPathologyDetails }) {
  const [form, setForm] = useState<AdminPathologyInput>({
    id: pathology.id, slug: pathology.slug, title: pathology.title,
    definition: pathology.definition ?? "", pathophysiology: pathology.pathophysiology ?? "",
    symptoms: pathology.symptoms ?? "", riskFactors: pathology.riskFactors ?? "",
    complementaryExams: pathology.complementaryExams ?? "", differentialDiagnosis: pathology.differentialDiagnosis ?? "",
    treatments: pathology.treatments ?? "", complications: pathology.complications ?? "",
    monitoring: pathology.monitoring ?? "", difficulty: pathology.difficulty, isPublished: pathology.isPublished,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof AdminPathologyInput>(key: K, value: AdminPathologyInput[K]) {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateAdminPathology(form);
      setSaved(result.success);
      setMessage(result.success ? "Fiche enregistrée et caches actualisés." : result.error ?? "Enregistrement impossible");
    });
  }

  return (
    <div className="pb-32">
      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[1fr_auto]">
        <label><span className="mb-2 block text-sm font-bold text-slate-700">Titre de la fiche</span><input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" maxLength={200} onChange={(event) => update("title", event.target.value)} value={form.title} /></label>
        <div className="grid grid-cols-2 gap-3 lg:min-w-72"><label><span className="mb-2 block text-sm font-bold text-slate-700">Difficulté</span><select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3" onChange={(event) => update("difficulty", event.target.value as AdminPathologyInput["difficulty"])} value={form.difficulty}><option value="facile">Facile</option><option value="moyen">Moyen</option><option value="difficile">Difficile</option></select></label><label className="flex flex-col"><span className="mb-2 block text-sm font-bold text-slate-700">Publication</span><span className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-3"><input checked={form.isPublished} onChange={(event) => update("isPublished", event.target.checked)} type="checkbox" /><span className="text-sm font-semibold">{form.isPublished ? "Publiée" : "Brouillon"}</span></span></label></div>
      </div>

      <div className="mt-5 grid gap-4">
        {sections.map((section) => <label className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" key={section.key}><span className="block text-lg font-bold text-slate-900">{section.label}</span><small className="mt-1 block text-slate-500">{section.hint}</small><textarea className="mt-4 min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/60 p-4 leading-7 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100" maxLength={30000} onChange={(event) => update(section.key, event.target.value)} value={form[section.key]} /></label>)}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,.08)] backdrop-blur md:bottom-0"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3"><div aria-live="polite">{message && <span className={saved ? "inline-flex items-center gap-2 text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-rose-700"}>{saved && <CheckCircle2 size={17} />}{message}</span>}</div><div className="flex gap-2"><Link className={buttonVariants({ variant: "outline" })} href={`/pathologies/${pathology.slug}`} target="_blank">Prévisualiser <ExternalLink size={16} /></Link><Button disabled={pending} onClick={save}>{pending ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{pending ? "Enregistrement…" : "Enregistrer"}</Button></div></div></div>
    </div>
  );
}
