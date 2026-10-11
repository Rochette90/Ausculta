"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { FEATURES } from "@/lib/features";
import { getStudySession } from "@/lib/study-sessions/catalog";
import { createAdminClient } from "@/lib/supabase/server";

export type StudySessionActionResult = { ok: true } | { ok: false; message: string };

export async function setStudySessionStepCompletion(
  sessionSlug: string,
  stepId: string,
  completed: boolean,
): Promise<StudySessionActionResult> {
  if (!FEATURES.sessions) return { ok: false, message: "Module indisponible." };
  const user = await requireUser(`/sessions/${encodeURIComponent(sessionSlug)}`);
  const session = getStudySession(sessionSlug);
  const stepIndex = session?.steps.findIndex((step) => step.id === stepId) ?? -1;
  if (!session || stepIndex < 0) return { ok: false, message: "Étape de session invalide." };

  const admin = createAdminClient();
  if (completed) {
    const requiredStepIds = session.steps.slice(0, stepIndex).map((step) => step.id);
    if (requiredStepIds.length > 0) {
      const { data: prerequisites, error: prerequisiteError } = await admin
        .from("study_session_progress")
        .select("step_id")
        .eq("user_id", user.id)
        .eq("session_slug", session.slug)
        .in("step_id", requiredStepIds);
      if (prerequisiteError) return { ok: false, message: "La progression n'a pas pu être vérifiée." };
      if (new Set((prerequisites ?? []).map((row) => row.step_id)).size !== requiredStepIds.length) {
        return { ok: false, message: "Terminez les étapes précédentes avant de valider celle-ci." };
      }
    }
    const { error } = await admin.from("study_session_progress").upsert({
      user_id: user.id,
      session_slug: session.slug,
      step_id: stepId,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,session_slug,step_id" });
    if (error) return { ok: false, message: "La progression n'a pas pu être enregistrée." };
  } else {
    const stepIdsToReset = session.steps.slice(stepIndex).map((step) => step.id);
    const { error } = await admin
      .from("study_session_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("session_slug", session.slug)
      .in("step_id", stepIdsToReset);
    if (error) return { ok: false, message: "La progression n'a pas pu être mise à jour." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/sessions");
  revalidatePath(`/sessions/${session.slug}`);
  return { ok: true };
}
