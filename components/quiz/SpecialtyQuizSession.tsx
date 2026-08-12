"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, CircleX, LoaderCircle, RotateCcw, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { answerQuestion, type AnswerQuestionResult } from "../../app/actions/quiz";
import type { SpecialtyQuiz } from "../../lib/quiz/specialty";
import { cn } from "../../lib/utils";
import { Button, buttonVariants } from "../ui/button";

type Feedback = Pick<AnswerQuestionResult, "isCorrect" | "explanation" | "xpEarned" | "correctOptionId">;

export function SpecialtyQuizSession({ quiz }: { quiz: SpecialtyQuiz }) {
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [answers, setAnswers] = useState<Array<{ isCorrect: boolean; xpEarned: number }>>([]);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (quiz.questions.length === 0) {
    return (
      <main className="page-enter mx-auto w-full max-w-3xl px-4 pb-28 pt-10 sm:px-6">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/quiz"><ArrowLeft size={17} /> Tous les quiz</Link>
        <section className="mt-8 rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-lg sm:p-12">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-50 text-3xl">✦</span>
          <h1 className="mb-3 mt-6">Quiz {quiz.specialty.name}</h1>
          <p className="mx-auto max-w-lg leading-7 text-slate-600">Les premières questions sont en préparation. La spécialité est déjà ouverte dans le catalogue et sera alimentée progressivement.</p>
          <Link className={cn(buttonVariants(), "mt-5")} href="/quiz">Choisir une autre spécialité</Link>
        </section>
      </main>
    );
  }

  const question = quiz.questions[index];
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const totalXp = answers.reduce((total, answer) => total + answer.xpEarned, 0);

  function submitAnswer() {
    if (!selectedId || feedback) return;
    setError(null);
    startTransition(async () => {
      const result = await answerQuestion({ questionId: question.id, selectedOptionId: selectedId });
      if (!result.success) {
        setError(result.error ?? "Impossible d’enregistrer la réponse");
        return;
      }
      setFeedback(result);
      setAnswers((current) => [...current, { isCorrect: result.isCorrect, xpEarned: result.xpEarned }]);
      window.dispatchEvent(new Event("medtrain:progress"));
    });
  }

  function nextQuestion() {
    if (index === quiz.questions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelectedId(null);
    setFeedback(null);
    setError(null);
  }

  function restart() {
    setIndex(0);
    setSelectedId(null);
    setFeedback(null);
    setAnswers([]);
    setFinished(false);
    setError(null);
  }

  if (finished) {
    const percentage = Math.round((correctCount / quiz.questions.length) * 100);
    return (
      <main className="page-enter mx-auto w-full max-w-3xl px-4 pb-28 pt-10 sm:px-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white text-center shadow-xl">
          <div className="bg-slate-950 px-6 py-10 text-white sm:px-10">
            <Trophy className="mx-auto text-teal-300" size={44} />
            <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Quiz terminé · {quiz.specialty.name}</p>
            <h1 className="m-0 !text-white">{percentage >= 75 ? "Très solide." : "Encore un tour et ce sera acquis."}</h1>
          </div>
          <div className="p-7 sm:p-10">
            <div className="mx-auto grid size-40 place-items-center rounded-full border-[12px] border-teal-100 bg-teal-50"><div><strong className="block text-4xl text-slate-950">{correctCount}/{quiz.questions.length}</strong><span className="text-sm font-semibold text-slate-500">réponses justes</span></div></div>
            <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-2xl">{percentage}%</strong><span className="text-sm text-slate-500">score</span></div><div className="rounded-2xl bg-amber-50 p-4"><strong className="block text-2xl text-amber-700">+{totalXp} XP</strong><span className="text-sm text-slate-500">gagnés</span></div></div>
            <div className="mt-8 flex flex-wrap justify-center gap-3"><Button onClick={restart} variant="outline"><RotateCcw size={17} /> Recommencer</Button><Link className={buttonVariants()} href="/quiz">Choisir un autre quiz</Link></div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-enter mx-auto w-full max-w-4xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/quiz"><ArrowLeft size={17} /> Tous les quiz</Link>
      <div className="mb-4 flex items-center justify-between gap-4 text-sm font-semibold text-slate-600"><span>Question {index + 1} sur {quiz.questions.length}</span><span>{correctCount} bonne{correctCount > 1 ? "s" : ""} réponse{correctCount > 1 ? "s" : ""}</span></div>
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }} /></div>

      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl">
        <header className="bg-slate-950 px-6 py-7 text-white sm:px-9"><div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-teal-400/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-teal-300">{quiz.specialty.name}</span><span className="text-sm text-slate-400">Difficulté {question.difficulty}</span></div><h1 className="mb-0 mt-6 max-w-3xl !text-3xl !leading-tight !text-white sm:!text-4xl">{question.text}</h1></header>
        <div className="p-5 sm:p-9">
          <div className="grid gap-3" role="radiogroup" aria-label="Réponses proposées">
            {question.options.map((option, optionIndex) => {
              const selected = selectedId === option.id;
              const correct = feedback?.correctOptionId === option.id;
              const wrong = Boolean(feedback && selected && !feedback.isCorrect);
              return <button aria-checked={selected} className={cn("flex items-center gap-4 rounded-2xl border p-4 text-left transition", !feedback && selected ? "border-teal-500 bg-teal-50" : !feedback ? "border-slate-200 hover:border-teal-300 hover:bg-slate-50" : correct ? "border-emerald-300 bg-emerald-50" : wrong ? "border-rose-300 bg-rose-50" : "border-slate-100 bg-slate-50 text-slate-400")} disabled={Boolean(feedback) || pending} key={option.id} onClick={() => setSelectedId(option.id)} role="radio" type="button"><span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold", correct ? "bg-emerald-600 text-white" : wrong ? "bg-rose-600 text-white" : selected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600")}>{correct ? <CheckCircle2 size={18} /> : wrong ? <CircleX size={18} /> : String.fromCharCode(65 + optionIndex)}</span><span className="font-semibold">{option.text}</span></button>;
            })}
          </div>

          {feedback ? <section aria-live="polite" className={cn("mt-6 rounded-2xl border p-5", feedback.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}><div className="flex items-center gap-3">{feedback.isCorrect ? <CheckCircle2 className="text-emerald-700" /> : <RotateCcw className="text-amber-700" />}<strong>{feedback.isCorrect ? "Bonne réponse" : "À retenir"}</strong>{feedback.xpEarned > 0 && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-bold text-amber-700"><Star size={15} /> +{feedback.xpEarned} XP</span>}</div><p className="mb-0 mt-3 leading-7 text-slate-700">{feedback.explanation ?? "La correction a été enregistrée."}</p><div className="mt-5 flex justify-end"><Button onClick={nextQuestion}>{index === quiz.questions.length - 1 ? "Voir mon résultat" : "Question suivante"}<ArrowRight size={17} /></Button></div></section> : <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="m-0 text-sm text-slate-500">{question.xpReward} XP lors de la première bonne réponse</p><Button disabled={!selectedId || pending} onClick={submitAnswer}>{pending && <LoaderCircle className="animate-spin" size={18} />}{pending ? "Correction…" : "Valider ma réponse"}</Button></div>}
          {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
        </div>
      </section>
    </main>
  );
}
