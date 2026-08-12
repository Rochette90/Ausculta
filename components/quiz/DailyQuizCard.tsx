"use client";

import { CheckCircle2, CircleX, LoaderCircle, RotateCcw, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { answerDailyQuestion, type AnswerQuestionResult } from "../../app/actions/quiz";
import type { DailyQuiz, DailyQuizAttemptReview } from "../../lib/quiz/daily";
import { buttonVariants, Button } from "../ui/button";
import { cn } from "../../lib/utils";

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

  if (initialAttempt?.isCorrect) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6" aria-label="Quiz du jour réussi">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white"><CheckCircle2 size={24} /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Quiz du jour réussi</p>{initialAttempt.xpEarned > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"><Star size={13} /> +{initialAttempt.xpEarned} XP</span>}</div>
            <p className="mb-0 mt-1 truncate text-sm font-semibold text-slate-700">{specialtyName} · Revenez demain pour une nouvelle question.</p>
          </div>
        </div>
        <Link className={cn(buttonVariants(), "shrink-0")} href="#quiz-par-specialite">Continuer par spécialité</Link>
      </section>
    );
  }

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
      window.dispatchEvent(new Event("medtrain:progress"));
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl">
        <header className="bg-slate-950 px-6 py-7 text-white sm:px-9">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-teal-400/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-teal-300">Quiz du jour</span><span className="text-sm text-slate-400">{specialtyName} · difficulté {quiz.question.difficulty}</span></div>
          <h1 className="mb-0 mt-6 max-w-3xl !text-3xl !leading-tight !text-white sm:!text-4xl">{quiz.question.text}</h1>
        </header>

        <div className="p-5 sm:p-9">
          <div className="grid gap-3" role="radiogroup" aria-label="Réponses proposées">
            {quiz.question.options.map((option, index) => {
              const selected = selectedId === option.id;
              const correct = feedback?.correctOptionId === option.id;
              const wrongSelection = Boolean(feedback && selected && !feedback.isCorrect);
              return (
                <button aria-checked={selected} className={cn("flex items-center gap-4 rounded-2xl border p-4 text-left transition", !feedback && selected ? "border-teal-500 bg-teal-50" : !feedback ? "border-slate-200 hover:border-teal-300 hover:bg-slate-50" : correct ? "border-emerald-300 bg-emerald-50" : wrongSelection ? "border-rose-300 bg-rose-50" : "border-slate-100 bg-slate-50 text-slate-400")} disabled={Boolean(feedback) || pending} key={option.id} onClick={() => setSelectedId(option.id)} role="radio" type="button">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold", correct ? "bg-emerald-600 text-white" : wrongSelection ? "bg-rose-600 text-white" : selected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600")}>{correct ? <CheckCircle2 size={18} /> : wrongSelection ? <CircleX size={18} /> : String.fromCharCode(65 + index)}</span>
                  <span className="font-semibold">{option.text}</span>
                </button>
              );
            })}
          </div>

          {feedback ? (
            <section className={cn("mt-6 rounded-2xl border p-5", feedback.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")} aria-live="polite">
              <div className="flex items-center gap-3">{feedback.isCorrect ? <CheckCircle2 className="text-emerald-700" /> : <RotateCcw className="text-amber-700" />}<strong className="text-lg">{feedback.isCorrect ? "Bonne réponse" : "À retenir pour la prochaine fois"}</strong>{feedback.xpEarned > 0 && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-bold text-amber-700"><Star size={15} /> +{feedback.xpEarned} XP</span>}</div>
              <p className="mb-0 mt-3 leading-7 text-slate-700">{feedback.explanation ?? "La correction a bien été enregistrée."}</p>
              <div className="mt-5 flex flex-wrap gap-3"><Link className={buttonVariants()} href="#quiz-par-specialite">Continuer par spécialité</Link><Link className={buttonVariants({ variant: "outline" })} href="/dashboard">Voir ma progression</Link></div>
            </section>
          ) : (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="m-0 inline-flex items-center gap-2 text-sm text-slate-500"><Sparkles size={16} /> {quiz.question.xpReward} XP si la réponse est correcte</p><Button disabled={!selectedId || pending} onClick={submitAnswer}>{pending ? <LoaderCircle className="animate-spin" size={18} /> : null}{pending ? "Correction…" : "Valider ma réponse"}</Button></div>
          )}
          {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}
