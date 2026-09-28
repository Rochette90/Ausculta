"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  GraduationCap,
  LoaderCircle,
  Sparkles,
  Stethoscope,
  TimerReset,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SpecialtyIcon } from "../content/SpecialtyIcon";
import { BRAND_NAME } from "@/lib/brand";

type SpecialtyOption = {
  id: string;
  name: string;
  icon: string | null;
};

type OnboardingFlowProps = {
  minimumExamDate: string;
  nextPath: string;
  specialties: SpecialtyOption[];
};

const priorities = [
  { id: "fiches", label: "Réviser les fiches", detail: "Consolider rapidement les notions essentielles.", icon: BookOpenCheck },
  { id: "qcm", label: "Faire des QCM", detail: "Tester mes connaissances et corriger mes erreurs.", icon: BrainCircuit },
  { id: "cas_cliniques", label: "Travailler des cas", detail: "Développer mon raisonnement clinique.", icon: Stethoscope },
  { id: "seances", label: "Suivre des séances", detail: "Avancer avec un entraînement guidé de 30 minutes.", icon: TimerReset },
] as const;

export function OnboardingFlow({ minimumExamDate, nextPath, specialties }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [university, setUniversity] = useState("lausanne");
  const [studyYear, setStudyYear] = useState("b3");
  const [examDate, setExamDate] = useState("");
  const [learningPriority, setLearningPriority] = useState("");
  const [specialtyIds, setSpecialtyIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = step === 1
    ? Boolean(university && studyYear)
    : step === 2
      ? Boolean(learningPriority)
      : specialtyIds.length >= 2 && specialtyIds.length <= 3;

  function toggleSpecialty(id: string) {
    setError(null);
    setSpecialtyIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 3 ? [...current, id] : current);
  }

  async function submit(mode: "complete" | "skip") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "skip" ? { mode } : {
          mode,
          university,
          studyYear,
          examDate: examDate || null,
          learningPriority,
          specialtyIds,
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
      router.push(nextPath);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Enregistrement impossible.");
      setBusy(false);
    }
  }

  function continueToNextStep() {
    if (!canContinue) return;
    setError(null);
    if (step < 3) setStep((current) => current + 1);
    else void submit("complete");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20"><GraduationCap size={22} /></span>
            <div><strong className="block text-base text-slate-950">Bienvenue sur {BRAND_NAME}</strong><span className="text-xs text-slate-500">Quelques choix pour personnaliser ton espace</span></div>
          </div>
          <button className="text-sm font-semibold text-slate-500 transition hover:text-slate-900" disabled={busy} onClick={() => void submit("skip")} type="button">Passer pour le moment</button>
        </header>

        <div className="mt-7 grid grid-cols-3 gap-2" aria-label={`Étape ${step} sur 3`}>
          {[1, 2, 3].map((item) => <span className={`h-1.5 rounded-full transition ${item <= step ? "bg-teal-600" : "bg-slate-200"}`} key={item} />)}
        </div>

        <section className="mt-5 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="border-b border-slate-100 px-6 py-7 sm:px-10 sm:py-9">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[.16em] text-teal-700">Étape {step} sur 3</p>
            {step === 1 && <><h1 className="m-0 !text-3xl sm:!text-4xl">Où en es-tu dans tes études ?</h1><p className="mb-0 mt-3 text-slate-500">Ces informations nous aident à proposer un rythme adapté.</p></>}
            {step === 2 && <><h1 className="m-0 !text-3xl sm:!text-4xl">Quelle est ta priorité actuelle ?</h1><p className="mb-0 mt-3 text-slate-500">Ton tableau de bord commencera par l’activité la plus utile pour toi.</p></>}
            {step === 3 && <><h1 className="m-0 !text-3xl sm:!text-4xl">Que veux-tu travailler en premier ?</h1><p className="mb-0 mt-3 text-slate-500">Choisis deux ou trois spécialités. Tu pourras les modifier plus tard.</p></>}
          </div>

          <div className="px-6 py-7 sm:px-10 sm:py-9">
            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-slate-700">Université
                  <select className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15" onChange={(event) => setUniversity(event.target.value)} value={university}>
                    <option value="lausanne">Université de Lausanne</option><option value="geneve">Université de Genève</option><option value="fribourg">Université de Fribourg</option><option value="berne">Université de Berne</option><option value="bale">Université de Bâle</option><option value="zurich">Université de Zurich</option><option value="autre">Autre université</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">Année d’études
                  <select className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15" onChange={(event) => setStudyYear(event.target.value)} value={studyYear}>
                    <option value="b1">Bachelor 1</option><option value="b2">Bachelor 2</option><option value="b3">Bachelor 3</option><option value="m1">Master 1</option><option value="m2">Master 2</option><option value="m3">Master 3</option><option value="autre">Autre</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">Date du prochain examen <span className="font-normal text-slate-400">(facultatif)</span>
                  <input className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15" min={minimumExamDate} onChange={(event) => setExamDate(event.target.value)} type="date" value={examDate} />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {priorities.map(({ id, label, detail, icon: Icon }) => {
                  const selected = learningPriority === id;
                  return <button aria-pressed={selected} className={`flex min-h-32 items-start gap-4 rounded-2xl border p-5 text-left transition ${selected ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/10" : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"}`} key={id} onClick={() => setLearningPriority(id)} type="button"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${selected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}><Icon size={20} /></span><span><strong className="block text-base text-slate-950">{label}</strong><span className="mt-1 block text-sm leading-6 text-slate-500">{detail}</span></span></button>;
                })}
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="mb-4 flex items-center justify-between gap-4"><span className="text-sm font-semibold text-slate-500">{specialtyIds.length}/3 sélectionnées</span>{specialtyIds.length >= 2 && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><Check size={15} /> Sélection suffisante</span>}</div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {specialties.map((specialty) => {
                    const selected = specialtyIds.includes(specialty.id);
                    return <button aria-pressed={selected} className={`flex min-h-20 items-center gap-3 rounded-2xl border p-4 text-left transition ${selected ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/10" : "border-slate-200 hover:border-teal-300"}`} key={specialty.id} onClick={() => toggleSpecialty(specialty.id)} type="button"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}><SpecialtyIcon name={specialty.icon} /></span><strong className="min-w-0 flex-1 text-sm text-slate-900">{specialty.name}</strong>{selected && <Check className="shrink-0 text-teal-700" size={17} />}</button>;
                  })}
                </div>
              </div>
            )}

            {error && <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}

            <footer className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <button className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold ${step === 1 ? "invisible" : "text-slate-600 hover:text-slate-950"}`} disabled={busy || step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))} type="button"><ArrowLeft size={17} /> Retour</button>
              <button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-45" disabled={busy || !canContinue} onClick={continueToNextStep} type="button">{busy ? <><LoaderCircle className="animate-spin" size={17} /> Enregistrement…</> : step === 3 ? <><Sparkles size={17} /> Personnaliser mon espace</> : <>Continuer <ArrowRight size={17} /></>}</button>
            </footer>
          </div>
        </section>
        <p className="mt-5 text-center text-xs text-slate-400">Moins d’une minute · Modifiable à tout moment depuis ton profil</p>
      </div>
    </main>
  );
}
