"use client";

import { useMemo, useState, useTransition } from "react";
import { Activity, ArrowLeft, ArrowRight, BookOpenCheck, BrainCircuit, Check, CheckCircle2, Clock3, ExternalLink, LockKeyhole, RotateCcw, Sparkles, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setStudySessionStepCompletion } from "@/app/actions/study-sessions";
import type { StudySession, StudySessionStepKind } from "@/lib/study-sessions/catalog";
import { studySessionMastery, studySessionTitle } from "@/lib/study-sessions/mastery";
import { BRAND_NAME } from "@/lib/brand";

const iconByKind = {
  sheet: BookOpenCheck,
  tutorial: Activity,
  quiz: BrainCircuit,
  case: Stethoscope,
} satisfies Record<StudySessionStepKind, typeof Activity>;

const labelByKind: Record<StudySessionStepKind, string> = {
  sheet: "Comprendre",
  tutorial: "Appliquer une méthode",
  quiz: "Tester",
  case: "Décider en contexte",
};

export function StudySessionPlayer({ session, initialCompletedStepIds }: { session: StudySession; initialCompletedStepIds: string[] }) {
  const router = useRouter();
  const [completedIds, setCompletedIds] = useState(() => new Set(initialCompletedStepIds));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const completedCount = completedIds.size;
  const percentage = studySessionMastery(completedCount, session.steps.length);
  const currentIndex = session.steps.findIndex((step) => !completedIds.has(step.id));
  const completedMinutes = session.steps.reduce((sum, step) => sum + (completedIds.has(step.id) ? step.durationMinutes : 0), 0);
  const nextStep = currentIndex >= 0 ? session.steps[currentIndex] : null;
  const status = useMemo(() => percentage === 100 ? "Session terminée" : percentage > 0 ? "Session en cours" : "Prête à commencer", [percentage]);

  function toggleStep(stepId: string) {
    const wasCompleted = completedIds.has(stepId);
    const stepIndex = session.steps.findIndex((step) => step.id === stepId);
    const previous = new Set(completedIds);
    const optimistic = new Set(completedIds);
    if (wasCompleted) session.steps.slice(stepIndex).forEach((step) => optimistic.delete(step.id));
    else optimistic.add(stepId);
    setCompletedIds(optimistic);
    setPendingId(stepId);
    setMessage(null);
    startTransition(async () => {
      const result = await setStudySessionStepCompletion(session.slug, stepId, !wasCompleted);
      if (!result.ok) {
        setCompletedIds(previous);
        setMessage(result.message);
      } else router.refresh();
      setPendingId(null);
    });
  }

  return (
    <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pt-10">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700 dark:text-slate-300" href="/sessions"><ArrowLeft size={17} /> Toutes les sessions</Link>

      <section className="mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <header className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-teal-400/15 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-teal-400/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-teal-300">{session.specialty}</span><span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-slate-300">{session.level}</span></div><p className="mb-2 mt-7 text-xs font-extrabold uppercase tracking-[.16em] text-teal-300">{session.eyebrow}</p><h1 className="m-0 max-w-3xl !text-4xl !leading-[1.05] !text-white sm:!text-5xl">{studySessionTitle(session.subject, percentage)}</h1><p className="mb-0 mt-5 max-w-2xl text-base leading-7 text-slate-300">{session.description}</p></div>
            <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/[.06] p-5"><div className="grid size-24 place-items-center rounded-full p-2" style={{ background: `conic-gradient(#2dd4bf ${percentage * 3.6}deg, rgba(255,255,255,.12) 0deg)` }}><div className="grid size-full place-items-center rounded-full bg-slate-950 text-center"><span><b className="block text-2xl text-white">{percentage}%</b><small className="text-[9px] text-slate-400">terminé</small></span></div></div><div><p className="m-0 text-xs text-slate-400">{status}</p><strong className="mt-1 block text-xl text-white">{completedMinutes}/{session.durationMinutes} min</strong><span className="mt-2 inline-flex items-center gap-1.5 text-xs text-teal-300"><Clock3 size={14} /> {session.durationMinutes - completedMinutes} min restantes</span></div></div>
          </div>
        </header>

        <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[1fr_290px] lg:p-10">
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-extrabold uppercase tracking-[.14em] text-teal-700 dark:text-teal-300">Parcours guidé</p><h2 className="m-0 !text-2xl">Les quatre activités</h2></div><span className="text-xs font-semibold text-slate-500">Les contenus s&apos;ouvrent dans un nouvel onglet.</span></div>
            <div className="grid gap-3">
              {session.steps.map((step, index) => {
                const Icon = iconByKind[step.kind];
                const complete = completedIds.has(step.id);
                const unlocked = index === 0 || session.steps.slice(0, index).every((previous) => completedIds.has(previous.id));
                const current = currentIndex === index;
                return <article className={`rounded-2xl border p-4 transition sm:p-5 ${complete ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20" : current ? "border-teal-500 bg-white shadow-[0_10px_30px_rgba(13,148,136,.10)] dark:bg-slate-900" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"}`} key={step.id}>
                  <div className="grid grid-cols-[46px_1fr_auto] items-start gap-3 sm:gap-4"><span className={`grid size-11 place-items-center rounded-xl ${complete ? "bg-emerald-600 text-white" : current ? "bg-teal-600 text-white" : "bg-white text-slate-400 dark:bg-slate-900"}`}>{complete ? <Check size={20} /> : unlocked ? <Icon size={20} /> : <LockKeyhole size={18} />}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-teal-700 dark:text-teal-300">Étape {index + 1} · {labelByKind[step.kind]}</span><span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400"><Clock3 size={11} /> {step.durationMinutes} min</span></div><h3 className="mb-0 mt-1.5 text-lg">{step.title}</h3><p className="mb-0 mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{step.description}</p></div><span className="pt-1 text-xs font-bold text-slate-400">{complete ? "Terminée" : unlocked ? current ? "À faire" : "Disponible" : "Verrouillée"}</span></div>
                  {unlocked && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-700"><Link className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white no-underline hover:bg-teal-700 dark:bg-white dark:text-slate-950" href={step.href} rel="noreferrer" target="_blank">Ouvrir le contenu <ExternalLink size={14} /></Link><button className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${complete ? "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" : "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200"}`} disabled={isPending && pendingId === step.id} onClick={() => toggleStep(step.id)} type="button">{complete ? <><RotateCcw size={14} /> Reprendre depuis ici</> : <><CheckCircle2 size={14} /> {isPending && pendingId === step.id ? "Enregistrement…" : "J'ai terminé cette étape"}</>}</button></div>}
                </article>;
              })}
            </div>
            {message && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">{message}</p>}
          </section>

          <aside className="grid content-start gap-4 lg:sticky lg:top-24">
            <div className="rounded-2xl bg-slate-950 p-6 text-white"><Sparkles className="text-teal-300" size={22} /><p className="mb-1 mt-5 text-[10px] font-extrabold uppercase tracking-[.14em] text-teal-300">Prochaine action</p><h2 className="m-0 !text-xl !text-white">{nextStep ? nextStep.title : "Session accomplie"}</h2><p className="mb-0 mt-3 text-sm leading-6 text-slate-400">{nextStep ? `${nextStep.durationMinutes} minutes pour avancer sans disperser ton attention.` : "Les quatre activités sont terminées. Tu peux reprendre une étape à tout moment."}</p>{nextStep && <Link className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 text-sm font-bold text-slate-950 no-underline" href={nextStep.href} rel="noreferrer" target="_blank">Commencer <ArrowRight size={15} /></Link>}</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60"><div className="flex items-center justify-between text-xs font-semibold text-slate-500"><span>Progression</span><strong className="text-slate-900 dark:text-white">{completedCount}/{session.steps.length}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><span className="block h-full rounded-full bg-teal-600 transition-all" style={{ width: `${percentage}%` }} /></div><p className="mb-0 mt-4 text-xs leading-5 text-slate-500">La progression est liée à ton compte {BRAND_NAME} et reste disponible sur tes appareils.</p></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
