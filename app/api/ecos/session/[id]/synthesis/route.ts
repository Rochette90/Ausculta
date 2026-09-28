import { UUID_PATTERN } from "@/lib/validation";
import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  requireAuthenticatedUser,
} from "../../../../../lib/api-security";
import { enforceRateLimit } from "../../../../../lib/rate-limit";
import { diagnosisOptions } from "@/lib/ecos/grading";
import { synthesisStarted } from "@/lib/ecos/sessions";
import { getEcosScenario } from "@/lib/ecos/stations";
import { SYNTHESIS_MARKER } from "@/lib/ecos/text";
import { createAdminClient } from "../../../../../../lib/supabase/server";

/**
 * Opens the final phase. The four diagnosis options are only sent now (never
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
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "ecos-synthesis", 30, 60);
    const { data: session, error } = await admin
      .from("ecos_sessions")
      .select("station_slug, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!session) throw new ApiError(404, "session_not_found", "Session introuvable");
    const scenario = getEcosScenario(String(session.station_slug));
    if (!scenario) throw new ApiError(409, "unsupported_station", "Scénario non disponible.");

    if (session.status === "active" && !(await synthesisStarted(admin, id, user.id))) {
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
