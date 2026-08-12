"use server";

import { revalidatePath } from "next/cache";
import type { Difficulty, QuizMode } from "../../types/medtrain";
import { enforceRateLimit } from "../lib/rate-limit";
import { createAdminClient, createClient } from "../../lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const modes: QuizMode[] = ["daily", "specialty", "difficulty", "exam", "errors", "mixed"];
const difficulties: Difficulty[] = ["facile", "moyen", "difficile"];

export type StartQuizSessionInput = {
  mode: QuizMode;
  specialtyId?: string | null;
  difficulty?: Difficulty | null;
  questionCount?: number;
  timeLimitSeconds?: number | null;
};

export type QuizSessionActionResult = { success: boolean; sessionId?: string; error?: string };

async function authenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function startQuizSession(input: StartQuizSessionInput): Promise<QuizSessionActionResult> {
  const count = input.questionCount ?? 10;
  if (!modes.includes(input.mode) || !Number.isInteger(count) || count < 1 || count > 100
    || (input.specialtyId && !UUID_PATTERN.test(input.specialtyId))
    || (input.difficulty && !difficulties.includes(input.difficulty))
    || (input.timeLimitSeconds != null && (!Number.isInteger(input.timeLimitSeconds) || input.timeLimitSeconds < 60 || input.timeLimitSeconds > 10_800))) {
    return { success: false, error: "Configuration de quiz invalide" };
  }
  const user = await authenticatedUser();
  if (!user) return { success: false, error: "Non authentifié" };
  try {
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "quiz-session-start", 30, 3600);
    const { data, error } = await admin.rpc("start_quiz_session", {
      p_user_id: user.id, p_mode: input.mode, p_specialty_id: input.specialtyId ?? null,
      p_difficulty: input.difficulty ?? null, p_question_count: count,
      p_time_limit_seconds: input.timeLimitSeconds ?? null,
    });
    if (error) {
      if (error.message.includes("no questions available")) return { success: false, error: "Aucune question disponible pour ces critères" };
      throw error;
    }
    if (typeof data !== "string" || !UUID_PATTERN.test(data)) throw new Error("Invalid session id");
    return { success: true, sessionId: data };
  } catch (error) {
    console.error("MedTrain quiz session start error", error);
    return { success: false, error: "Impossible de démarrer le quiz" };
  }
}

type SessionAnswerRow = {
  answer_is_correct: boolean; answer_explanation: string | null; awarded_xp: number;
  total_xp: number; current_level: number; current_streak: number; reveal_feedback: boolean;
  session_completed: boolean; session_score: number;
};

export type SessionAnswerResult = {
  success: boolean; isCorrect?: boolean; explanation?: string | null; xpEarned?: number;
  totalXp?: number; level?: number; streak?: number; revealFeedback?: boolean;
  correctOptionId?: string; sessionCompleted?: boolean; sessionScore?: number; error?: string;
};

export async function answerQuizSessionQuestion(input: {
  sessionId: string; questionId: string; selectedOptionId: string; responseTimeMs?: number;
}): Promise<SessionAnswerResult> {
  if (![input.sessionId, input.questionId, input.selectedOptionId].every((value) => UUID_PATTERN.test(value))
    || (input.responseTimeMs != null && (!Number.isInteger(input.responseTimeMs) || input.responseTimeMs < 0 || input.responseTimeMs > 3_600_000))) {
    return { success: false, error: "Réponse invalide" };
  }
  const user = await authenticatedUser();
  if (!user) return { success: false, error: "Non authentifié" };
  try {
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "quiz-session-answer", 120, 60);
    const { data, error } = await admin.rpc("answer_quiz_session_question", {
      p_user_id: user.id, p_session_id: input.sessionId, p_question_id: input.questionId,
      p_selected_option_id: input.selectedOptionId, p_response_time_ms: input.responseTimeMs ?? null,
    });
    if (error) {
      if (error.message.includes("already answered")) return { success: false, error: "Cette question a déjà été validée" };
      if (error.message.includes("expired")) return { success: false, error: "Le temps du quiz est écoulé" };
      throw error;
    }
    const row = (Array.isArray(data) ? data[0] : data) as SessionAnswerRow | null;
    if (!row) return { success: false, error: "Correction indisponible" };
    let correctOptionId: string | undefined;
    if (row.reveal_feedback) {
      const { data: option } = await admin.from("question_options").select("id")
        .eq("question_id", input.questionId).eq("is_correct", true).limit(1).maybeSingle();
      correctOptionId = option?.id;
    }
    revalidatePath("/quiz", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/profil");
    return {
      success: true, isCorrect: row.reveal_feedback ? row.answer_is_correct : undefined,
      explanation: row.reveal_feedback ? row.answer_explanation : null,
      xpEarned: row.awarded_xp, totalXp: row.total_xp, level: row.current_level,
      streak: row.current_streak, revealFeedback: row.reveal_feedback, correctOptionId,
      sessionCompleted: row.session_completed, sessionScore: row.session_score,
    };
  } catch (error) {
    console.error("MedTrain quiz session answer error", error);
    return { success: false, error: "Impossible d’enregistrer la réponse" };
  }
}

export async function abandonQuizSession(sessionId: string): Promise<QuizSessionActionResult> {
  if (!UUID_PATTERN.test(sessionId)) return { success: false, error: "Session invalide" };
  const user = await authenticatedUser();
  if (!user) return { success: false, error: "Non authentifié" };
  const admin = createAdminClient();
  const { error } = await admin.from("quiz_sessions").update({ status: "abandoned", completed_at: new Date().toISOString() })
    .eq("id", sessionId).eq("user_id", user.id).eq("status", "active");
  if (error) {
    console.error("MedTrain quiz session abandon error", error);
    return { success: false, error: "Impossible de fermer la session" };
  }
  return { success: true, sessionId };
}
