import { UUID_PATTERN } from "@/lib/validation";
import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  readJsonObject,
  requireAuthenticatedUser,
} from "../../../../lib/api-security";
import { enforceRateLimit } from "../../../../lib/rate-limit";
import { BRAND_NAME } from "@/lib/brand";
import { communicationReport } from "@/lib/ecos/communication";
import { debriefView } from "@/lib/ecos/debrief";
import { diagnosisOptions, EXAM_CRITERION_ID, gradeEcosStation, storedTranscript } from "@/lib/ecos/grading";
import { patientAiChain } from "@/lib/ecos/patient-ai";
import { requestReview, reviewLine, withoutReview } from "@/lib/ecos/review";
import { synthesisStarted } from "@/lib/ecos/sessions";
import { getEcosScenario } from "@/lib/ecos/stations";
import { DIAGNOSIS_PREFIX, PLAN_PREFIX } from "@/lib/ecos/text";
import { sessionDeadline } from "@/lib/ecos/timing";
import type { EcosMessage, EcosScenario } from "@/lib/ecos/types";
import { createAdminClient } from "../../../../../lib/supabase/server";

const MAX_PLAN_LENGTH = 1_200;

/** Optional synthesis sent with the end of the station. */
async function readSynthesis(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return { diagnosis: "", plan: "" };
  const body = await readJsonObject(request, 4_096);
  const diagnosis = typeof body.diagnosis === "string" ? body.diagnosis.trim() : "";
  const plan = typeof body.plan === "string" ? body.plan.trim() : "";
  if (plan.length > MAX_PLAN_LENGTH) throw new ApiError(400, "invalid_plan", "Prise en charge trop longue");
  return { diagnosis, plan };
}

/** Bilan renvoyé au navigateur : grille, communication et débriefing. */
function stationReport(scenario: EcosScenario, transcript: EcosMessage[]) {
  return {
    saved: true,
    ...gradeEcosStation(scenario, transcript),
    communication: communicationReport(transcript),
    debrief: debriefView(scenario.debrief),
  };
}

/**
 * Grades the station from the transcript stored by the server (never from the
 * browser) and only then reveals the debrief: diagnosis, key points, sources.
 * The model reviews the grid items the keywords missed (lib/ecos/review.ts);
 * its review is stored with the transcript so that reopening shows the same grade.
 */
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
    const synthesis = await readSynthesis(request);

    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "ecos-complete", 20, 60);

    const { data: session, error: sessionError } = await admin
      .from("ecos_sessions")
      .select("status, station_slug, started_at, mode, transcript")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(404, "session_not_found", "Session introuvable");

    const scenario = getEcosScenario(String(session.station_slug));
    if (!scenario) throw new ApiError(409, "unsupported_station", "Scénario non disponible.");

    if (session.status === "completed") {
      return apiJson(stationReport(scenario, storedTranscript(session.transcript)));
    }
    if (session.status !== "active") {
      throw new ApiError(409, "session_not_active", "Session déjà clôturée");
    }

    // La synthèse n'est enregistrée que dans le temps imparti ; au-delà, la
    // station est corrigée avec ce qui a été fait avant l'échéance.
    if (Date.now() <= sessionDeadline(session.mode, session.started_at)) {
      const lines: string[] = [];
      if (synthesis.diagnosis) {
        // Les propositions ne sont connues qu'après l'ouverture de la synthèse.
        if (!(await synthesisStarted(admin, id, user.id))) {
          throw new ApiError(409, "synthesis_not_started", "Ouvre la synthèse avant de proposer un diagnostic.");
        }
        if (!diagnosisOptions(scenario, id).includes(synthesis.diagnosis)) {
          throw new ApiError(400, "invalid_diagnosis", "Diagnostic invalide");
        }
        lines.push(`${DIAGNOSIS_PREFIX}${synthesis.diagnosis}`);
      }
      if (synthesis.plan) lines.push(`${PLAN_PREFIX}${synthesis.plan}`);
      for (const content of lines) {
        const { error } = await admin.rpc("append_ecos_message", {
          p_user_id: user.id,
          p_session_id: id,
          p_role: "student",
          p_content: content,
        });
        if (error) throw error;
      }
    }

    const { data: rows, error: messagesError } = await admin
      .from("ecos_messages")
      .select("role, content")
      .eq("session_id", id)
      .eq("user_id", user.id)
      .order("sequence", { ascending: false })
      .limit(400);
    if (messagesError) throw messagesError;

    // Les 400 derniers messages, dans l'ordre : la synthèse, ajoutée en dernier,
    // n'est jamais tronquée par un long entraînement.
    const transcript = withoutReview(storedTranscript(rows ?? []).reverse());
    // Relecture des éléments manqués par les mots-clés ; sans réponse à temps,
    // la note des mots-clés vaut seule.
    const review = await requestReview({
      chain: patientAiChain(),
      scenario,
      messages: transcript,
      examCriterionId: EXAM_CRITERION_ID,
      log: (reason) => console.error(`${BRAND_NAME} review: ${reason}`),
    });
    const stored = review ? [...transcript, reviewLine(review)] : transcript;
    const report = stationReport(scenario, stored);
    const { error: completeError } = await admin.rpc("complete_ecos_session", {
      p_user_id: user.id,
      p_session_id: id,
      p_score: report.score,
      p_max_score: report.maxScore,
      p_xp: report.xp,
      p_transcript: stored,
    });
    if (completeError) throw completeError;

    return apiJson(report);
  } catch (error) {
    return handleApiError(error);
  }
}
