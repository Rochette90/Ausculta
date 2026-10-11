import { buildPatientPrompt, EXAMINER_PREFIX, localPatientReply } from "@/lib/ecos/engine";
import { encodeChatEvent, type ChatStreamEvent } from "@/lib/ecos/chat-stream";
import { patientAiChain, patientAiTimeoutMs, type TranscriptMessage } from "@/lib/ecos/patient-ai";
import { streamPatientReply } from "@/lib/ecos/patient-reply";
import { DAY_SECONDS, ecosQuotas, sessionIsFull } from "@/lib/ecos/quotas";
import { synthesisStarted } from "@/lib/ecos/sessions";
import { getEcosScenario } from "@/lib/ecos/stations";
import { usesReservedPrefix } from "@/lib/ecos/text";
import { sessionDeadline } from "@/lib/ecos/timing";
import { speechConfig, synthesizeSpeech, VoiceProviderError } from "@/lib/ecos/voice";
import { UUID_PATTERN } from "@/lib/validation";
import { BRAND_NAME } from "@/lib/brand";
import {
  ApiError,
  assertSameOrigin,
  handleApiError,
  readJsonObject,
  requireAuthenticatedUser,
} from "../../../lib/api-security";
import { enforceDailyQuota, enforceRateLimit, withinRateLimit } from "../../../lib/rate-limit";
import { stopwatch } from "../../../lib/timing";
import { createAdminClient } from "../../../../lib/supabase/server";

/** Messages relus pour donner le contexte au modèle, question en cours comprise. */
const HISTORY_WINDOW = 12;
/** Délai de synthèse d'un morceau : au-delà, le navigateur le dit avec sa propre voix. */
const SEGMENT_SPEECH_TIMEOUT_MS = 8_000;

/** Ligne de l'examinateur : affichée, jamais dite par la voix du patient. */
function isExaminerLine(text: string) {
  return /^\s*examinateur\b/i.test(text);
}

/** Noms qu'un modèle pourrait écrire en tête de réplique : « M. Favre : », « Favre : ». */
function speakerLabels(scenario: { patient: { name: string } }) {
  const name = scenario.patient.name.trim();
  const surname = name.replace(/^(?:M\.|Mme|Mlle|Monsieur|Madame)\s+/i, "");
  return surname && surname !== name ? [name, surname] : [name];
}

/** Le modèle écrit parfois « Examinateur : » à sa façon : le préfixe est normalisé. */
function normalizeReply(reply: string) {
  return isExaminerLine(reply) ? reply.replace(/^\s*Examinateur\s*:\s*/i, EXAMINER_PREFIX) : reply;
}

/**
 * Question de l'étudiant, réponse du patient en flux (voir lib/ecos/chat-stream.ts).
 *
 * Les contrôles (session, droits, délai, quota) précèdent le flux et
 * répondent par un statut HTTP. Ensuite, chaque morceau de réponse part dès
 * qu'il est prêt, avec son audio si la voix réaliste est demandée : le
 * patient commence à parler pendant que la suite s'écrit.
 */
