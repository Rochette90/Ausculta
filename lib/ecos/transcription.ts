/**
 * Transcription serveur de la voix de l'étudiant (ElevenLabs Scribe).
 *
 * La reconnaissance du navigateur coupe et comprend mal le vocabulaire
 * médical ; l'enregistrement est envoyé ici une fois la question dite.
 * Sans configuration, la station garde la dictée du navigateur.
 *
 * Variables lues : `ELEVENLABS_API_KEY` (la même que la voix du patient),
 * `ECOS_TRANSCRIPTION` (`elevenlabs` par défaut si la clé est présente,
 * `navigateur` pour revenir à la dictée du navigateur),
 * `ELEVENLABS_TRANSCRIPTION_MODEL` (défaut `scribe_v2`).
 */

/** Enregistrement accepté : une question (≈ 45 s) ou une dictée de champ (≈ 2 min) en Opus. */
export const TRANSCRIPTION_MAX_BYTES = 4_000_000;
/** En dessous, l'enregistrement ne contient pas de parole exploitable. */
export const TRANSCRIPTION_MIN_BYTES = 1_000;
/** Texte renvoyé : au-delà de la limite d'un champ, rien ne servirait. */
export const TRANSCRIPTION_MAX_CHARACTERS = 1_200;

export type TranscriptionConfig = { apiKey: string; modelId: string };

function clean(value: string | undefined) {
  return value?.trim() || "";
}

export function transcriptionConfig(env: Record<string, string | undefined> = process.env): TranscriptionConfig | null {
  const provider = clean(env.ECOS_TRANSCRIPTION).toLowerCase() || "elevenlabs";
  const apiKey = clean(env.ELEVENLABS_API_KEY);
  if (provider !== "elevenlabs" || !apiKey) return null;
  return { apiKey, modelId: clean(env.ELEVENLABS_TRANSCRIPTION_MODEL) || "scribe_v2" };
}

/** Types d'audio produits par MediaRecorder (Chrome, Firefox : WebM/Ogg ; Safari : MP4). */
export function isAcceptedAudioType(type: string) {
  return /^audio\/(webm|ogg|mp4|mpeg|wav|x-m4a|aac)(;|$)/i.test(type.trim());
}

export function elevenLabsTranscriptionRequest(config: TranscriptionConfig, audio: Blob) {
  const form = new FormData();
  form.set("model_id", config.modelId);
  form.set("language_code", "fr");
  // Ni « euh » ni faux départs : la question part telle que l'étudiant voulait la dire.
  form.set("no_verbatim", "true");
  form.set("tag_audio_events", "false");
  form.set("timestamps_granularity", "none");
  form.set("file", audio, "question");
  return {
    url: "https://api.elevenlabs.io/v1/speech-to-text",
    init: { method: "POST", headers: { "xi-api-key": config.apiKey }, body: form },
  };
}

/** Texte de la réponse Scribe, nettoyé et borné ; vide si rien n'a été compris. */
export function transcriptText(data: unknown): string {
  const text = data && typeof data === "object" && "text" in data ? (data as { text?: unknown }).text : "";
  return typeof text === "string" ? text.replace(/\s+/g, " ").trim().slice(0, TRANSCRIPTION_MAX_CHARACTERS) : "";
}
