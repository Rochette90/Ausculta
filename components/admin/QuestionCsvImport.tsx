"use client";

import { FileUp, LoaderCircle } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { importAdminQuestionsCsv } from "@/app/actions/admin-questions";
import { Button } from "@/components/ui/button";

export function QuestionCsvImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) { setMessage("Choisis un fichier CSV."); return; }
    startTransition(async () => {
      const result = await importAdminQuestionsCsv(await file.text(), file.name);
      setMessage(result.success ? `${result.imported} importée(s), ${result.failed} rejetée(s).` : result.error ?? "Import impossible");
    });
  }
  return <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"><div className="flex flex-wrap items-center gap-3"><input accept=".csv,text/csv" className="min-w-0 flex-1 text-sm" ref={inputRef} type="file" /><Button disabled={pending} onClick={upload} size="sm" variant="outline">{pending ? <LoaderCircle className="animate-spin" size={16} /> : <FileUp size={16} />} Importer CSV</Button></div><p className="mb-0 mt-2 text-xs text-slate-500">Colonnes : specialty_slug, pathology_slug, question_text, difficulty, explanation, source_title, option_a…option_f, correct_option.</p>{message && <p aria-live="polite" className="mb-0 mt-2 text-sm font-semibold text-teal-700">{message}</p>}</section>;
}
