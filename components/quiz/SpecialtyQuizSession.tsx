/* eslint-disable @next/next/no-img-element -- images cliniques distantes (hébergées), dimensions inconnues : le composant Image de Next exige largeur et hauteur. */
"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { answerQuestion, type AnswerQuestionResult } from "@/app/actions/quiz";
import type { SpecialtyQuiz } from "@/lib/quiz/specialty";
import { cn } from "@/lib/utils";
import { SpecialtyIcon } from "@/components/content/SpecialtyIcon";
import { Button, buttonVariants } from "@/components/ui/button";
import { QuizAnswerList, QuizDifficultyBadge } from "./QuizPrimitives";
import { PROGRESS_EVENT_NAME } from "@/lib/brand";

type Feedback = Pick<AnswerQuestionResult, "isCorrect" | "explanation" | "xpEarned" | "correctOptionId">;

function resultCopy(percentage: number) {
  if (percentage >= 90) return { title: "Maîtrise excellente", description: "Tes décisions sont précises et régulières. Cette série peut passer en entretien espacé." };
  if (percentage >= 75) return { title: "Niveau solide", description: "Les acquis sont bien installés. Une courte révision des erreurs suffira à stabiliser la série." };
  if (percentage >= 50) return { title: "Base en progression", description: "Le raisonnement est présent, mais certains choix nécessitent encore une consolidation ciblée." };
  return { title: "Révision recommandée", description: "Reprends les explications clés, puis relance la série pour transformer les hésitations en automatismes." };
}

