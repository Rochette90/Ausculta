import {
  PATIENT_REPLY_MAX_CHARACTERS,
  patientAiErrorReason,
  patientAiRequest,
  patientAiStreamDelta,
  type PatientAiConfig,
  type PatientAiProvider,
  type TranscriptMessage,
} from "./patient-ai.ts";
import { createSpeechSegmenter, createSseParser, createStageDirectionFilter, createThinkFilter } from "./patient-stream.ts";

export type PatientReply = { reply: string; source: PatientAiProvider | "scenario-engine" };

export type StreamPatientReplyOptions = {
  /** Fournisseurs à essayer, dans l'ordre (voir `patientAiChain`). */
  chain: readonly PatientAiConfig[];
  systemPrompt: string;
  history: readonly TranscriptMessage[];
  /** Délai accordé à chaque fournisseur, lecture du flux comprise. */
  timeoutMs: number;
  /** Délai d'attente du premier mot : au-delà, le fournisseur suivant est essayé (rien n'a encore été dit). */
  firstTokenTimeoutMs?: number;
  /** Réponse du moteur local, quand aucun modèle ne répond. */
  fallback: () => string;
  /** Morceau de réponse prêt à être dit à voix haute, transmis dans l'ordre. */
  onSegment: (text: string) => void;
  /** Réplique à ne jamais dire à voix haute (ligne de l'examinateur). */
  silent?: (text: string) => boolean;
  /** Noms que le modèle pourrait mettre en tête de réplique (« M. Favre : »), retirés. */
  speakers?: readonly string[];
  /** Motif d'un échec, pour le journal du serveur. */
  log: (message: string) => void;
  fetchImpl?: typeof fetch;
};

class ProviderFailure extends Error {}

function describeFailure(error: unknown): string {
  if (error instanceof ProviderFailure) return error.message;
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) return "délai dépassé";
  return error instanceof Error ? error.message : "erreur inconnue";
}

/**
 * Réponse du patient, lue au fil de l'eau : chaque morceau prêt à être dit
 * part par `onSegment` sans attendre la fin de la réponse. Les fournisseurs
 * sont essayés dans l'ordre, puis le moteur local.
 *
 * On ne change jamais de fournisseur après avoir transmis un morceau : ce qui
 * a déjà été dit au patient doit rester la réponse enregistrée.
 */
export async function streamPatientReply(options: StreamPatientReplyOptions): Promise<PatientReply> {
  const fetchImpl = options.fetchImpl ?? fetch;

  for (const config of options.chain) {
    const segmenter = createSpeechSegmenter({ mute: options.silent });
    const think = createThinkFilter();
    // Seules les paroles sont gardées : ni didascalie, ni nom en tête de réplique.
    const words = createStageDirectionFilter({ speakers: options.speakers });
    const sse = createSseParser();
    const decoder = new TextDecoder();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    // Premier mot trop lent : on coupe avant tout segment, le fournisseur
    // suivant prend le relais sans silence interminable.
    const firstTimer = options.firstTokenTimeoutMs
      ? setTimeout(() => { if (!accepted) controller.abort(); }, options.firstTokenTimeoutMs)
      : undefined;
    let accepted = "";
    let spoke = false;
    let full = false;

    const emit = (segments: string[]) => {
      for (const segment of segments) {
        spoke = true;
        options.onSegment(segment);
      }
    };
    // Borne la réplique : au-delà, la lecture du flux s'arrête.
    const accept = (text: string) => {
      if (!text || full) return;
      const room = PATIENT_REPLY_MAX_CHARACTERS - accepted.length;
      const piece = text.slice(0, Math.max(0, room));
      if (piece.length < text.length) full = true;
      accepted += piece;
      emit(segmenter.push(piece));
    };

    try {
      const { url, headers, body } = patientAiRequest(config, options.systemPrompt, options.history);
      const response = await fetchImpl(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
      if (!response.ok) {
        const reason = patientAiErrorReason(await response.json().catch(() => null));
        throw new ProviderFailure(`${response.status}${reason ? ` — ${reason}` : ""}`);
      }
      if (!response.body) throw new ProviderFailure("réponse vide");

      const reader = response.body.getReader();
      let finished = false;
      while (!finished && !full) {
        const { value, done } = await reader.read();
        const payloads = done
          ? [...sse.push(decoder.decode()), ...sse.flush()]
          : sse.push(decoder.decode(value, { stream: true }));
        for (const payload of payloads) {
          const delta = patientAiStreamDelta(config.provider, payload);
          if (delta.error) throw new ProviderFailure(delta.error);
          if (delta.text) accept(words.push(think.push(delta.text)));
          if (delta.done) { finished = true; break; }
        }
        if (done) finished = true;
      }
      accept(words.push(think.flush()));
      accept(words.flush());

      const reply = accepted.trim();
      if (!reply) throw new ProviderFailure("réponse vide");
      emit(segmenter.flush());
      return { reply, source: config.provider };
    } catch (error) {
      options.log(`${config.provider} ${describeFailure(error)}`);
      if (spoke) {
        emit(segmenter.flush());
        return { reply: accepted.trim(), source: config.provider };
      }
    } finally {
      clearTimeout(timer);
      if (firstTimer) clearTimeout(firstTimer);
      // Libère la connexion si la lecture s'est arrêtée avant la fin du flux.
      controller.abort();
    }
  }

  const reply = options.fallback();
  const segmenter = createSpeechSegmenter({ mute: options.silent });
  for (const segment of [...segmenter.push(reply), ...segmenter.flush()]) options.onSegment(segment);
  return { reply, source: "scenario-engine" };
}
