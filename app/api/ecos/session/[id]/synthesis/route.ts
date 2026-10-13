import { UUID_PATTERN } from "@/lib/validation";
import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  readJsonObject,
  requireAuthenticatedUser,
} from "@/app/lib/api-security";
import { enforceRateLimit } from "@/app/lib/rate-limit";
import { diagnosisOptions, hasAnalysisStep } from "@/lib/ecos/grading";
import { MAX_ANALYSIS_LENGTH, recordAnalysis, synthesisStarted } from "@/lib/ecos/sessions";
import { getEcosScenario } from "@/lib/ecos/stations";
import { SYNTHESIS_MARKER } from "@/lib/ecos/text";
import { sessionDeadline } from "@/lib/ecos/timing";
import { createAdminClient } from "@/lib/supabase/server";

/** Analyse écrite des examens, envoyée en ouvrant la synthèse (facultative). */
async function readAnalysis(request: Request): Promise<string> {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return "";
  const body = await readJsonObject(request, 8_192);
  const analysis = typeof body.analysis === "string" ? body.analysis.trim() : "";
  if (analysis.length > MAX_ANALYSIS_LENGTH) throw new ApiError(400, "invalid_analysis", "Analyse trop longue");
  return analysis;
}

/**
 * Opens the final phase. The written analysis of the tests, if any, is
 * recorded first: it must be written before the options are known. The four diagnosis options are only sent now (never
 * with the station page) and without marking the answer; from this point the
 * server refuses further history questions and gestures.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const { id } = await context.params;
    if (!UUID_PATTERN.test(id)) throw new ApiError(400, "invalid_session", "Session invalide");
    const analysis = await readAnalysis(request);
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "ecos-synthesis", 30, 60);
    const { data: session, error } = await admin
      .from("ecos_sessions")
      .select("station_slug, status, started_at, mode")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!session) throw new ApiError(404, "session_not_found", "Session introuvable");
    const scenario = getEcosScenario(String(session.station_slug));
    if (!scenario) throw new ApiError(409, "unsupported_station", "Scénario non disponible.");

    if (session.status === "active" && !(await synthesisStarted(admin, id, user.id))) {
      if (analysis && hasAnalysisStep(scenario) && Date.now() <= sessionDeadline(session.mode, session.started_at)) {
        await recordAnalysis(admin, id, user.id, analysis);
      }
      const { error: markerError } = await admin.rpc("append_ecos_message", {
        p_user_id: user.id,
        p_session_id: id,
        p_role: "system",
        p_content: SYNTHESIS_MARKER,
      });
      if (markerError) throw markerError;
    }
    return apiJson({ options: diagnosisOptions(scenario, id) });
  } catch (error) {
    return handleApiError(error);
  }
}
