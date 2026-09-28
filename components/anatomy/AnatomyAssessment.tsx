"use client";
import { useRef, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { AnatomyFeedback, PublicQuestion } from "@/lib/anatomy/types";

type Result = AnatomyFeedback & { saved: boolean; message?: string };
export function AnatomyAssessment({ slug, questions, mode }: { slug: string; questions: PublicQuestion[]; mode: "recall" | "clinical" }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef<string | null>(null);
  const locked = useRef(false);
  const summary = useRef<HTMLDivElement>(null);
  async function submit() {
    if (locked.current || questions.some((q) => !answers[q.id])) return;
    locked.current = true;
    setPending(true);
    setError(null);
    attempt.current ??= crypto.randomUUID();
    try {
      const response = await fetch(`/api/anatomy/${slug}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId: attempt.current, mode, answers: questions.map((q) => ({ id: q.id, optionId: answers[q.id] })) }), signal: AbortSignal.timeout(20_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Correction indisponible.");
      setResult(data as Result);
      requestAnimationFrame(() => summary.current?.focus());
    } catch (cause) { setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "Connexion interrompue. Tes réponses sont conservées ; réessaie."); }
    finally { locked.current = false; setPending(false); }
  }
  return <form className="anatomy-assessment" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
    {questions.map((question, index) => {
      const correction = result?.corrections.find((item) => item.id === question.id);
      return <fieldset key={question.id} disabled={pending || Boolean(result)}><legend><span>{String(index + 1).padStart(2, "0")}</span>{" "}{question.prompt}</legend><div className="anatomy-options">{question.options.map((option) => <label key={option.id} className={`${answers[question.id] === option.id ? "is-selected" : ""} ${correction?.correctId === option.id ? "is-correct" : ""}`}><input type="radio" name={`${mode}-${question.id}`} value={option.id} checked={answers[question.id] === option.id} onChange={() => { setAnswers((previous) => ({ ...previous, [question.id]: option.id })); attempt.current = null; }} /><span>{option.text}</span>{correction?.correctId === option.id && <CheckCircle2 size={18} aria-label="Bonne réponse" />}</label>)}</div>{correction && <p className={`anatomy-explanation ${correction.correct ? "is-correct" : ""}`}><strong>{correction.correct ? "Bien vu. " : "À retenir. "}</strong>{correction.explanation}</p>}</fieldset>;
    })}
    {error && <p role="alert" className="learning-notice">{error}</p>}
    {!result ? <div className="learning-assessment-actions"><p>{Object.keys(answers).length}/{questions.length} réponses</p><button className="button primary" disabled={pending || questions.some((q) => !answers[q.id])}>{pending ? "Correction en cours…" : "Corriger mes réponses"}</button></div> : <div className="anatomy-result" ref={summary} tabIndex={-1} role="status"><div><strong>{result.score}/{result.total} · {result.percent}%</strong><p>{result.saved ? "Résultat enregistré dans ton historique." : result.message}</p></div><div className="flex flex-wrap gap-2">{!result.saved && <button type="button" className="button secondary" disabled={pending} onClick={() => void submit()}>{pending ? "Sauvegarde…" : "Réessayer la sauvegarde"}</button>}<button type="button" className="button secondary" disabled={pending} onClick={() => { setAnswers({}); setResult(null); setError(null); attempt.current = null; }}><RotateCcw size={16} /> Refaire</button></div></div>}
  </form>;
}