export async function POST(request: Request) {
  const timing = stopwatch("chat");
  try {
    const user = await requireAuthenticatedUser();
    timing.mark("auth");
    assertSameOrigin(request);
    const body = await readJsonObject(request, 12_000);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const wantsVoice = body.voice === true;
    if (!message || message.length > 800) {
      throw new ApiError(400, "invalid_message", "Message invalide");
    }
    // Les gestes, le diagnostic et la prise en charge passent par leurs étapes dédiées.
    if (usesReservedPrefix(message)) {
      throw new ApiError(400, "reserved_message", "Utilise l’étape prévue pour les gestes, le diagnostic ou la prise en charge.");
    }
    if (!UUID_PATTERN.test(sessionId)) {
      throw new ApiError(400, "invalid_session", "Session invalide");
    }

    // Contrôles indépendants lancés ensemble : un seul aller-retour vers la base.
    const admin = createAdminClient();
    const quotas = ecosQuotas();
    const [, sessionResult, synthesisOpen, historyResult, , voiceWithinQuota] = await Promise.all([
      enforceRateLimit(admin, user.id, "ecos-chat", 30, 60),
      admin
        .from("ecos_sessions")
        .select("id, status, station_slug, started_at, mode")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle(),
      synthesisStarted(admin, sessionId, user.id),
      admin
        .from("ecos_messages")
        .select("role, content, sequence")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .order("sequence", { ascending: false })
        .limit(HISTORY_WINDOW - 1),
      enforceDailyQuota(admin, user.id, "ecos-chat-day", quotas.dailyMessages,
        "Tu as atteint le nombre de questions prévu pour aujourd’hui. Termine la station pour voir ton bilan."),
      // Au-delà du quota de voix réaliste, la voix du navigateur prend le relais.
      wantsVoice ? withinRateLimit(admin, user.id, "ecos-voice-day", quotas.dailyVoiceReplies, DAY_SECONDS) : false,
    ]);
    const { data: session, error: sessionError } = sessionResult;
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(404, "session_not_found", "Session introuvable");
    const scenario = getEcosScenario(String(session.station_slug));
    if (!scenario) throw new ApiError(409, "unsupported_station", "Scénario non disponible.");
    if (session.status !== "active") {
      throw new ApiError(409, "session_not_active", "Session déjà clôturée");
    }
    if (Date.now() > sessionDeadline(session.mode, session.started_at)) {
      throw new ApiError(409, "station_expired", "Le temps est écoulé. Termine la station pour enregistrer le bilan.");
    }
    if (synthesisOpen) {
      throw new ApiError(409, "synthesis_started", "La synthèse est commencée : l’entretien est terminé.");
    }
    if (historyResult.error) throw historyResult.error;
    if (sessionIsFull(historyResult.data?.[0]?.sequence, quotas)) {
      throw new ApiError(409, "session_full", "Cette station a atteint sa longueur maximale. Passe à la synthèse pour la terminer.");
    }
    const history: TranscriptMessage[] = [
      ...(historyResult.data ?? []).reverse().map(({ role, content }) => ({ role, content }) as TranscriptMessage),
      { role: "student", content: message },
    ];
    timing.mark("checks");

    // La question est enregistrée pendant que le modèle répond : elle doit
    // seulement précéder la réponse en base.
    const studentSaved = Promise.resolve(admin.rpc("append_ecos_message", {
      p_user_id: user.id,
      p_session_id: sessionId,
      p_role: "student",
      p_content: message,
    })).then(({ error }) => { if (error) throw error; });
    studentSaved.catch(() => undefined);

    const voice = wantsVoice && voiceWithinQuota ? speechConfig(scenario) : null;
    const chain = patientAiChain();
    const turn = history.filter((item) => item.role === "student").length;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Le navigateur a pu fermer la connexion : la réponse est enregistrée quand même.
        const send = (event: ChatStreamEvent) => {
          try { controller.enqueue(encodeChatEvent(event)); } catch { /* flux fermé */ }
        };
        send({ type: "start", voice: Boolean(voice) });

        // Chaque morceau est synthétisé dès qu'il existe ; l'envoi garde l'ordre.
        let audioSent: Promise<void> = Promise.resolve();
        let segments = 0;
        const onSegment = (text: string) => {
          const index = segments;
          segments += 1;
          if (index === 0) timing.mark("first-segment");
          send({ type: "segment", index, text });
          // Navigateur parti : inutile de payer une synthèse que personne n'entendra.
          if (!voice || request.signal.aborted) return;
          const audio = synthesizeSpeech(voice, text, { timeoutMs: SEGMENT_SPEECH_TIMEOUT_MS })
            .then((bytes) => ({ bytes, error: null }), (error: unknown) => ({ bytes: null, error }));
          audioSent = audioSent.then(async () => {
            const outcome = await audio;
            if (outcome.bytes) {
              if (index === 0) timing.mark("first-audio");
              send({ type: "audio", index, audio: Buffer.from(outcome.bytes).toString("base64") });
              return;
            }
            const failure = outcome.error;
            // Le motif (clé, voix, quota, délai) reste dans le journal du serveur.
            console.error(`${BRAND_NAME} speech: ElevenLabs ${failure instanceof Error ? failure.message : "erreur inconnue"}`);
            send({ type: "audio-error", index, disable: failure instanceof VoiceProviderError && failure.permanent });
          });
        };

        try {
          const result = await streamPatientReply({
            chain,
            systemPrompt: chain.length ? buildPatientPrompt(scenario) : "",
            history,
            timeoutMs: patientAiTimeoutMs(chain.length),
            fallback: () => localPatientReply(scenario, message, turn),
            onSegment,
            silent: isExaminerLine,
            speakers: speakerLabels(scenario),
            log: (reason) => console.error(`${BRAND_NAME} patient: ${reason}`),
          });
          timing.mark(`model(${result.source})`);
          const reply = normalizeReply(result.reply);
          const saved = studentSaved.then(async () => {
            const { error } = await admin.rpc("append_ecos_message", {
              p_user_id: user.id,
              p_session_id: sessionId,
              p_role: "patient",
              p_content: reply,
            });
            if (error) throw error;
          });
          await Promise.all([audioSent, saved]);
          timing.mark("audio+save");
          send({ type: "done", reply, source: result.source });
          timing.done(`reply=${reply.length}chars segments=${segments}`);
        } catch (error) {
          console.error(`${BRAND_NAME} chat stream error`, error);
          send({ type: "error", error: "La réponse n’a pas pu être enregistrée. Ta question est conservée dans le champ de saisie." });
        } finally {
          try { controller.close(); } catch { /* déjà fermé */ }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
