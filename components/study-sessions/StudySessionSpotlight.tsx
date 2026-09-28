import { Activity, ArrowRight, BookOpenCheck, BrainCircuit, CheckCircle2, Clock3, Flame, LockKeyhole, Stethoscope } from "lucide-react";
import Link from "next/link";
import type { StudySession, StudySessionStepKind } from "@/lib/study-sessions/catalog";
import { studySessionMastery, studySessionTitle } from "@/lib/study-sessions/mastery";

const iconByKind = {
  sheet: BookOpenCheck,
  tutorial: Activity,
  quiz: BrainCircuit,
  case: Stethoscope,
} satisfies Record<StudySessionStepKind, typeof Activity>;

export function StudySessionSpotlight({
  session,
  completedStepIds,
  streak,
}: {
  session: StudySession;
  completedStepIds: string[];
  streak: number;
}) {
  const completed = new Set(completedStepIds);
  const currentIndex = session.steps.findIndex((step) => !completed.has(step.id));
  const completedCount = completed.size;
  const percentage = studySessionMastery(completedCount, session.steps.length);
  const remainingMinutes = session.steps.reduce((sum, step) => sum + (completed.has(step.id) ? 0 : step.durationMinutes), 0);

  return (
    <section className="relative mt-7" aria-labelledby="featured-session-title">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_-38px_rgba(15,23,42,.45)] dark:border-slate-700 dark:bg-slate-900">
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 sm:px-8 dark:border-slate-700 dark:bg-slate-800/70">
          <span className="inline-flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-[.14em] text-slate-500 dark:text-slate-300"><i className="size-2 rounded-full bg-teal-600 shadow-[0_0_0_6px_rgba(13,148,136,.12)]" /> Session recommandée</span>
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.12em] text-orange-600"><Flame size={16} /> {streak} jour{streak > 1 ? "s" : ""}</span>
        </header>

        <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[1fr_150px] lg:items-start lg:px-10 lg:py-9">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-teal-700 dark:text-teal-300">Ta prochaine étape</p>
            <h2 className="m-0 !text-3xl sm:!text-4xl" id="featured-session-title">{studySessionTitle(session.subject, percentage)}</h2>
            <p className="mb-0 mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{session.description}</p>
          </div>
          <div className="flex items-center gap-4 lg:block lg:text-center">
            <div className="grid size-24 shrink-0 place-items-center rounded-full p-2" style={{ background: `conic-gradient(#0f9f8f ${percentage * 3.6}deg, #e2e8f0 0deg)` }}>
              <div className="grid size-full place-items-center rounded-full bg-white text-center dark:bg-slate-900"><span><b className="block text-xl text-slate-950 dark:text-white">{percentage}%</b><small className="text-[9px] font-bold text-slate-500">maîtrisé</small></span></div>
            </div>
            <div className="lg:mt-3"><span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300"><Clock3 size={14} /> {remainingMinutes || session.durationMinutes} min {percentage === 100 ? "au total" : "restantes"}</span></div>
          </div>
        </div>

        <div className="grid gap-2.5 px-5 sm:px-8 lg:px-10">
          {session.steps.map((step, index) => {
            const Icon = iconByKind[step.kind];
            const isComplete = completed.has(step.id);
            const isCurrent = currentIndex === index;
            const isLocked = currentIndex >= 0 && index > currentIndex;
            return (
              <Link
                aria-disabled={isLocked}
                className={`grid min-h-[74px] grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border p-3.5 no-underline transition sm:px-5 ${isComplete ? "border-teal-200 bg-teal-50 text-slate-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-white" : isCurrent ? "border-teal-600 bg-white text-slate-950 shadow-[0_8px_24px_rgba(13,148,136,.10)] dark:bg-slate-900 dark:text-white" : "pointer-events-none border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/60"}`}
                href={`/sessions/${session.slug}`}
                key={step.id}
              >
                <span className={`grid size-11 place-items-center rounded-xl ${isComplete ? "bg-white text-teal-700 dark:bg-teal-950" : isCurrent ? "bg-teal-600 text-white" : "bg-white text-slate-400 dark:bg-slate-900"}`}><Icon size={20} /></span>
                <span className="min-w-0"><strong className="block truncate text-sm sm:text-base">{step.title}</strong><small className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{isComplete ? `Terminée · ${step.durationMinutes} min` : isLocked ? "Débloquée après l'étape précédente" : `${step.durationMinutes} min · ${step.description}`}</small></span>
                {isComplete ? <CheckCircle2 className="text-teal-600" size={20} /> : isLocked ? <LockKeyhole size={18} /> : <ArrowRight className="text-teal-600" size={20} />}
              </Link>
            );
          })}
        </div>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-5 sm:px-8 lg:px-10 dark:border-slate-800">
          <div className="min-w-[180px] flex-1"><div className="flex items-center justify-between text-xs font-semibold text-slate-500"><span>Progression de la session</span><strong className="text-slate-900 dark:text-white">{completedCount}/{session.steps.length} activités</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><span className="block h-full rounded-full bg-gradient-to-r from-teal-700 to-teal-300" style={{ width: `${percentage}%` }} /></div></div>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white no-underline hover:bg-teal-700 dark:bg-teal-500 dark:text-slate-950" href={`/sessions/${session.slug}`}>{percentage > 0 ? "Reprendre" : "Commencer"} <ArrowRight size={16} /></Link>
        </footer>
      </div>
    </section>
  );
}
