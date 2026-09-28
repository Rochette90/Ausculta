import {
  ApiError,
  readJsonObject,
  apiJson,
  assertSameOrigin,
  handleApiError,
  requireAuthenticatedUser,
} from "../../../lib/api-security";
import { enforceRateLimit } from "../../../lib/rate-limit";
import { createAdminClient } from "../../../../lib/supabase/server";

import { getPublishedClinicalCase } from "@/lib/ecos/cases";
import { resolveEcosStation } from "@/lib/ecos/stations";
import { parseEcosMode } from "@/lib/ecos/timing";
import { EXAM_CRITERION_ID } from "@/lib/ecos/grading";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const body = await readJsonObject(request, 1_024);
    // Code public (`station-04`) ; l'ancien champ `stationSlug` reste accepté.
    const identifier = typeof body.station === "string" ? body.station : typeof body.stationSlug === "string" ? body.stationSlug : "";
    const scenario = resolveEcosStation(identifier)?.scenario;
    if (!scenario) throw new ApiError(400, "unsupported_station", "Cette station n’est pas encore disponible.");
    const clinicalCase = await getPublishedClinicalCase(scenario.slug);
    if (!clinicalCase) throw new ApiError(404, "station_unavailable", "Station indisponible.");
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "ecos-session", 10, 60);

    const { data: sessionId, error } = await admin.rpc("create_ecos_session", {
      p_user_id: user.id,
      p_station_slug: scenario.slug,
      p_initial_message: scenario.opening,
    });
    if (error || typeof sessionId !== "string") {
      throw error ?? new Error("Session creation failed");
    }

    // Le mode fixe l'échéance côté serveur : 13 minutes en examen, sans
    // chronomètre en entraînement.
    const mode = parseEcosMode(body.mode);
    const { error: modeError } = await admin
      .from("ecos_sessions")
      .update({ mode })
      .eq("id", sessionId)
      .eq("user_id", user.id);
    if (modeError) throw modeError;

    return apiJson(
      {
        sessionId,
        mode,
        // La grille (mots-clés, indices) ne sert qu'aux repères de l'entraînement :
        // elle n'est pas envoyée en mode examen.
        criteria: mode === "training" ? scenario.criteria.filter((criterion) => criterion.id !== EXAM_CRITERION_ID) : [],
        startedAt: new Date().toISOString(),
        initialMessage: scenario.opening,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
