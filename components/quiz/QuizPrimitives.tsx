"use client";

import { Check, CheckCircle2, CircleX } from "lucide-react";
import type { Difficulty } from "../../types/content";
import { cn } from "../../lib/utils";

type QuizOption = {
  id: string;
  text: string;
};

type OptionFeedback = {
  isCorrect: boolean;
  correctOptionId?: string;
} | null;

const DIFFICULTY_STYLES: Record<Difficulty, { dot: string; label: string; className: string }> = {
  facile: {
    dot: "bg-emerald-500",
    label: "Fondamental",
    className: "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300",
  },
  moyen: {
    dot: "bg-amber-500",
    label: "Intermédiaire",
    className: "border-amber-500/20 bg-amber-500/8 text-amber-700 dark:text-amber-300",
  },
  difficile: {
    dot: "bg-rose-500",
    label: "Avancé",
    className: "border-rose-500/20 bg-rose-500/8 text-rose-700 dark:text-rose-300",
  },
};

export function QuizDifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const style = DIFFICULTY_STYLES[difficulty];
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em]", style.className)}>
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}

export function QuizAnswerList({
  options,
  selectedId,
  feedback,
  pending,
  onSelect,
}: {
  options: QuizOption[];
  selectedId: string | null;
  feedback: OptionFeedback;
  pending: boolean;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div aria-label="Réponses proposées" className="grid gap-3" role="radiogroup">
      {options.map((option, index) => {
        const selected = selectedId === option.id;
        const correct = feedback?.correctOptionId === option.id;
        const wrong = Boolean(feedback && selected && !feedback.isCorrect);
        const inactiveAfterCorrection = Boolean(feedback && !correct && !wrong);

        return (
          <button
            aria-checked={selected}
            className={cn(
              "group grid min-h-[68px] w-full grid-cols-[42px_minmax(0,1fr)_24px] items-center gap-3 rounded-2xl border px-3.5 py-3 text-left outline-none transition-[border-color,background-color,box-shadow,transform,opacity] duration-200 sm:min-h-[74px] sm:grid-cols-[46px_minmax(0,1fr)_28px] sm:gap-4 sm:px-4",
              !feedback && !selected && "border-[var(--line)] bg-[var(--surface)] hover:-translate-y-0.5 hover:border-teal-500/50 hover:bg-[var(--surface-subtle)] hover:shadow-[var(--shadow-sm)]",
              !feedback && selected && "border-[var(--primary)] bg-[var(--primary-subtle)] shadow-[0_0_0_3px_var(--primary-glow)]",
              feedback && correct && "border-emerald-500/50 bg-emerald-500/10",
              feedback && wrong && "border-rose-500/45 bg-rose-500/10",
              inactiveAfterCorrection && "border-[var(--line-subtle)] bg-[var(--surface-subtle)] opacity-55",
              "focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-default",
            )}
            disabled={Boolean(feedback) || pending}
            key={option.id}
            onClick={() => onSelect(option.id)}
            role="radio"
            type="button"
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-xl border text-sm font-extrabold transition-colors sm:size-11",
                !selected && !correct && !wrong && "border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--muted)] group-hover:border-teal-500/30 group-hover:text-[var(--primary)]",
                selected && !feedback && "border-[var(--primary)] bg-[var(--primary)] text-white",
                correct && "border-emerald-600 bg-emerald-600 text-white",
                wrong && "border-rose-600 bg-rose-600 text-white",
              )}
            >
              {correct ? <Check aria-hidden size={18} strokeWidth={3} /> : String.fromCharCode(65 + index)}
            </span>
            <span className="text-[14px] font-semibold leading-6 text-[var(--ink)] sm:text-[15px]">{option.text}</span>
            <span className="grid size-6 place-items-center">
              {feedback && correct && <CheckCircle2 aria-hidden className="text-emerald-600" size={21} />}
              {feedback && wrong && <CircleX aria-hidden className="text-rose-600" size={21} />}
              {!feedback && selected && <span aria-hidden className="size-2.5 rounded-full bg-[var(--primary)]" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
