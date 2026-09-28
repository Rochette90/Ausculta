import { ApiError, apiJson, assertSameOrigin, handleApiError, readJsonObject, requireAuthenticatedUser } from "@/app/lib/api-security";
import { enforceRateLimit } from "@/app/lib/rate-limit";
import { getAnatomyModule } from "@/lib/anatomy/catalog";
import { gradeAnatomy } from "@/lib/anatomy/assessment";
import { createAdminClient } from "@/lib/supabase/server";
import { UUID_PATTERN } from "@/lib/validation";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const { slug } = await context.params;
    const lesson = getAnatomyModule(slug);
    if (!lesson) throw new ApiError(404, "module_not_found", "Module introuvable.");
    const body = await readJsonObject(request, 4_096);
    if (body.mode !== "recall" && body.mode !== "clinical") throw new ApiError(400, "invalid_mode", "Mode invalide.");
    if (typeof body.attemptId !== "string" || !UUID_PATTERN.test(body.attemptId)) throw new ApiError(400, "invalid_attempt", "Tentative invalide.");
    let result;
    try { result = gradeAnatomy(body.mode === "clinical" ? lesson.case.questions : lesson.questions, body.answers); }
    catch (error) { throw new ApiError(400, "invalid_answers", error instanceof Error ? error.message : "Réponses invalides."); }
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "anatomy-assessment", 30, 60);
    const answers = (body.answers as { id: string; optionId: string }[]).map(({ id, optionId }) => ({ id, optionId })).sort((a, b) => a.id.localeCompare(b.id));
    const payload = { user_id: user.id, attempt_id: body.attemptId, module_slug: slug, mode: body.mode, score: result.score, total: result.total, answers };
    const { error } = await admin.from("anatomy_attempts").upsert(payload, { onConflict: "user_id,attempt_id", ignoreDuplicates: true });
    if (error?.code === "42P01" || error?.code === "PGRST205") {
      return apiJson({ ...result, saved: false, message: "Correction disponible. La sauvegarde de l’anatomie n’est pas encore activée." });
    }
    if (error) throw error;
    const { data: stored, error: readError } = await admin.from("anatomy_attempts")
      .select("module_slug, mode, answers").eq("user_id", user.id).eq("attempt_id", body.attemptId).single();
    if (readError) throw readError;
    // JSONB key ordering is not stable; compare answer fields.
    const sameAnswers = Array.isArray(stored.answers) && stored.answers.length === answers.length && stored.answers.every((item: { id: string; optionId: string }, index: number) => item.id === answers[index].id && item.optionId === answers[index].optionId);
    if (stored.module_slug !== slug || stored.mode !== body.mode || !sameAnswers) throw new ApiError(409, "attempt_conflict", "Cette tentative a déjà été enregistrée. Recommence un nouvel essai.");
    return apiJson({ ...result, saved: true });
  } catch (error) { return handleApiError(error); }
}
