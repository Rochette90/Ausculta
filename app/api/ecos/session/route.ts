import {
  apiJson,
  assertSameOrigin,
  handleApiError,
  requireAuthenticatedUser,
} from "../../../lib/api-security";
import { enforceRateLimit } from "../../../lib/rate-limit";
import { createAdminClient } from "../../../../lib/supabase/server";

const INITIAL_PATIENT_MESSAGE =
  "Bonjour docteur… j’ai une forte douleur dans la poitrine depuis ce matin et ça m’inquiète beaucoup.";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "ecos-session", 10, 60);

    const { data: sessionId, error } = await admin.rpc("create_ecos_session", {
      p_user_id: user.id,
      p_station_slug: "douleur-thoracique-aigue",
      p_initial_message: INITIAL_PATIENT_MESSAGE,
    });
    if (error || typeof sessionId !== "string") {
      throw error ?? new Error("Session creation failed");
    }

    return apiJson(
      {
        sessionId,
        startedAt: new Date().toISOString(),
        initialMessage: INITIAL_PATIENT_MESSAGE,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
