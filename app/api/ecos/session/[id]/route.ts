import { UUID_PATTERN } from "@/lib/validation";
import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  requireAuthenticatedUser,
} from "../../../../lib/api-security";
import { enforceRateLimit } from "../../../../lib/rate-limit";
import { EcosMessage, calculateEcosCriteria, scoreEcosTranscript } from "../../../../lib/ecos";
import { createAdminClient } from "../../../../../lib/supabase/server";


export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const { id } = await context.params;
    if (!UUID_PATTERN.test(id)) {
      throw new ApiError(400, "invalid_session", "Session invalide");
    }

    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "ecos-complete", 20, 60);

    const { data: session, error: sessionError } = await admin
      .from("ecos_sessions")
      .select("status, score, max_score, transcript")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(404, "session_not_found", "Session introuvable");

    if (session.status === "completed") {
      const score = Number(session.score ?? 0);
      return apiJson({
        saved: true,
        criteria: calculateEcosCriteria((session.transcript ?? []) as EcosMessage[]),
        score,
        maxScore: Number(session.max_score ?? 18),
        xp: Math.max(20, score * 3),
      });
    }
    if (session.status !== "active") {
      throw new ApiError(409, "session_not_active", "Session déjà clôturée");
    }

    const { data: rows, error: messagesError } = await admin
      .from("ecos_messages")
      .select("role, content")
      .eq("session_id", id)
      .eq("user_id", user.id)
      .order("sequence", { ascending: true })
      .limit(100);
    if (messagesError) throw messagesError;

    const transcript = (rows ?? []) as EcosMessage[];
    const { score, maxScore, xp } = scoreEcosTranscript(transcript);
    const { error: completeError } = await admin.rpc("complete_ecos_session", {
      p_user_id: user.id,
      p_session_id: id,
      p_score: score,
      p_max_score: maxScore,
      p_xp: xp,
      p_transcript: transcript,
    });
    if (completeError) throw completeError;

    return apiJson({ saved: true, score, maxScore, xp, criteria: calculateEcosCriteria(transcript) });
  } catch (error) {
    return handleApiError(error);
  }
}
