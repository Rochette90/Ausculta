import "server-only";

import { randomInt } from "node:crypto";
import { createAdminClient } from "../supabase/server";

export type DailyQuiz = {
  id: string;
  quizDate: string;
  question: {
    id: string;
    specialtyId: string | null;
    pathologyId: string | null;
    text: string;
    difficulty: "facile" | "moyen" | "difficile";
    xpReward: number;
    options: Array<{
      id: string;
      text: string;
      orderIndex: number;
    }>;
  };
};

export type DailyQuizAttemptReview = {
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string | null;
  xpEarned: number;
  completedAt: string;
};

type DailyQuizRow = { id: string; question_id: string; quiz_date: string };
type QuestionRow = {
  id: string;
  specialty_id: string | null;
  pathology_id: string | null;
  question_text: string;
  difficulty: "facile" | "moyen" | "difficile";
  xp_reward: number;
};
type OptionRow = { id: string; option_text: string; order_index: number };

export function zurichDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export async function getDailyQuizAttempt(
  userId: string,
  quiz: DailyQuiz,
): Promise<DailyQuizAttemptReview | null> {
  const admin = createAdminClient();
  const attemptResult = await admin
    .from("quiz_attempts")
    .select("selected_option_id, is_correct, xp_earned, completed_at")
    .eq("user_id", userId)
    .eq("question_id", quiz.question.id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (attemptResult.error) throw attemptResult.error;
  if (!attemptResult.data || zurichDate(new Date(attemptResult.data.completed_at)) !== quiz.quizDate) {
    return null;
  }

  const [questionResult, correctOptionResult] = await Promise.all([
    admin
      .from("questions")
      .select("explanation")
      .eq("id", quiz.question.id)
      .single(),
    admin
      .from("question_options")
      .select("id")
      .eq("question_id", quiz.question.id)
      .eq("is_correct", true)
      .single(),
  ]);
  if (questionResult.error) throw questionResult.error;
  if (correctOptionResult.error) throw correctOptionResult.error;

  return {
    selectedOptionId: attemptResult.data.selected_option_id,
    correctOptionId: correctOptionResult.data.id,
    isCorrect: attemptResult.data.is_correct === true,
    explanation: questionResult.data.explanation,
    xpEarned: attemptResult.data.xp_earned,
    completedAt: attemptResult.data.completed_at,
  };
}

export async function getDailyQuiz(): Promise<DailyQuiz> {
  const admin = createAdminClient();
  const today = zurichDate();

  const existing = await admin
    .from("daily_quizzes")
    .select("id, question_id, quiz_date")
    .eq("quiz_date", today)
    .maybeSingle();
  if (existing.error) throw existing.error;

  let daily = existing.data as DailyQuizRow | null;
  if (!daily) {
    const candidates = await admin
      .from("questions")
      .select("id")
      .eq("is_published", true);
    if (candidates.error) throw candidates.error;

    const questionIds = (candidates.data ?? []) as Array<{ id: string }>;
    if (questionIds.length === 0) throw new Error("Aucune question publiée disponible");

    const questionId = questionIds[randomInt(questionIds.length)].id;
    const inserted = await admin
      .from("daily_quizzes")
      .insert({ question_id: questionId, quiz_date: today })
      .select("id, question_id, quiz_date")
      .single();

    if (inserted.error?.code === "23505") {
      const concurrent = await admin
        .from("daily_quizzes")
        .select("id, question_id, quiz_date")
        .eq("quiz_date", today)
        .single();
      if (concurrent.error) throw concurrent.error;
      daily = concurrent.data as DailyQuizRow;
    } else if (inserted.error) {
      throw inserted.error;
    } else {
      daily = inserted.data as DailyQuizRow;
    }
  }

  const [questionResult, optionsResult] = await Promise.all([
    admin
      .from("questions")
      .select("id, specialty_id, pathology_id, question_text, difficulty, xp_reward")
      .eq("id", daily.question_id)
      .eq("is_published", true)
      .single(),
    admin
      .from("question_options")
      .select("id, option_text, order_index")
      .eq("question_id", daily.question_id)
      .order("order_index", { ascending: true }),
  ]);
  if (questionResult.error) throw questionResult.error;
  if (optionsResult.error) throw optionsResult.error;

  const question = questionResult.data as QuestionRow;
  const options = (optionsResult.data ?? []) as OptionRow[];
  if (options.length < 2) throw new Error("Options du quiz indisponibles");

  return {
    id: daily.id,
    quizDate: daily.quiz_date,
    question: {
      id: question.id,
      specialtyId: question.specialty_id,
      pathologyId: question.pathology_id,
      text: question.question_text,
      difficulty: question.difficulty,
      xpReward: question.xp_reward,
      options: options.map((option) => ({
        id: option.id,
        text: option.option_text,
        orderIndex: option.order_index,
      })),
    },
  };
}
