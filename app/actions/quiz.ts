"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "../lib/api-security";
import { enforceRateLimit } from "../lib/rate-limit";
import { createAdminClient, createClient } from "../../lib/supabase/server";

export type AnswerQuestionParams = {
  questionId: string;
  selectedOptionId: string;
  isDailyQuiz?: boolean;
};

export type AnswerQuestionResult = {
  success: boolean;
  isCorrect: boolean;
  explanation: string | null;
  xpEarned: number;
  newTotalXp?: number;
  newLevel?: number;
  newStreak?: number;
  correctOptionId?: string;
  error?: string;
};

type AnswerQuestionRow = {
  answer_is_correct: boolean;
  answer_explanation: string | null;
  awarded_xp: number;
  total_xp: number;
  current_level: number;
  current_streak: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failure(error: string): AnswerQuestionResult {
  return {
    success: false,
    isCorrect: false,
    explanation: null,
    xpEarned: 0,
    error,
  };
}

export async function answerQuestion({
  questionId,
  selectedOptionId,
  isDailyQuiz = false,
}: AnswerQuestionParams): Promise<AnswerQuestionResult> {
  if (!UUID_PATTERN.test(questionId) || !UUID_PATTERN.test(selectedOptionId)) {
    return failure("Réponse invalide");
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return failure("Non authentifié");

    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "quiz-answer", 60, 60);

    const { data, error } = await admin.rpc("answer_question", {
      p_user_id: user.id,
      p_question_id: questionId,
      p_selected_option_id: selectedOptionId,
      p_is_daily_quiz: isDailyQuiz,
    });

    if (error) {
      if (error.message.includes("question not found")) {
        return failure("Question introuvable");
      }
      if (error.message.includes("option not found")) {
        return failure("Option invalide");
      }
      if (error.message.includes("daily question mismatch")) {
        return failure("Cette question ne fait pas partie du quiz du jour");
      }
      console.error("MedTrain answerQuestion RPC error", error);
      return failure("Erreur lors de l’enregistrement");
    }

    const row = (Array.isArray(data) ? data[0] : data) as AnswerQuestionRow | null;
    if (!row) return failure("Réponse indisponible");

    const { data: correctOption, error: correctOptionError } = await admin
      .from("question_options")
      .select("id")
      .eq("question_id", questionId)
      .eq("is_correct", true)
      .single();
    if (correctOptionError) {
      console.error("MedTrain answerQuestion correct option error", correctOptionError);
      return failure("Correction indisponible");
    }

    revalidatePath("/dashboard");
    revalidatePath("/quiz");
    revalidatePath("/quiz", "layout");
    revalidatePath("/profil");

    return {
      success: true,
      isCorrect: row.answer_is_correct,
      explanation: row.answer_explanation,
      xpEarned: row.awarded_xp,
      newTotalXp: row.total_xp,
      newLevel: row.current_level,
      newStreak: row.current_streak,
      correctOptionId: correctOption.id,
    };
  } catch (error) {
    if (error instanceof ApiError) return failure(error.message);
    console.error("MedTrain answerQuestion error", error);
    return failure("Service momentanément indisponible");
  }
}

export async function answerDailyQuestion(
  params: Omit<AnswerQuestionParams, "isDailyQuiz">,
): Promise<AnswerQuestionResult> {
  return answerQuestion({ ...params, isDailyQuiz: true });
}
