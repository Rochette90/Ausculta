import type { AnatomyFeedback, AnatomyModule, AnatomyQuestion, PublicAnatomyModule } from "./types.ts";

export type AnatomyAnswer = { id: string; optionId: string };
export function publicAnatomyModule(module: AnatomyModule): PublicAnatomyModule {
  const publicQuestion = ({ id, prompt, options }: AnatomyQuestion) => ({ id, prompt, options });
  return { ...module, questions: module.questions.map(publicQuestion), case: { ...module.case, questions: module.case.questions.map(publicQuestion) } };
}

/** Reject partial, duplicate and foreign answers before any persistent write. */
export function gradeAnatomy(questions: AnatomyQuestion[], input: unknown): AnatomyFeedback {
  if (!Array.isArray(input) || input.length !== questions.length) throw new Error("Réponds à toutes les questions.");
  const answers = new Map<string, string>();
  for (const answer of input) {
    if (!answer || typeof answer !== "object" || typeof answer.id !== "string" || typeof answer.optionId !== "string" || answers.has(answer.id)) throw new Error("Réponses invalides.");
    const question = questions.find((question) => question.id === answer.id);
    if (!question?.options.some((option) => option.id === answer.optionId)) throw new Error("Réponse inconnue.");
    answers.set(answer.id, answer.optionId);
  }
  const corrections = questions.map((question) => ({ id: question.id, correctId: question.correctId, explanation: question.explanation, correct: answers.get(question.id) === question.correctId }));
  const score = corrections.filter((item) => item.correct).length;
  return { score, total: questions.length, percent: Math.round(score / questions.length * 100), corrections };
}

export { normalizeSearch } from "../text.ts";
