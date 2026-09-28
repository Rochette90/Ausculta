import "server-only";

import { createAdminClient } from "../supabase/server";

export type StudySessionProgress = {
  sessionSlug: string;
  stepId: string;
  completedAt: string;
};

export async function getStudySessionProgress(userId: string, sessionSlug?: string): Promise<StudySessionProgress[]> {
  const admin = createAdminClient();
  let query = admin
    .from("study_session_progress")
    .select("session_slug, step_id, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });
  if (sessionSlug) query = query.eq("session_slug", sessionSlug);
  const { data, error } = await query;

  // Le catalogue reste utilisable avant l'application de la migration.
  if (error?.code === "42P01" || error?.code === "PGRST205") return [];
  if (error) throw error;
  return (data ?? []).map((row) => ({
    sessionSlug: row.session_slug,
    stepId: row.step_id,
    completedAt: row.completed_at,
  }));
}
