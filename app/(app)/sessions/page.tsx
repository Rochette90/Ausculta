import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import {
  studySessions,
  type StudySessionStepKind,
} from "@/lib/study-sessions/catalog";
import { studySessionMastery, studySessionTitle } from "@/lib/study-sessions/mastery";
import { getStudySessionProgress } from "@/lib/study-sessions/progress";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Sessions de travail") };

const accentClasses = {
  teal: "from-teal-500 to-teal-900",
  sky: "from-sky-500 to-blue-950",
  violet: "from-violet-500 to-indigo-950",
  emerald: "from-emerald-500 to-emerald-950",
  amber: "from-amber-500 to-orange-950",
  rose: "from-rose-500 to-rose-950",
  indigo: "from-indigo-500 to-slate-950",
  cyan: "from-cyan-500 to-teal-950",
};

const iconByKind = {
  sheet: BookOpenCheck,
  tutorial: Activity,
  quiz: BrainCircuit,
  case: Stethoscope,
} satisfies Record<StudySessionStepKind, typeof Activity>;

export default async function SessionsPage() {
  const user = await requireUser("/sessions");
  const progress = await getStudySessionProgress(user.id);
  const completedBySession = new Map<string, Set<string>>();
  progress.forEach((item) => {
    const steps = completedBySession.get(item.sessionSlug) ?? new Set<string>();
    steps.add(item.stepId);
    completedBySession.set(item.sessionSlug, steps);
  });

  return (
    <main className="page-enter mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pt-10">
      <header className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-10 lg:px-12 lg:py-12">
        <div
          className="absolute -right-20 -top-24 size-72 rounded-full bg-teal-400/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl">
          <span className="grid size-12 place-items-center rounded-2xl bg-teal-400/15 text-teal-300">
            <Sparkles size={23} />
          </span>
          <p className="mb-2 mt-7 text-xs font-extrabold uppercase tracking-[.17em] text-teal-300">
            Sessions guidées · 30 minutes
          </p>
          <h1 className="m-0 !text-4xl !leading-[1.04] !text-white sm:!text-6xl">
            Une séance complète,{" "}
            <em className="text-teal-300">sans choisir au hasard.</em>
          </h1>
          <p className="mb-0 mt-6 max-w-2xl text-base leading-7 text-slate-300">
            Chaque session relie une fiche, un tutoriel, un QCM et un cas
            clinique autour du même problème. Avance dans l&apos;ordre et
            reprends exactement où tu t&apos;es arrêté.
          </p>
        </div>
      </header>

      <section className="mt-9">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-[.15em] text-teal-700 dark:text-teal-300">
              Ton programme
            </p>
            <h2 className="m-0 !text-3xl">
              Choisis ton objectif clinique
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            <Clock3 size={15} /> 30 minutes par session
          </span>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {studySessions.map((session, sessionIndex) => {
            const completed =
              completedBySession.get(session.slug) ?? new Set<string>();
            const percentage = studySessionMastery(
              completed.size,
              session.steps.length,
            );
            return (
              <Link
                className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white text-slate-950 no-underline shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                href={`/sessions/${session.slug}`}
                key={session.slug}
              >
                <div
                  className={`relative bg-gradient-to-br ${accentClasses[session.accent]} p-6 text-white sm:p-7`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/15 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em]">
                      {session.specialty}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white/75">
                      <Clock3 size={14} /> {session.durationMinutes} min
                    </span>
                  </div>
                  <p className="mb-2 mt-10 text-[10px] font-extrabold uppercase tracking-[.14em] text-white/65">
                    {session.eyebrow}
                  </p>
                <h3 className="m-0 !text-3xl !text-white lg:min-h-[72px]">
                  {studySessionTitle(session.subject, percentage)}
                </h3>
                  {sessionIndex === 0 && (
                    <span className="absolute right-6 top-16 rounded-full bg-white px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.1em] text-teal-800">
                      Recommandée
                    </span>
                  )}
                </div>
                <div className="p-6 sm:p-7">
                  <p className="m-0 min-h-[72px] text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {session.description}
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                    {session.steps.map((step) => {
                      const Icon = iconByKind[step.kind];
                      const done = completed.has(step.id);
                      return (
                        <span
                          className={`grid size-9 place-items-center rounded-xl ${done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}
                          key={step.id}
                        >
                          {done ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <Icon size={16} />
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>
                        {completed.size === 0
                          ? "Non commencée"
                          : percentage === 100
                            ? "Terminée"
                            : "En cours"}
                      </span>
                      <strong className="text-slate-900 dark:text-white">
                        {percentage}%
                      </strong>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <span
                        className="block h-full rounded-full bg-teal-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <b className="mt-6 flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
                    {percentage > 0
                      ? "Reprendre la session"
                      : "Commencer la session"}{" "}
                    <ArrowRight
                      className="transition group-hover:translate-x-1"
                      size={16}
                    />
                  </b>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
