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
import { BRAND_NAME } from "@/lib/brand";
import { EXAM_CRITERION_ID, hasAnalysisStep, storedTranscript } from "@/lib/ecos/grading";
import { patientAiChain } from "@/lib/ecos/patient-ai";
import { requestReview, reviewLine, withoutReview } from "@/lib/ecos/review";
import { MAX_ANALYSIS_LENGTH, recordAnalysis, synthesisStarted } from "@/lib/ecos/sessions";
import { getEcosScenario } from "@/lib/ecos/stations";
import { stationReflexCount } from "@/lib/ecos/reflexes";
import { stationXp } from "@/lib/ecos/xp";
import { FOLLOW_UP_IDS, followUpLine, MAX_FOLLOW_UP_LENGTH, type FollowUpId } from "@/lib/ecos/follow-ups";
import { DIAGNOSIS_BY_ID } from "@/lib/ecos/diagnosis-catalog";
import { differentialsLine, MAX_DIFFERENTIALS } from "@/lib/ecos/differentials";
import { DIAGNOSIS_PREFIX, PLAN_PREFIX } from "@/lib/ecos/text";
import { sessionDeadline } from "@/lib/ecos/timing";
import { createAdminClient } from "@/lib/supabase/server";
import { buildStationReport } from "@/lib/ecos/report";

const MAX_PLAN_LENGTH = 1_200;

/** Optional synthesis sent with the end of the station. */
async function readSynthesis(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return { diagnosis: "", plan: "", analysis: "", followUps: [] as Array<[FollowUpId, string]>, differentials: [] as string[] };
  const body = await readJsonObject(request, 12_288);
  // Diagnostic principal et différentiels : des entrées de la liste commune, jamais un texte libre.
  const diagnosisId = typeof body.diagnosis === "string" ? body.diagnosis.trim() : "";
  if (diagnosisId && !DIAGNOSIS_BY_ID.has(diagnosisId)) throw new ApiError(400, "invalid_diagnosis", "Diagnostic invalide");
  const diagnosis = diagnosisId ? DIAGNOSIS_BY_ID.get(diagnosisId)?.label ?? "" : "";
  const rawDifferentials = Array.isArray(body.differentials) ? body.differentials : [];
  const differentials = [...new Set(rawDifferentials.filter((item): item is string => typeof item === "string" && DIAGNOSIS_BY_ID.has(item) && item !== diagnosisId))];
  if (rawDifferentials.length > MAX_DIFFERENTIALS || differentials.length > MAX_DIFFERENTIALS) throw new ApiError(400, "invalid_differentials", "Trois diagnostics différentiels au plus");
  const plan = typeof body.plan === "string" ? body.plan.trim() : "";
  const analysis = typeof body.analysis === "string" ? body.analysis.trim() : "";
  if (plan.length > MAX_PLAN_LENGTH) throw new ApiError(400, "invalid_plan", "Prise en charge trop longue");
  if (analysis.length > MAX_ANALYSIS_LENGTH) throw new ApiError(400, "invalid_analysis", "Analyse trop longue");
  // Réponses aux relances de l'examinateur : seules les questions connues, bornées.
  const answers = body.followUps && typeof body.followUps === "object" ? body.followUps as Record<string, unknown> : {};
  const followUps: Array<[FollowUpId, string]> = [];
  for (const id of FOLLOW_UP_IDS) {
    const answer = typeof answers[id] === "string" ? answers[id].trim() : "";
    if (answer.length > MAX_FOLLOW_UP_LENGTH) throw new ApiError(400, "invalid_follow_up", "Réponse trop longue");
    if (answer) followUps.push([id, answer]);
  }
  return { diagnosis, plan, analysis, followUps, differentials };
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
      // L'XP affichée est celle créditée à la fin de la séance, pas un nouveau calcul.
      const { data: credited } = await admin.from("xp_events").select("amount").eq("session_id", id).eq("user_id", user.id).maybeSingle();
      return apiJson({ ...buildStationReport(scenario, storedTranscript(session.transcript), id), xp: Number(credited?.amount ?? 0) });
    }
    if (session.status !== "active") {
      throw new ApiError(409, "session_not_active", "Session déjà clôturée");
    }

    // La synthèse n'est enregistrée que dans le temps imparti ; au-delà, la
    // station est corrigée avec ce qui a été fait avant l'échéance.
    if (Date.now() <= sessionDeadline(session.mode, session.started_at)) {
      const started = await synthesisStarted(admin, id, user.id);
      // Temps écoulé avant la synthèse : l'analyse en cours compte encore,
      // puisqu'aucune proposition de diagnostic n'a été vue.
      if (synthesis.analysis && !started && hasAnalysisStep(scenario)) await recordAnalysis(admin, id, user.id, synthesis.analysis);
      const lines: string[] = [];
      if (synthesis.diagnosis) {
        // Les propositions ne sont connues qu'après l'ouverture de la synthèse.
        if (!started) {
          throw new ApiError(409, "synthesis_not_started", "Ouvre la synthèse avant de proposer un diagnostic.");
        }
        lines.push(`${DIAGNOSIS_PREFIX}${synthesis.diagnosis}`);
      }
      if (synthesis.plan) lines.push(`${PLAN_PREFIX}${synthesis.plan}`);
      if (started && synthesis.differentials.length) lines.push(differentialsLine(synthesis.differentials));
      // Hors notation : elles ne sont lues que par le bilan, face aux éléments attendus.
      if (started) for (const [followUpId, answer] of synthesis.followUps) lines.push(followUpLine(followUpId, answer));
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
    const graded = buildStationReport(scenario, stored, id);
    // Meilleur score des séances précédentes sur cette station : record ou nouveau patient.
    const { data: best, error: bestError } = await admin
      .from("ecos_sessions")
      .select("score")
      .eq("user_id", user.id)
      .eq("station_slug", String(session.station_slug))
      .eq("status", "completed")
      .neq("id", id)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (bestError) throw bestError;
    const { questions } = graded.communication;
    const xp = stationXp({
      score: graded.score,
      questions: questions.open + questions.targeted + questions.closed,
      previousBest: best ? Number(best.score) : null,
      reflexes: stationReflexCount(scenario, stored),
      mode: session.mode === "exam" ? "exam" : "training",
    });
    const report = { ...graded, xp: xp.total, xpLines: xp.lines };
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
