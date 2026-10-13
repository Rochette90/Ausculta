"use client";

import { ArrowRight, CheckCircle2, Clock3, LoaderCircle, RotateCcw, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { answerDailyQuestion, type AnswerQuestionResult } from "@/app/actions/quiz";
import type { DailyQuiz, DailyQuizAttemptReview } from "@/lib/quiz/daily";
import { cn } from "@/lib/utils";
import { buttonVariants, Button } from "@/components/ui/button";
import { QuizAnswerList, QuizDifficultyBadge } from "./QuizPrimitives";
import { PROGRESS_EVENT_NAME } from "@/lib/brand";

type QuizFeedback = Pick<AnswerQuestionResult, "isCorrect" | "explanation" | "xpEarned" | "correctOptionId">;

export function DailyQuizCard({ quiz, specialtyName, initialAttempt }: { quiz: DailyQuiz; specialtyName: string; initialAttempt: DailyQuizAttemptReview | null }) {
  const [selectedId, setSelectedId] = useState<string | null>(initialAttempt?.selectedOptionId ?? null);
  const [feedback, setFeedback] = useState<QuizFeedback | null>(initialAttempt ? {
    isCorrect: initialAttempt.isCorrect,
    explanation: initialAttempt.explanation,
    xpEarned: initialAttempt.xpEarned,
    correctOptionId: initialAttempt.correctOptionId,
  } : null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitAnswer() {
    if (!selectedId || feedback) return;
    setError(null);
    startTransition(async () => {
      const result = await answerDailyQuestion({ questionId: quiz.question.id, selectedOptionId: selectedId });
      if (!result.success) {
        setError(result.error ?? "Impossible d’enregistrer la réponse");
        return;
      }
      setFeedback(result);
      window.dispatchEvent(new Event(PROGRESS_EVENT_NAME));
    });
  }

  if (initialAttempt?.isCorrect) {
    return (
      <section aria-label="Quiz du jour réussi" className="overflow-hidden rounded-[26px] border border-emerald-500/25 bg-[var(--surface)] shadow-[var(--shadow-md)]">
        <div className="grid lg:grid-cols-[270px_minmax(0,1fr)]">
          <div className="relative overflow-hidden bg-emerald-950 p-6 text-white sm:p-8">
            <div aria-hidden className="absolute -bottom-20 -right-20 size-56 rounded-full bg-emerald-400/20 blur-3xl" />
            <span className="relative grid size-12 place-items-center rounded-2xl bg-emerald-400 text-emerald-950"><CheckCircle2 size={24} /></span>
            <p className="relative mb-1 mt-5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">Session validée</p>
            <p className="relative m-0 text-xl font-extrabold">Question du jour</p>
            <p className="relative mb-0 mt-2 text-sm text-emerald-100/70">{specialtyName}</p>
          </div>
          <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 !text-xl">Objectif quotidien atteint</h3>
                {initialAttempt.xpEarned > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[var(--amber-light)] px-2.5 py-1 text-xs font-bold text-[var(--amber-dark)]"><Star size={13} /> +{initialAttempt.xpEarned} XP</span>}
              </div>
              <p className="mb-0 mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">Ta réponse est enregistrée. Poursuis avec une série ciblée ou reviens demain pour un nouveau cas.</p>
            </div>
            <Link className={cn(buttonVariants(), "shrink-0 no-underline")} href="#quiz-par-specialite">Continuer <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
      <div className="grid lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--surface-dark)] p-6 text-white lg:border-b-0 lg:border-r lg:border-white/10 sm:p-8">
          <div aria-hidden className="absolute -bottom-24 -left-20 size-64 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="relative flex items-center justify-between gap-3 lg:block">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-teal-200"><Sparkles size={13} /> QCM quotidien</span>
              <p className="mb-0 mt-5 text-2xl font-extrabold text-white">Cas clinique</p>
              <p className="mb-0 mt-1 text-sm font-medium text-slate-400">{specialtyName}</p>
            </div>
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 lg:mt-7">
              <div className="text-center"><strong className="block text-xl text-teal-300">01</strong><span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">question</span></div>
            </div>
          </div>
          <dl className="relative mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 lg:grid-cols-1">
            <div className="flex items-center gap-3"><Clock3 className="text-teal-300" size={17} /><div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Durée cible</dt><dd className="m-0 text-sm font-semibold text-slate-200">2 minutes</dd></div></div>
            <div className="flex items-center gap-3"><Star className="text-amber-300" size={17} /><div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Récompense</dt><dd className="m-0 text-sm font-semibold text-slate-200">+{quiz.question.xpReward} XP</dd></div></div>
          </dl>
        </aside>

        <div className="min-w-0">
          <header className="border-b border-[var(--line-subtle)] px-5 py-6 sm:px-8 sm:py-7 lg:px-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted-light)]">Analysez la situation et choisissez la meilleure réponse</p>
              <QuizDifficultyBadge difficulty={quiz.question.difficulty} />
            </div>
            <h3 className="mb-0 mt-5 max-w-4xl !text-[22px] !leading-[1.38] sm:!text-[26px]">{quiz.question.text}</h3>
            {quiz.question.imageUrl && <img alt={quiz.question.imageAlt ?? ""} className="mt-5 max-h-96 w-full rounded-2xl border border-[var(--line-subtle)] object-contain" src={quiz.question.imageUrl} />}
          </header>

          <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
            <QuizAnswerList
              feedback={feedback}
              onSelect={setSelectedId}
              options={quiz.question.options}
              pending={pending}
              selectedId={selectedId}
            />

            {feedback ? (
              <section aria-live="polite" className={cn("mt-6 overflow-hidden rounded-2xl border", feedback.isCorrect ? "border-emerald-500/25 bg-emerald-500/8" : "border-amber-500/25 bg-amber-500/8")}>
                <div className="flex flex-wrap items-center gap-3 border-b border-current/10 px-5 py-4 sm:px-6">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-white", feedback.isCorrect ? "bg-emerald-600" : "bg-amber-600")}>{feedback.isCorrect ? <CheckCircle2 size={19} /> : <RotateCcw size={17} />}</span>
                  <div>
                    <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">Correction clinique</p>
                    <strong className={cn("text-[15px]", feedback.isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300")}>{feedback.isCorrect ? "Bonne réponse" : "Point à consolider"}</strong>
                  </div>
                  {feedback.xpEarned > 0 && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1.5 text-sm font-bold text-[var(--amber-dark)] shadow-[var(--shadow-sm)]"><Star size={14} /> +{feedback.xpEarned} XP</span>}
                </div>
                <div className="px-5 py-5 sm:px-6">
                  <p className="m-0 leading-7 text-[var(--ink-secondary)]">{feedback.explanation ?? "La correction a bien été enregistrée."}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link className={cn(buttonVariants(), "no-underline")} href="#quiz-par-specialite">Continuer par spécialité <ArrowRight size={16} /></Link>
                    <Link className={cn(buttonVariants({ variant: "outline" }), "no-underline")} href="/dashboard">Voir ma progression</Link>
                  </div>
                </div>
              </section>
            ) : (
              <div className="mt-6 flex flex-col gap-4 border-t border-[var(--line-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 flex items-start gap-2 text-sm leading-6 text-[var(--muted)]"><Sparkles className="mt-1 shrink-0 text-amber-500" size={15} /> Une seule réponse est attendue. La correction apparaît après validation.</p>
                <Button className="w-full shrink-0 sm:w-auto" disabled={!selectedId || pending} onClick={submitAnswer} size="lg">
                  {pending && <LoaderCircle className="animate-spin" size={18} />}{pending ? "Correction…" : "Valider ma réponse"}
                </Button>
              </div>
            )}
            {error && <p className="mt-4 rounded-xl border border-rose-500/20 bg-[var(--red-light)] p-3 text-sm font-semibold text-[var(--red-dark)]" role="alert">{error}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
