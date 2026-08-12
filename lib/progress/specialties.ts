import "server-only";

import { createClient } from "../supabase/server";

export type SpecialtyProgress = {
  totalPathologies: number;
  completedPathologies: number;
  totalQuestions: number;
  successfulQuestions: number;
  progressPercentage: number;
  xpEarned: number;
};

type ProgressRow = {
  pathology_id: string | null;
  question_id: string | null;
  is_completed: boolean;
  is_correct: boolean | null;
  xp_earned: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getSpecialtyProgress(
  userId: string,
  specialtyId: string,
): Promise<SpecialtyProgress> {
  if (!UUID_PATTERN.test(userId) || !UUID_PATTERN.test(specialtyId)) {
    throw new Error("Identifiants de progression invalides");
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.id !== userId) {
    throw new Error("Non authentifié");
  }

  const [pathologiesResult, questionsResult] = await Promise.all([
    supabase
      .from("pathologies")
      .select("id")
      .eq("specialty_id", specialtyId)
      .eq("is_published", true),
    supabase
      .from("questions")
      .select("id")
      .eq("specialty_id", specialtyId)
      .eq("is_published", true),
  ]);
  if (pathologiesResult.error) throw pathologiesResult.error;
  if (questionsResult.error) throw questionsResult.error;

  const pathologyIds = ((pathologiesResult.data ?? []) as Array<{ id: string }>).map((row) => row.id);
  const questionIds = ((questionsResult.data ?? []) as Array<{ id: string }>).map((row) => row.id);
  const progressRows: ProgressRow[] = [];

  if (pathologyIds.length > 0) {
    const result = await supabase
      .from("user_progress")
      .select("pathology_id, question_id, is_completed, is_correct, xp_earned")
      .eq("user_id", userId)
      .in("pathology_id", pathologyIds);
    if (result.error) throw result.error;
    progressRows.push(...((result.data ?? []) as ProgressRow[]));
  }

  if (questionIds.length > 0) {
    const result = await supabase
      .from("user_progress")
      .select("pathology_id, question_id, is_completed, is_correct, xp_earned")
      .eq("user_id", userId)
      .in("question_id", questionIds);
    if (result.error) throw result.error;
    progressRows.push(...((result.data ?? []) as ProgressRow[]));
  }

  const completedPathologies = progressRows.filter(
    (row) => row.pathology_id !== null && row.is_completed,
  ).length;
  const successfulQuestions = progressRows.filter(
    (row) => row.question_id !== null && row.is_correct === true,
  ).length;
  const totalItems = pathologyIds.length + questionIds.length;
  const completedItems = completedPathologies + successfulQuestions;

  return {
    totalPathologies: pathologyIds.length,
    completedPathologies,
    totalQuestions: questionIds.length,
    successfulQuestions,
    progressPercentage: totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
    xpEarned: progressRows.reduce((total, row) => total + row.xp_earned, 0),
  };
}