export function SpecialtyQuizSession({ quiz: initialQuiz }: { quiz: SpecialtyQuiz }) {
  // Une action serveur peut rafraîchir les props de la page. La session garde
  // son tirage initial afin de ne jamais afficher la correction d'une question
  // sous une autre question nouvellement mélangée.
  const [quiz] = useState(() => initialQuiz);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [answers, setAnswers] = useState<Array<{ isCorrect: boolean; xpEarned: number }>>([]);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (quiz.questions.length === 0) {
    return (
      <main className="page-enter mx-auto w-full max-w-4xl px-4 pb-28 pt-8 sm:px-6">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] no-underline hover:text-[var(--primary)]" href="/quiz"><ArrowLeft size={17} /> Tous les QCM</Link>
        <section className="mt-6 overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div className="h-2 bg-[linear-gradient(90deg,var(--primary),#5eead4)]" />
          <div className="px-6 py-12 text-center sm:px-12 sm:py-16">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-amber-500/20 bg-[var(--amber-light)] text-[var(--amber-dark)]"><Clock3 size={28} /></span>
            <p className="mb-2 mt-6 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--primary)]">Parcours en préparation</p>
            <h1 className="m-0 !text-[34px]">QCM {quiz.specialty.name}</h1>
            <p className="mx-auto mb-0 mt-4 max-w-lg leading-7 text-[var(--muted)]">Les premières questions sont en cours de validation. Cette spécialité apparaîtra automatiquement dès que son contenu sera publié.</p>
            <Link className={cn(buttonVariants(), "mt-7 no-underline")} href="/quiz">Choisir une autre spécialité</Link>
          </div>
        </section>
      </main>
    );
  }

  const question = quiz.questions[index];
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const totalXp = answers.reduce((total, answer) => total + answer.xpEarned, 0);
  const completedCount = answers.length;
  const accuracy = completedCount === 0 ? 0 : Math.round((correctCount / completedCount) * 100);
  const seriesProgress = Math.round(((index + (feedback ? 1 : 0)) / quiz.questions.length) * 100);

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
      window.dispatchEvent(new Event(PROGRESS_EVENT_NAME));
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
    const copy = resultCopy(percentage);
    const gaugeStyle = { background: `conic-gradient(var(--primary) ${percentage * 3.6}deg, var(--surface-subtle) 0deg)` };

    return (
      <main className="page-enter mx-auto w-full max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:pt-10">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] no-underline hover:text-[var(--primary)]" href="/quiz"><ArrowLeft size={17} /> Centre QCM</Link>
        <section className="mt-6 overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <header className="relative isolate overflow-hidden bg-[var(--surface-dark)] px-6 py-9 text-white sm:px-10 sm:py-11">
            <div aria-hidden className="absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div aria-hidden className="absolute -right-20 -top-24 -z-10 size-80 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-teal-200"><Trophy size={14} /> Quiz terminé</span>
                <h1 className="mb-0 mt-5 !text-[38px] !text-white sm:!text-[48px]">{copy.title}</h1>
                <p className="mb-0 mt-3 max-w-2xl leading-7 text-slate-300">{copy.description}</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 pr-5">
                <span className="grid size-11 place-items-center rounded-xl bg-teal-400/15 text-teal-300"><SpecialtyIcon name={quiz.specialty.icon} size={22} /></span>
                <div><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Spécialité</span><strong className="text-sm text-white">{quiz.specialty.name}</strong></div>
              </div>
            </div>
          </header>

          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[260px_minmax(0,1fr)] lg:p-10">
            <div className="mx-auto flex flex-col items-center lg:mx-0">
              <div className="grid size-48 place-items-center rounded-full p-3" style={gaugeStyle}>
                <div className="grid size-full place-items-center rounded-full bg-[var(--surface)] text-center shadow-[inset_0_0_0_1px_var(--line-subtle)]">
                  <div><strong className="block text-5xl tracking-tight text-[var(--ink)]">{percentage}%</strong><span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Score final</span></div>
                </div>
              </div>
              <p className="mb-0 mt-4 text-center text-sm font-semibold text-[var(--muted)]">{correctCount} bonnes réponses sur {quiz.questions.length}</p>
            </div>

            <div>
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted-light)]">Synthèse de la session</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-subtle)] p-4"><CheckCircle2 className="text-emerald-600" size={19} /><strong className="mt-3 block text-2xl">{correctCount}</strong><span className="text-xs font-semibold text-[var(--muted)]">Réponses justes</span></div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-subtle)] p-4"><CircleAlert className="text-rose-500" size={19} /><strong className="mt-3 block text-2xl">{quiz.questions.length - correctCount}</strong><span className="text-xs font-semibold text-[var(--muted)]">Points à revoir</span></div>
                <div className="rounded-2xl border border-amber-500/15 bg-[var(--amber-light)] p-4"><Star className="text-amber-600" size={19} /><strong className="mt-3 block text-2xl text-[var(--amber-dark)]">+{totalXp}</strong><span className="text-xs font-semibold text-[var(--muted)]">XP gagnés</span></div>
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-teal-500/15 bg-[var(--primary-subtle)] p-4">
                <BookOpenCheck className="mt-0.5 shrink-0 text-[var(--primary)]" size={19} />
                <p className="m-0 text-sm leading-6 text-[var(--ink-secondary)]">Conseil : reprenez uniquement les notions hésitantes, puis refaites cette série dans 24 à 48 heures pour vérifier la consolidation.</p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button onClick={restart} size="lg" variant="outline"><RotateCcw size={17} /> Refaire la série</Button>
                <Link className={cn(buttonVariants({ size: "lg" }), "no-underline")} href="/quiz">Choisir un autre QCM <ArrowRight size={17} /></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-enter mx-auto w-full max-w-[1240px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] no-underline transition-colors hover:text-[var(--primary)]" href="/quiz"><ArrowLeft size={16} /> Quitter la série</Link>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] shadow-[var(--shadow-sm)] sm:inline-flex"><Target size={14} className="text-[var(--primary)]" /> {accuracy}% de réussite</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--amber-light)] px-3 py-1.5 text-xs font-bold text-[var(--amber-dark)]"><Star size={13} /> {totalXp} XP</span>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)]"><SpecialtyIcon name={quiz.specialty.icon} size={20} /></span><div className="min-w-0"><p className="m-0 truncate text-sm font-bold">{quiz.specialty.name}</p><p className="m-0 text-xs text-[var(--muted)]">Question {index + 1} sur {quiz.questions.length}</p></div></div>
          <strong className="text-sm text-[var(--primary)]">{seriesProgress}%</strong>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-subtle)]"><div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300" style={{ width: `${seriesProgress}%` }} /></div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="sticky top-24 hidden overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] lg:block">
          <div className="bg-[var(--surface-dark)] p-5 text-white">
            <span className="grid size-11 place-items-center rounded-xl bg-teal-400/15 text-teal-300"><SpecialtyIcon name={quiz.specialty.icon} size={22} /></span>
            <p className="mb-1 mt-4 text-[10px] font-extrabold uppercase tracking-[0.15em] text-teal-300">Série clinique</p>
            <h2 className="m-0 !text-[21px] !text-white">{quiz.specialty.name}</h2>
            <p className="mb-0 mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{quiz.specialty.description ?? "Entraînement ciblé par spécialité."}</p>
          </div>

          <div className="p-5">
            <div className="flex items-end justify-between"><div><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-light)]">Progression</p><p className="mb-0 mt-1 text-sm font-bold">{completedCount} / {quiz.questions.length} terminées</p></div><strong className="text-lg text-[var(--primary)]">{seriesProgress}%</strong></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-subtle)]"><div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300" style={{ width: `${seriesProgress}%` }} /></div>

            <ol aria-label="Progression dans la série" className="mt-5 grid grid-cols-5 gap-2 border-y border-[var(--line-subtle)] py-5">
              {quiz.questions.map((item, itemIndex) => {
                const answer = answers[itemIndex];
                const current = itemIndex === index;
                return (
                  <li
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "grid aspect-square place-items-center rounded-lg border text-[11px] font-extrabold",
                      answer?.isCorrect && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      answer && !answer.isCorrect && "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                      !answer && current && "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_0_0_3px_var(--primary-glow)]",
                      !answer && !current && "border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--muted)]",
                    )}
                    key={item.id}
                  >
                    {answer ? (answer.isCorrect ? <Check size={14} strokeWidth={3} /> : <CircleAlert size={14} />) : itemIndex + 1}
                  </li>
                );
              })}
            </ol>

            <dl className="mt-5 grid gap-3">
              <div className="flex items-center justify-between text-xs"><dt className="flex items-center gap-2 text-[var(--muted)]"><CheckCircle2 size={15} className="text-emerald-600" /> Bonnes réponses</dt><dd className="m-0 font-extrabold">{correctCount}</dd></div>
              <div className="flex items-center justify-between text-xs"><dt className="flex items-center gap-2 text-[var(--muted)]"><Target size={15} className="text-[var(--primary)]" /> Précision</dt><dd className="m-0 font-extrabold">{accuracy}%</dd></div>
              <div className="flex items-center justify-between text-xs"><dt className="flex items-center gap-2 text-[var(--muted)]"><Star size={15} className="text-amber-500" /> XP cumulés</dt><dd className="m-0 font-extrabold">{totalXp}</dd></div>
            </dl>
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div aria-hidden className="flex h-1.5 gap-1 bg-[var(--surface-subtle)]">
            {quiz.questions.map((item, itemIndex) => {
              const answer = answers[itemIndex];
              return <span className={cn("h-full flex-1 transition-colors", answer ? (answer.isCorrect ? "bg-emerald-500" : "bg-rose-500") : itemIndex === index ? "bg-[var(--primary)]" : "bg-transparent")} key={item.id} />;
            })}
          </div>

          <header className="border-b border-[var(--line-subtle)] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-dark)] text-sm font-extrabold text-white">{String(index + 1).padStart(2, "0")}</span>
                <div><p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted-light)]">Question {index + 1} sur {quiz.questions.length}</p><p className="m-0 text-xs font-semibold text-[var(--muted)]">Une seule réponse attendue</p></div>
              </div>
              <QuizDifficultyBadge difficulty={question.difficulty} />
            </div>
            <h1 className="mb-0 mt-6 max-w-4xl !font-sans !text-[23px] !font-bold !leading-[1.38] !tracking-[-0.022em] sm:!text-[28px]">{question.text}</h1>
            {question.imageUrl && <img alt={question.imageAlt ?? ""} className="mt-5 max-h-96 w-full rounded-2xl border border-[var(--line-subtle)] object-contain" src={question.imageUrl} />}
          </header>

          <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
            <QuizAnswerList feedback={feedback} onSelect={setSelectedId} options={question.options} pending={pending} selectedId={selectedId} />

            {feedback ? (
              <section aria-live="polite" className={cn("mt-6 overflow-hidden rounded-2xl border", feedback.isCorrect ? "border-emerald-500/25 bg-emerald-500/8" : "border-amber-500/25 bg-amber-500/8")}>
                <div className="flex flex-wrap items-center gap-3 border-b border-current/10 px-5 py-4 sm:px-6">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-white", feedback.isCorrect ? "bg-emerald-600" : "bg-amber-600")}>{feedback.isCorrect ? <CheckCircle2 size={19} /> : <CircleAlert size={18} />}</span>
                  <div><p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">Raisonnement attendu</p><strong className={cn("text-[15px]", feedback.isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300")}>{feedback.isCorrect ? "Décision correcte" : "Point à consolider"}</strong></div>
                  {feedback.xpEarned > 0 && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1.5 text-sm font-bold text-[var(--amber-dark)] shadow-[var(--shadow-sm)]"><Star size={14} /> +{feedback.xpEarned} XP</span>}
                </div>
                <div className="px-5 py-5 sm:px-6">
                  <p className="m-0 leading-7 text-[var(--ink-secondary)]">{feedback.explanation ?? "La correction a été enregistrée."}</p>
                  <div className="mt-5 flex justify-end">
                    <Button className="w-full sm:w-auto" onClick={nextQuestion} size="lg">{index === quiz.questions.length - 1 ? "Voir le bilan" : "Question suivante"}<ArrowRight size={17} /></Button>
                  </div>
                </div>
              </section>
            ) : (
              <div className="mt-6 flex flex-col gap-4 border-t border-[var(--line-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 flex items-start gap-2 text-sm leading-6 text-[var(--muted)]"><Sparkles className="mt-1 shrink-0 text-amber-500" size={15} /> +{question.xpReward} XP à la première bonne réponse.</p>
                <Button className="w-full shrink-0 sm:w-auto" disabled={!selectedId || pending} onClick={submitAnswer} size="lg">{pending && <LoaderCircle className="animate-spin" size={18} />}{pending ? "Correction…" : "Valider ma réponse"}</Button>
              </div>
            )}
            {error && <p className="mt-4 rounded-xl border border-rose-500/20 bg-[var(--red-light)] p-3 text-sm font-semibold text-[var(--red-dark)]" role="alert">{error}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
