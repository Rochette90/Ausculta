/**
 * Enregistrement de la voix de l'étudiant pour la transcription serveur.
 *
 * Le micro est demandé une fois puis gardé pendant la station (pas de
 * nouvelle autorisation à chaque question sur Safari). Un analyseur de
 * niveau sonore repère le début de la parole puis le silence qui la termine.
 */

export type CaptureOptions = {
  /** Silence après la parole qui termine l'enregistrement ; `null` : seul `finish` l'arrête (dictée d'un champ). */
  silenceMs: number | null;
  /** Durée maximale de l'enregistrement. */
  maxMs: number;
  /** Sans parole pendant ce délai, l'enregistrement s'arrête sans rien rendre. */
  noSpeechMs?: number;
  /** Appelé au premier mot détecté. */
  onSpeech?: () => void;
  /**
   * Pause plus courte que `silenceMs` : `onPause` reçoit l'audio enregistré
   * jusque-là (pour le transcrire par anticipation), `onResume` signale que
   * l'étudiant reparle et que cet audio est périmé.
   */
  pauseMs?: number;
  onPause?: (audio: Blob) => void;
  onResume?: () => void;
};

export type CaptureHandle = {
  /** Arrête l'enregistrement : `true` rend l'audio, `false` le jette. */
  finish: (keep: boolean) => void;
  /** Audio enregistré, ou `null` (rien dit, annulé, micro indisponible). */
  result: Promise<Blob | null>;
};

/** Le micro a été refusé ou n'existe pas : la dictée du navigateur ne fera pas mieux. */
export class MicrophoneUnavailableError extends Error {}

/** Niveau (RMS) au-delà duquel le son est toujours de la parole, même pendant l'étalonnage. */
const CLEAR_SPEECH_LEVEL = 0.04;
/** Plafond du bruit de fond mesuré : une voix entendue dès l'ouverture ne doit pas devenir le « bruit ». */
const MAX_NOISE_FLOOR = 0.012;
/** Seuil minimal de parole, pour les micros très propres. */
const MIN_SPEECH_LEVEL = 0.012;

function debug(message: string) {
  if (process.env.NODE_ENV === "development") console.info(`micro ${message}`);
}

const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

export function canCaptureVoice() {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

function recorderMimeType() {
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? "";
}

export class VoiceCapture {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;

  private async microphone() {
    if (this.stream?.getAudioTracks().some((track) => track.readyState === "live")) return this.stream;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (error) {
      throw new MicrophoneUnavailableError(error instanceof Error ? error.message : "micro indisponible");
    }
    return this.stream;
  }

  listen(options: CaptureOptions): CaptureHandle {
    let finishRequest: ((keep: boolean) => void) | null = null;
    let pendingFinish: boolean | null = null;
    // Créé avant toute attente : Safari n'autorise le son que dans le geste de l'utilisateur.
    this.context ??= new AudioContext();
    const context = this.context;
    const result = (async () => {
      const stream = await this.microphone();
      // Annulé pendant la demande d'autorisation.
      if (pendingFinish === false) return null;
      if (context.state === "suspended") await context.resume().catch(() => undefined);
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      const mimeType = recorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 32_000 } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };

      return new Promise<Blob | null>((resolve) => {
        const startedAt = performance.now();
        let spoke = false;
        let lastVoiceAt = 0;
        let noiseFloor = 0;
        let paused = false;
        const audioType = recorder.mimeType || mimeType || "audio/webm";
        let keep = false;
        let done = false;
        let frame = 0;
        const stop = (keepAudio: boolean) => {
          if (done) return;
          done = true;
          keep = keepAudio;
          window.cancelAnimationFrame(frame);
          window.clearInterval(poll);
          source.disconnect();
          if (recorder.state !== "inactive") recorder.stop(); else resolve(null);
        };
        recorder.onstop = () => {
          resolve(keep && chunks.length ? new Blob(chunks, { type: audioType }) : null);
        };
        finishRequest = stop;
        // Niveau sonore : la parole dépasse nettement le bruit de fond mesuré au départ.
        const measure = () => {
          if (done) return;
          analyser.getFloatTimeDomainData(samples);
          let sum = 0;
          for (const sample of samples) sum += sample * sample;
          const level = Math.sqrt(sum / samples.length);
          const now = performance.now();
          const elapsed = now - startedAt;
          // Étalonnage sur les 300 premières ms, plafonné : si l'étudiant répond
          // aussitôt, sa voix ne doit pas relever le seuil au-dessus d'elle-même.
          if (!spoke && elapsed < 300) noiseFloor = Math.min(MAX_NOISE_FLOOR, Math.max(noiseFloor, level));
          const threshold = Math.max(MIN_SPEECH_LEVEL, noiseFloor * 2.5);
          if (level > CLEAR_SPEECH_LEVEL || (level > threshold && elapsed >= 300)) {
            if (!spoke) { spoke = true; debug(`parole détectée (niveau ${level.toFixed(3)}, seuil ${threshold.toFixed(3)})`); options.onSpeech?.(); }
            if (paused) { paused = false; debug("reprise après une pause"); options.onResume?.(); }
            lastVoiceAt = now;
          }
          if (spoke && !paused && options.pauseMs !== undefined && now - lastVoiceAt > options.pauseMs && chunks.length) {
            paused = true;
            debug("pause : transcription anticipée");
            options.onPause?.(new Blob(chunks, { type: audioType }));
          }
          if (elapsed > options.maxMs) { debug("durée maximale atteinte"); return stop(true); }
          if (!spoke && elapsed > (options.noSpeechMs ?? 8_000) && options.silenceMs !== null) { debug(`aucune parole détectée (seuil ${threshold.toFixed(3)})`); return stop(false); }
          if (spoke && options.silenceMs !== null && now - lastVoiceAt > options.silenceMs) { debug("fin de la question (silence)"); return stop(true); }
        };
        // requestAnimationFrame s'arrête quand l'onglet est caché : un intervalle prend le relais.
        const loop = () => { measure(); if (!done) frame = window.requestAnimationFrame(loop); };
        const poll = window.setInterval(measure, 100);
        recorder.start(250);
        frame = window.requestAnimationFrame(loop);
        if (pendingFinish !== null) stop(pendingFinish);
      });
    })();
    return {
      result,
      finish: (keepAudio) => {
        if (finishRequest) finishRequest(keepAudio);
        else pendingFinish = keepAudio;
      },
    };
  }

  /** Libère le micro (fin de la station, conversation arrêtée). */
  release() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    void this.context?.close().catch(() => undefined);
    this.context = null;
  }
}
