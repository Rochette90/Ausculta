import "server-only";

import type { Difficulty, QuizMode, QuizSessionStatus } from "../../types/medtrain";
import { createAdminClient } from "../supabase/server";

export type QuizSessionQuestion = {
  id: string;
  text: string;
  vignette: string | null;
  difficulty: Difficulty;
  xpReward: number;
  position: number;
  options: Array<{ id: string; text: string; orderIndex: number }>;
};

export type QuizSessionDetails = {
  id: string;
  mode: QuizMode;
  status: QuizSessionStatus;
  specialtyId: string | null;
  difficulty: Difficulty | null;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  scorePercent: number | null;
  timeLimitSeconds: number | null;
  startedAt: string;
  completedAt: string | null;
  questions: QuizSessionQuestion[];
  answeredQuestionIds: string[];
};

type SessionRow = {
  id: string; user_id: string; mode: QuizMode; status: QuizSessionStatus;
  specialty_id: string | null; difficulty: Difficulty | null; question_count: number;
  answered_count: number; correct_count: number; score_percent: number | null;
  time_limit_seconds: number | null; started_at: string; completed_at: string | null;
};
type SessionQuestionRow = { question_id: string; position: number };
type QuestionRow = { id: string; question_text: string; clinical_vignette: string | null; difficulty: Difficulty; xp_reward: number };
type OptionRow = { id: string; question_id: string; option_text: string; order_index: number };

export async function getQuizSession(userId: string, sessionId: string): Promise<QuizSessionDetails | null> {
  const admin = createAdminClient();
  const sessionResult = await admin.from("quiz_sessions")
    .select("id, user_id, mode, status, specialty_id, difficulty, question_count, answered_count, correct_count, score_percent, time_limit_seconds, started_at, completed_at")
    .eq("id", sessionId).eq("user_id", userId).maybeSingle();
  if (sessionResult.error) throw sessionResult.error;
  if (!sessionResult.data) return null;
  const session = sessionResult.data as SessionRow;

  const [linksResult, answersResult] = await Promise.all([
    admin.from("quiz_session_questions").select("question_id, position").eq("session_id", sessionId).order("position"),
    admin.from("quiz_session_answers").select("question_id").eq("session_id", sessionId),
  ]);
  if (linksResult.error) throw linksResult.error;
  if (answersResult.error) throw answersResult.error;
  const links = (linksResult.data ?? []) as SessionQuestionRow[];
  const questionIds = links.map((link) => link.question_id);
  if (questionIds.length === 0) return { ...mapSession(session), questions: [], answeredQuestionIds: [] };

  const [questionsResult, optionsResult] = await Promise.all([
    admin.from("questions").select("id, question_text, clinical_vignette, difficulty, xp_reward").in("id", questionIds),
    admin.from("question_options").select("id, question_id, option_text, order_index").in("question_id", questionIds).order("order_index"),
  ]);
  if (questionsResult.error) throw questionsResult.error;
  if (optionsResult.error) throw optionsResult.error;
  const questions = new Map(((questionsResult.data ?? []) as QuestionRow[]).map((question) => [question.id, question]));
  const options = (optionsResult.data ?? []) as OptionRow[];

  return {
    ...mapSession(session),
    answeredQuestionIds: (answersResult.data ?? []).flatMap((answer) => answer.question_id ? [answer.question_id] : []),
    questions: links.flatMap((link): QuizSessionQuestion[] => {
      const question = questions.get(link.question_id);
      if (!question) return [];
      return [{
        id: question.id, text: question.question_text, vignette: question.clinical_vignette,
        difficulty: question.difficulty, xpReward: question.xp_reward, position: link.position,
        options: options.filter((option) => option.question_id === question.id).map((option) => ({
          id: option.id, text: option.option_text, orderIndex: option.order_index,
        })),
      }];
    }),
  };
}

function mapSession(session: SessionRow): Omit<QuizSessionDetails, "questions" | "answeredQuestionIds"> {
  return {
    id: session.id, mode: session.mode, status: session.status, specialtyId: session.specialty_id,
    difficulty: session.difficulty, questionCount: session.question_count, answeredCount: session.answered_count,
    correctCount: session.correct_count, scorePercent: session.score_percent,
    timeLimitSeconds: session.time_limit_seconds, startedAt: session.started_at, completedAt: session.completed_at,
  };
}

export async function getReviewQueueSummary(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("user_question_stats")
    .select("question_id, next_review_at").eq("user_id", userId).eq("needs_review", true);
  if (error) throw error;
  const now = Date.now();
  const rows = data ?? [];
  return {
    total: rows.length,
    dueNow: rows.filter((row) => !row.next_review_at || new Date(row.next_review_at).getTime() <= now).length,
  };
}
