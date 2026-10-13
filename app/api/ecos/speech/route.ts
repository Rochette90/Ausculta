import { EXAMINER_PREFIX } from "@/lib/ecos/engine";
import { ecosQuotasForUser } from "@/lib/ecos/plan";
import { DAY_SECONDS } from "@/lib/ecos/quotas";
import { getEcosScenario } from "@/lib/ecos/stations";
import { elevenLabsSpeechRequest, isPermanentVoiceFailure, SPEECH_MAX_CHARACTERS, speechConfig, speechErrorReason } from "@/lib/ecos/voice";
import { UUID_PATTERN } from "@/lib/validation";
import { BRAND_NAME } from "@/lib/brand";
import {
  ApiError,
  assertSameOrigin,
  handleApiError,
  readJsonObject,
  requireAuthenticatedUser,
} from "@/app/lib/api-security";
import { enforceRateLimit, withinGlobalLimit, withinRateLimit } from "@/app/lib/rate-limit";
import { stopwatch } from "@/app/lib/timing";
import { createAdminClient } from "@/lib/supabase/server";

/** Répliques récentes du patient parmi lesquelles la réplique à lire doit figurer. */
const RECENT_PATIENT_LINES = 8;

/**
 * Lit à voix haute une réplique déjà enregistrée : la phrase d'ouverture du
 * patient (les réponses suivantes arrivent avec leur audio par
 * `/api/ecos/chat`). La route ne synthétise
 * jamais un texte libre : elle n'accepte qu'une réplique déjà enregistrée dans
 * la session de l'utilisateur, pour que la clé de synthèse ne puisse pas servir
 * à autre chose. Sans configuration, elle répond 503 et le navigateur prend le
 * relais avec sa propre voix.
 */
export async function POST(request: Request) {
  const timing = stopwatch("speech");
  try {
    const user = await requireAuthenticatedUser();
    timing.mark("auth");
    assertSameOrigin(request);
    const body = await readJsonObject(request, 8_000);
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    if (!text || text.length > SPEECH_MAX_CHARACTERS || text.startsWith(EXAMINER_PREFIX)) {
      throw new ApiError(400, "invalid_text", "Réplique invalide");
    }
    if (!UUID_PATTERN.test(sessionId)) {
      throw new ApiError(400, "invalid_session", "Session invalide");
    }

    const admin = createAdminClient();
    // La route ne lit que la phrase d'ouverture : quelques appels par minute suffisent.
    await enforceRateLimit(admin, user.id, "ecos-speech", 10, 60);
    const { data: session, error: sessionError } = await admin
      .from("ecos_sessions")
      .select("id, status, station_slug")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(404, "session_not_found", "Session introuvable");
    if (session.status !== "active") throw new ApiError(409, "session_not_active", "Session déjà clôturée");
    const scenario = getEcosScenario(String(session.station_slug));
    if (!scenario) throw new ApiError(409, "unsupported_station", "Scénario non disponible.");

    const config = speechConfig(scenario);
    if (!config) throw new ApiError(503, "speech_unavailable", "Voix réaliste non configurée");
    // Quota du jour atteint (compte, puis plafond global) : même réponse, le navigateur lit avec sa propre voix.
    const { quotas } = await ecosQuotasForUser(admin, user.id);
    if (!(await withinRateLimit(admin, user.id, "ecos-voice-day", quotas.dailyVoiceReplies, DAY_SECONDS))
      || !(await withinGlobalLimit(admin, "ecos-voice-day", quotas.globalDailyVoiceReplies, DAY_SECONDS))) {
      throw new ApiError(503, "speech_unavailable", "Voix réaliste indisponible pour aujourd’hui");
    }

    const { data: lines, error: linesError } = await admin
      .from("ecos_messages")
      .select("content")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .eq("role", "patient")
      .order("sequence", { ascending: false })
      .limit(RECENT_PATIENT_LINES);
    if (linesError) throw linesError;
    if (!(lines ?? []).some((line) => String(line.content).trim() === text)) {
      throw new ApiError(403, "unknown_line", "Cette réplique n’appartient pas à la session");
    }

    timing.mark("checks");
    let upstream: Response;
    try {
      const { url, headers, body: speechBody } = elevenLabsSpeechRequest(config, text);
      upstream = await fetch(url, { method: "POST", headers, body: speechBody, signal: AbortSignal.timeout(15_000) });
    } catch {
      throw new ApiError(502, "speech_failed", "Voix momentanément indisponible");
    }
    if (!upstream.ok || !upstream.body) {
      // Le motif du refus est journalisé côté serveur pour le diagnostic (clé,
      // voix, modèle, quota) ; il n'est jamais renvoyé au navigateur.
      const reason = upstream.ok ? "réponse vide" : speechErrorReason(await upstream.json().catch(() => null));
      console.error(`${BRAND_NAME} speech: ElevenLabs ${upstream.status}${reason ? ` — ${reason}` : ""}`);
      // Clé refusée, voix introuvable… : réessayer à chaque réplique ne ferait
      // que retarder la voix de secours. Le navigateur cesse de la demander.
      if (isPermanentVoiceFailure(upstream.status)) {
        throw new ApiError(503, "speech_unavailable", "Voix réaliste indisponible");
      }
      throw new ApiError(502, "speech_failed", "Voix momentanément indisponible");
    }

    timing.mark("voice-first-byte");
    // Mesure aussi la durée totale de la génération, sans retarder le flux.
    let bytes = 0;
    const measured = upstream.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) { bytes += chunk.byteLength; controller.enqueue(chunk); },
      flush() { timing.mark("voice-stream"); timing.done(`text=${text.length}chars audio=${bytes}bytes`); },
    }));
    return new Response(measured, {
      headers: {
        "content-type": "audio/mpeg",
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
