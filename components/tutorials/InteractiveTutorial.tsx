"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleAlert, Clock3, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export type TutorialStep = {
  label: string;
  title: string;
  duration: string;
  objective: string;
  checklist: string[];
  sections: Array<{ title: string; points: string[] }>;
  pearl?: string;
  alert?: string;
};

export type TutorialQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

async function recordTutorialCompletion(slug: string, answers: number[]) {
  try {
    const response = await fetch("/api/progress", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ activityType: "tutorial", activityId: slug, answers }),
      signal: AbortSignal.timeout(15_000),
    });
    return response.ok ? "saved" : response.status === 401 ? "guest" : "failed";
  } catch { return "failed"; }
}

export function InteractiveTutorial({
  accent,
  slug,
  steps,
  questions,
}: {
  accent: string;
  slug: string;
  steps: TutorialStep[];
  questions: TutorialQuestion[];
}) {
  const [current, setCurrent] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showQuiz, setShowQuiz] = useState(false);
  // Simple garde anti-double-appel : ne déclenche aucun rendu, donc pas de
  // setState dans l'effet de persistance ci-dessous.
  const recordedRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const step = steps[current];
  const completedChecks = Object.values(checked).filter(Boolean).length;
  const totalChecks = steps.reduce((sum, item) => sum + item.checklist.length, 0);
  const progress = Math.round(((current + (showQuiz ? 1 : 0)) / steps.length) * 100);
  const quizScore = useMemo(
    () => questions.reduce((score, question, index) => score + (answers[index] === question.answer ? 1 : 0), 0),
    [answers, questions],
  );

  function selectStep(index: number) {
    setCurrent(index);
    setShowQuiz(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setCurrent(0);
    setChecked({});
    setAnswers({});
    setShowQuiz(false);
    recordedRef.current = false;
    setSaveStatus("idle");
  }

  const quizComplete = Object.keys(answers).length === questions.length && questions.length > 0;

  useEffect(() => {
    if (!quizComplete || recordedRef.current) return;
    recordedRef.current = true;
    let active = true;
    void recordTutorialCompletion(slug, questions.map((_, index) => answers[index])).then((status) => { if (active) setSaveStatus(status); });
    return () => { active = false; };
  }, [quizComplete, slug, questions, answers]);

  return (
    <div className="mx-auto grid w-[calc(100%-2rem)] max-w-[1180px] gap-8 py-10 sm:py-14 lg:grid-cols-[270px_1fr] lg:items-start">
      <aside className="min-w-0 max-w-full overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] lg:sticky lg:top-24">
        <div className="mb-5 rounded-2xl bg-[var(--surface-subtle)] p-4">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)]"><span>Progression</span><span>{progress}%</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="mb-0 mt-3 text-xs leading-5 text-[var(--muted)]">{completedChecks}/{totalChecks} contrôles validés</p>
        </div>
        <nav className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1 lg:grid lg:gap-1 lg:overflow-visible lg:pb-0" aria-label="Étapes du tutoriel">
          {steps.map((item, index) => (
            <button
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${!showQuiz && current === index ? "bg-[var(--primary)] font-bold text-white" : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"}`}
              key={item.label}
              onClick={() => selectStep(index)}
              type="button"
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${!showQuiz && current === index ? "bg-white/15" : "bg-[var(--surface-subtle)] text-[var(--primary)]"}`}>{index + 1}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition lg:mt-1 ${showQuiz ? "bg-[var(--primary)] font-bold text-white" : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"}`} onClick={() => setShowQuiz(true)} type="button">
            <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${showQuiz ? "bg-white/15" : "bg-[var(--surface-subtle)] text-[var(--primary)]"}`}><Sparkles size={14} /></span>
            Auto-évaluation
          </button>
        </nav>
      </aside>

      <section className="min-w-0 max-w-full">
        {!showQuiz ? (
          <article className="overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
            <header className="border-b border-[var(--line)] p-6 sm:p-9" style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 72%, #062c3a))` }}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-[.12em] text-white/75"><span>Étape {current + 1} sur {steps.length}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {step.duration}</span></div>
              <h2 className="mb-0 mt-5 text-balance text-3xl !text-white sm:text-5xl">{step.title}</h2>
              <p className="mb-0 mt-4 max-w-2xl text-base leading-7 text-white/80">{step.objective}</p>
            </header>

            <div className="grid gap-8 p-6 sm:p-9">
              <div className="grid gap-5 md:grid-cols-2">
                {step.sections.map((section) => (
                  <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-subtle)] p-5" key={section.title}>
                    <h3 className="mb-0 text-lg">{section.title}</h3>
                    <ul className="mb-0 mt-4 grid gap-3 pl-0 text-sm leading-6 text-[var(--muted)]">
                      {section.points.map((point) => <li className="flex gap-2.5" key={point}><CheckCircle2 className="mt-1 shrink-0 text-[var(--primary)]" size={16} /><span>{point}</span></li>)}
                    </ul>
                  </section>
                ))}
              </div>

              <section className="rounded-2xl border border-[var(--line)] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3"><div><p className="eyebrow mb-1">CHECK-LIST ACTIVE</p><h3 className="mb-0 text-xl">Validez vos réflexes</h3></div><span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs font-bold text-[var(--muted)]">{step.checklist.filter((_, index) => checked[`${current}-${index}`]).length}/{step.checklist.length}</span></div>
                <div className="mt-5 grid gap-2">
                  {step.checklist.map((item, index) => {
                    const key = `${current}-${index}`;
                    const active = Boolean(checked[key]);
                    return <button className={`flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm leading-6 transition ${active ? "border-[var(--primary)] bg-[var(--mint-light)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--primary)]"}`} key={item} onClick={() => setChecked((state) => ({ ...state, [key]: !state[key] }))} type="button"><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${active ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--line-strong)]"}`}>{active && <Check size={13} />}</span><span>{item}</span></button>;
                  })}
                </div>
              </section>

              {step.pearl && <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-sm leading-6 text-teal-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-100"><strong className="mb-1 flex items-center gap-2"><Sparkles size={16} /> Perle pratique</strong>{step.pearl}</div>}
              {step.alert && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><strong className="mb-1 flex items-center gap-2"><CircleAlert size={16} /> Point de sécurité</strong>{step.alert}</div>}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--surface-subtle)] p-5 sm:px-9">
              <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 font-bold text-[var(--ink)] disabled:opacity-40" disabled={current === 0} onClick={() => selectStep(current - 1)} type="button"><ArrowLeft size={16} /> Précédent</button>
              {current < steps.length - 1 ? <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 font-bold text-white" onClick={() => selectStep(current + 1)} type="button">Étape suivante <ArrowRight size={16} /></button> : <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 font-bold text-white" onClick={() => setShowQuiz(true)} type="button">Tester mes acquis <Sparkles size={16} /></button>}
            </footer>
          </article>
        ) : (
          <article className="rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)] sm:p-9">
            <p className="eyebrow">AUTO-ÉVALUATION</p><h2 className="mb-0 mt-2 text-balance text-3xl sm:text-5xl">Trois questions pour fixer la méthode.</h2><p className="mb-0 mt-4 max-w-2xl leading-7 text-[var(--muted)]">Répondez, puis lisez immédiatement l&apos;explication. Si vous êtes connecté·e, ce résultat est ajouté à votre progression {BRAND_NAME}.</p>
            <div className="mt-9 grid gap-6">
              {questions.map((question, questionIndex) => {
                const selected = answers[questionIndex];
                return <section className="rounded-2xl border border-[var(--line)] p-5 sm:p-6" key={question.question}><div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-subtle)] text-sm font-extrabold text-[var(--primary)]">{questionIndex + 1}</span><h3 className="mb-0 pt-1 text-lg leading-7">{question.question}</h3></div><div className="mt-5 grid gap-2">{question.options.map((option, optionIndex) => { const isSelected = selected === optionIndex; const isCorrect = selected !== undefined && optionIndex === question.answer; return <button className={`rounded-xl border p-3.5 text-left text-sm transition ${isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/25 dark:text-emerald-100" : isSelected ? "border-red-400 bg-red-50 text-red-950 dark:bg-red-950/25 dark:text-red-100" : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--primary)]"}`} disabled={selected !== undefined} key={option} onClick={() => setAnswers((state) => ({ ...state, [questionIndex]: optionIndex }))} type="button">{option}</button>; })}</div>{selected !== undefined && <p className="mb-0 mt-4 rounded-xl bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--ink)]">{selected === question.answer ? "Correct. " : "À reprendre. "}</strong>{question.explanation}</p>}</section>;
              })}
            </div>
            {quizComplete && <p role="status" className="learning-notice">{saveStatus === "saved" ? "Résultat enregistré." : saveStatus === "guest" ? "Connecte-toi pour enregistrer tes prochains résultats." : saveStatus === "failed" ? "Résultat affiché localement. La sauvegarde a échoué." : "Enregistrement du résultat…"}{saveStatus === "failed" && <button type="button" className="button secondary ml-3" onClick={() => { setSaveStatus("idle"); void recordTutorialCompletion(slug, questions.map((_, index) => answers[index])).then(setSaveStatus); }}>Réessayer</button>}</p>}
            {quizComplete && <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--surface-dark)] p-6 text-white"><div><span className="text-xs font-extrabold uppercase tracking-[.12em] text-teal-300">Résultat</span><strong className="mt-1 block font-serif text-3xl">{quizScore}/{questions.length}</strong></div><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 font-bold text-slate-950" onClick={reset} type="button"><RotateCcw size={16} /> Recommencer</button></div>}
          </article>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]"><Link className="inline-flex items-center gap-2 font-bold text-[var(--primary)] no-underline" href="/tutoriels"><ArrowLeft size={15} /> Tous les tutoriels</Link><span>Support pédagogique · ne remplace pas une supervision clinique</span></div>
      </section>
    </div>
  );
}
