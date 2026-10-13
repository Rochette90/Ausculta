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
import { examOrderResult } from "@/lib/ecos/exam-orders";
import { synthesisStarted } from "@/lib/ecos/sessions";
import { getEcosScenario } from "@/lib/ecos/stations";
import { EXAMINER_PREFIX, PROCEDURE_PREFIX } from "@/lib/ecos/text";
import { sessionDeadline } from "@/lib/ecos/timing";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Clinical-exam phase: the student chooses a gesture or a test; the server
 * records it in the transcript and unlocks its result. Results never reach
 * the browser before being chosen.
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
    const body = await readJsonObject(request, 1_024);
    const procedureId = typeof body.procedureId === "string" ? body.procedureId : "";
    if (!/^[a-z0-9-]{1,60}$/.test(procedureId)) throw new ApiError(400, "invalid_procedure", "Geste invalide");

    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "ecos-procedure", 60, 60);
    const { data: session, error: sessionError } = await admin
      .from("ecos_sessions")
      .select("status, station_slug, started_at, mode")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(404, "session_not_found", "Session introuvable");
    if (session.status !== "active") throw new ApiError(409, "session_not_active", "Session déjà clôturée");
    if (Date.now() > sessionDeadline(session.mode, session.started_at)) {
      throw new ApiError(409, "station_expired", "Le temps est écoulé. Termine la station pour enregistrer le bilan.");
    }

    if (await synthesisStarted(admin, id, user.id)) {
      throw new ApiError(409, "synthesis_started", "La synthèse est commencée : l’examen clinique est terminé.");
    }

    const scenario = getEcosScenario(String(session.station_slug));
    if (!scenario) throw new ApiError(409, "unsupported_station", "Scénario non disponible.");
    // Entrée du catalogue commun : le résultat propre au cas, sinon le résultat normal.
    const order = examOrderResult(scenario, procedureId);
    if (!order) throw new ApiError(400, "invalid_procedure", "Geste invalide");
    const { item: procedure, result } = order;
    const studentLine = `${PROCEDURE_PREFIX}${procedure.label}`;

    // Un double clic ou une répétition réseau ne duplique pas le geste.
    const { data: existing, error: existingError } = await admin
      .from("ecos_messages")
      .select("sequence")
      .eq("session_id", id)
      .eq("user_id", user.id)
      .eq("role", "student")
      .eq("content", studentLine)
      .limit(1);
    if (existingError) throw existingError;

    if (!existing?.length) {
      for (const [role, content] of [["student", studentLine], ["patient", `${EXAMINER_PREFIX}${result}`]] as const) {
        const { error } = await admin.rpc("append_ecos_message", {
          p_user_id: user.id,
          p_session_id: id,
          p_role: role,
          p_content: content,
        });
        if (error) throw error;
      }
    }

    // L'image ne part qu'avec le résultat, une fois le geste choisi, et
    // seulement pour un fichier du site (jamais une URL externe).
    const image = order.image && order.image.src.startsWith("/ecos/") && !order.image.src.startsWith("//")
      ? order.image
      : null;
    return apiJson({ procedureId: procedure.id, label: procedure.label, result, image });
  } catch (error) {
    return handleApiError(error);
  }
}
