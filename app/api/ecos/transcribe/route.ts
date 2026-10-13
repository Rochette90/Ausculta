import { ecosQuotasForUser } from "@/lib/ecos/plan";
import { DAY_SECONDS } from "@/lib/ecos/quotas";
import {
  elevenLabsTranscriptionRequest,
  isAcceptedAudioType,
  TRANSCRIPTION_MAX_BYTES,
  TRANSCRIPTION_MIN_BYTES,
  transcriptionConfig,
  transcriptText,
} from "@/lib/ecos/transcription";
import { speechErrorReason } from "@/lib/ecos/voice";
import { UUID_PATTERN } from "@/lib/validation";
import { BRAND_NAME } from "@/lib/brand";
import { ApiError, apiJson, assertSameOrigin, handleApiError, requireAuthenticatedUser } from "@/app/lib/api-security";
import { enforceRateLimit, withinGlobalLimit, withinRateLimit } from "@/app/lib/rate-limit";
import { stopwatch } from "@/app/lib/timing";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Transcrit une question (ou une dictée de champ) enregistrée pendant une
 * station en cours. L'audio n'est ni conservé ni journalisé : seul le texte
 * revient. Sans configuration ou au-delà des quotas, la route répond 503 et
 * la station reprend la dictée du navigateur.
 */
export async function POST(request: Request) {
  const timing = stopwatch("transcribe");
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const config = transcriptionConfig();
    if (!config) throw new ApiError(503, "transcription_unavailable", "Transcription non configurée");

    // Refuse un envoi trop lourd avant de le lire.
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > TRANSCRIPTION_MAX_BYTES + 10_000) throw new ApiError(413, "audio_too_large", "Enregistrement trop long");
    const form = await request.formData().catch(() => null);
    const audio = form?.get("audio");
    const sessionId = form?.get("sessionId");
    if (typeof sessionId !== "string" || !UUID_PATTERN.test(sessionId)) {
      throw new ApiError(400, "invalid_session", "Session invalide");
    }
    if (!(audio instanceof Blob) || !isAcceptedAudioType(audio.type)) {
      throw new ApiError(400, "invalid_audio", "Enregistrement invalide");
    }
    if (audio.size > TRANSCRIPTION_MAX_BYTES) throw new ApiError(413, "audio_too_large", "Enregistrement trop long");
    if (audio.size < TRANSCRIPTION_MIN_BYTES) return apiJson({ text: "" });

    const admin = createAdminClient();
    // La station transcrit par anticipation à chaque pause : jusqu'à deux appels par question.
    await enforceRateLimit(admin, user.id, "ecos-transcribe", 40, 60);

    // Contrôles de session et de quotas en même temps que la transcription :
    // l'étudiant attend sa question, pas les allers-retours en base. Un
    // contrôle refusé annule l'appel et son texte n'est jamais rendu.
    const upstreamAbort = new AbortController();
    const checks = (async () => {
      const [sessionResult, { quotas }] = await Promise.all([
        admin
          .from("ecos_sessions")
          .select("id, status")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .maybeSingle(),
        ecosQuotasForUser(admin, user.id),
      ]);
      const { data: session, error: sessionError } = sessionResult;
      if (sessionError) throw sessionError;
      if (!session) throw new ApiError(404, "session_not_found", "Session introuvable");
      if (session.status !== "active") throw new ApiError(409, "session_not_active", "Session déjà clôturée");
      // Mêmes plafonds que les questions (doublés pour la transcription par anticipation).
      // Atteints, la dictée du navigateur prend le relais au lieu de bloquer.
      const [accountOk, globalOk] = await Promise.all([
        withinRateLimit(admin, user.id, "ecos-transcribe-day", quotas.dailyMessages * 2, DAY_SECONDS),
        withinGlobalLimit(admin, "ecos-transcribe-day", quotas.globalDailyMessages * 2, DAY_SECONDS),
      ]);
      if (!accountOk || !globalOk) throw new ApiError(503, "transcription_unavailable", "Transcription indisponible pour aujourd’hui");
      timing.mark("checks");
    })().catch((error: unknown) => { upstreamAbort.abort(); throw error; });

    const { url, init } = elevenLabsTranscriptionRequest(config, audio);
    const call = fetch(url, { ...init, signal: AbortSignal.any([upstreamAbort.signal, AbortSignal.timeout(15_000)]) });
    // Le refus d'un contrôle l'emporte toujours sur la réponse du fournisseur.
    const [, settled] = await Promise.all([checks, call.then((response) => ({ response }), () => null)]);
    if (!settled) throw new ApiError(502, "transcription_failed", "Transcription momentanément indisponible");
    const upstream = settled.response;
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      // Le motif reste dans les journaux du serveur, jamais dans la réponse.
      const reason = speechErrorReason(data);
      console.error(`${BRAND_NAME} transcribe: ElevenLabs ${upstream.status}${reason ? ` — ${reason}` : ""}`);
      // Clé refusée : inutile de réessayer à chaque question. Un audio
      // illisible (400, 422) ne concerne que cet enregistrement.
      if (upstream.status === 401 || upstream.status === 403) {
        throw new ApiError(503, "transcription_unavailable", "Transcription indisponible");
      }
      throw new ApiError(502, "transcription_failed", "Transcription momentanément indisponible");
    }
    const text = transcriptText(data);
    timing.mark("scribe");
    timing.done(`audio=${audio.size}bytes text=${text.length}chars`);
    return apiJson({ text });
  } catch (error) {
    return handleApiError(error);
  }
}
