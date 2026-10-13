import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CircleGauge,
  Clock3,
  Layers3,
  LockKeyhole,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { DailyQuizCard } from "@/components/quiz/DailyQuizCard";
import { SpecialtyIcon } from "@/components/content/SpecialtyIcon";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { cn } from "@/lib/utils";
import { getDailyQuiz, getDailyQuizAttempt } from "@/lib/quiz/daily";
import { getSpecialtyQuizCatalog } from "@/lib/quiz/specialty";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("QCM") };

export default async function QuizPage() {
  const user = await requireUser("/quiz");
  // La question du jour peut être dépubliée en cours de journée : le reste du
  // centre QCM doit rester accessible (même comportement que le tableau de bord).
  const [quiz, specialties] = await Promise.all([
    getDailyQuiz().catch((error: unknown) => {
      console.error("Daily quiz unavailable", error);
      return null;
    }),
    getSpecialtyQuizCatalog(user.id),
  ]);
  const initialAttempt = quiz ? await getDailyQuizAttempt(user.id, quiz) : null;
  const specialtyName = specialties.find((specialty) => specialty.id === quiz?.question.specialtyId)?.name ?? "Toutes spécialités";
  const availableCount = specialties.filter((specialty) => specialty.questionCount > 0).length;
  const totalQuestions = specialties.reduce((total, specialty) => total + specialty.questionCount, 0);
  const totalMastered = specialties.reduce((total, specialty) => total + specialty.masteredCount, 0);
  const masteryRate = totalQuestions === 0 ? 0 : Math.round((totalMastered / totalQuestions) * 100);

  return (
    <main className="page-enter mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] no-underline transition-colors hover:text-[var(--primary)]" href="/dashboard">
        <ArrowLeft size={16} /> Tableau de bord
      </Link>

      <header className="relative isolate overflow-hidden rounded-[30px] bg-[var(--surface-dark)] px-6 py-8 text-white shadow-[var(--shadow-lg)] sm:px-9 sm:py-10 lg:px-12 lg:py-11">
        <div aria-hidden className="absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div aria-hidden className="absolute -right-24 -top-32 -z-10 size-96 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="grid items-end gap-9 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-200">
              <CircleGauge size={14} /> Centre d’entraînement clinique
            </span>
            <h1 className="mb-0 mt-5 max-w-3xl !text-[38px] !leading-[1.08] !text-white sm:!text-[48px] lg:!text-[56px]">
              Raisonnez comme à l’examen. <span className="!text-teal-300">Décidez comme en clinique.</span>
            </h1>
            <p className="mb-0 mt-5 max-w-2xl text-[15px] leading-7 text-slate-300 sm:text-base">
              Des séries ciblées, des distracteurs exigeants et une correction immédiatement exploitable pour consolider tes décisions cliniques.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className={cn(buttonVariants({ size: "lg" }), "bg-teal-400 text-slate-950 no-underline hover:bg-teal-300")} href="#question-du-jour">
                Commencer le QCM du jour <ArrowRight size={17} />
              </Link>
              <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/15 bg-white/5 text-white no-underline hover:border-white/30 hover:bg-white/10 hover:text-white")} href="#quiz-par-specialite">
                Choisir une spécialité
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] backdrop-blur-sm">
            <div className="border-b border-r border-white/10 p-5">
              <dt className="text-xs font-semibold text-slate-400">Banque active</dt>
              <dd className="m-0 mt-1"><strong className="block text-2xl font-extrabold text-white">{totalQuestions}</strong><span className="text-xs text-slate-400">questions publiées</span></dd>
            </div>
            <div className="border-b border-white/10 p-5">
              <dt className="text-xs font-semibold text-slate-400">Spécialités</dt>
              <dd className="m-0 mt-1"><strong className="block text-2xl font-extrabold text-white">{availableCount}</strong><span className="text-xs text-slate-400">disponibles</span></dd>
            </div>
            <div className="border-r border-white/10 p-5">
              <dt className="text-xs font-semibold text-slate-400">Maîtrisées</dt>
              <dd className="m-0 mt-1"><strong className="block text-2xl font-extrabold text-teal-300">{totalMastered}</strong><span className="text-xs text-slate-400">réponses acquises</span></dd>
            </div>
            <div className="p-5">
              <dt className="text-xs font-semibold text-slate-400">Progression</dt>
              <dd className="m-0 mt-1"><strong className="block text-2xl font-extrabold text-white">{masteryRate}%</strong><span className="text-xs text-slate-400">du catalogue</span></dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="scroll-mt-24 pt-12" id="question-du-jour">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--primary)]"><Sparkles size={14} /> Rituel quotidien</p>
            <h2 className="m-0 !text-[28px] sm:!text-[32px]">Question du jour</h2>
          </div>
          <p className="m-0 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)]"><Clock3 size={16} /> Environ 2 minutes</p>
        </div>
        {quiz ? (
          <DailyQuizCard initialAttempt={initialAttempt} quiz={quiz} specialtyName={specialtyName} />
        ) : (
          <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]" role="status">
            <p className="m-0 font-bold text-[var(--ink)]">La question du jour est momentanément indisponible.</p>
            <p className="mb-0 mt-2 text-sm leading-6 text-[var(--muted)]">Tes séries par spécialité restent accessibles juste en dessous.</p>
            <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] no-underline" href="#quiz-par-specialite">Choisir une spécialité <ArrowRight size={16} /></Link>
          </div>
        )}
      </section>

      <section className="scroll-mt-24 pt-14" id="quiz-par-specialite">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--primary)]"><Target size={14} /> Entraînement ciblé</p>
            <h2 className="m-0 !text-[28px] sm:!text-[32px]">Quiz par spécialité</h2>
            <p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Chaque série contient jusqu’à 10 questions. Les notions qui ne sont pas encore maîtrisées passent en priorité.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-xs font-semibold text-[var(--muted)] shadow-[var(--shadow-sm)]">
            <Layers3 className="text-[var(--primary)]" size={16} /> {availableCount} parcours actifs
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {specialties.map((specialty, index) => {
            const available = specialty.questionCount > 0;
            const progress = specialty.questionCount === 0 ? 0 : Math.round((specialty.masteredCount / specialty.questionCount) * 100);
            const content = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={cn("grid size-11 place-items-center rounded-xl border", available ? "border-teal-500/15 bg-[var(--primary-subtle)] text-[var(--primary)]" : "border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--muted-light)]")}>
                      <SpecialtyIcon name={specialty.icon} size={21} />
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--muted-light)]">Parcours {String(index + 1).padStart(2, "0")}</span>
                  </div>
                  {available ? <ArrowRight className="text-[var(--muted-light)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--primary)]" size={18} /> : <LockKeyhole className="text-[var(--muted-light)]" size={17} />}
                </div>
                <h3 className="mb-1.5 mt-5 !text-[19px]">{specialty.name}</h3>
                <p className="mb-0 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{specialty.description ?? "Révisez les situations cliniques essentielles de cette spécialité."}</p>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="m-0 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted-light)]">{available ? "Progression" : "Disponibilité"}</p>
                    <p className="mb-0 mt-1 text-sm font-bold text-[var(--ink)]">{available ? `${specialty.masteredCount} / ${specialty.questionCount} maîtrisées` : "En préparation"}</p>
                  </div>
                  {available && <span className="text-lg font-extrabold text-[var(--primary)]">{progress}%</span>}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                  <div className={cn("h-full rounded-full transition-[width]", available ? "bg-[var(--primary)]" : "bg-[var(--line)]")} style={{ width: `${available ? Math.max(progress, 3) : 100}%` }} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line-subtle)] pt-4 text-xs font-semibold text-[var(--muted)]">
                  <span>{available ? `${specialty.questionCount} QCM disponibles` : "Questions à venir"}</span>
                  {available && <span className="inline-flex items-center gap-1.5 text-[var(--primary)]"><Check size={14} /> Série de 10</span>}
                </div>
              </>
            );

            return available ? (
              <Link className="group rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 text-[var(--ink)] no-underline shadow-[var(--shadow-sm)] transition-[transform,border-color,box-shadow] hover:-translate-y-1 hover:border-teal-500/35 hover:shadow-[var(--shadow-md)]" href={`/quiz/${specialty.slug}`} key={specialty.id}>{content}</Link>
            ) : (
              <article className="rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--surface-subtle)]/50 p-5 text-[var(--muted)]" key={specialty.id}>{content}</article>
            );
          })}
        </div>
      </section>

      <section className="mt-12 grid gap-5 overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--primary-subtle)] text-[var(--primary)]"><BookOpenCheck size={23} /></span>
          <div>
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary)]">Révision active</p>
            <h2 className="mb-0 mt-1 !text-xl">Une hésitation ? Reviens à la fiche de référence.</h2>
            <p className="mb-0 mt-2 text-sm leading-6 text-[var(--muted)]">Relie chaque erreur à la théorie, puis reteste-toi jusqu’à ce que le raisonnement devienne automatique.</p>
          </div>
        </div>
        <Link className={cn(buttonVariants({ variant: "outline" }), "no-underline")} href="/specialties">Ouvrir les fiches <ArrowRight size={16} /></Link>
      </section>
    </main>
  );
}
