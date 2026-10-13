import type { EcosScenario } from "./types.ts";

/**
 * Voix réaliste du patient simulé (ElevenLabs). Tout est optionnel : sans clé
 * ou sans voix configurée, la station retombe sur la synthèse du navigateur.
 * Les identifiants de voix se choisissent dans le compte ElevenLabs ; ils ne
 * sont pas secrets, mais la clé d'API l'est et reste côté serveur.
 */

/** Une réplique du patient dépasse rarement quelques phrases. */
export const SPEECH_MAX_CHARACTERS = 1_200;

/** En dessous de cet âge, une voix « jeune » est préférée si elle existe. */
const YOUNG_VOICE_MAX_AGE = 35;

/** Modèle rapide et économique ; `eleven_v4_turbo` est plus expressif. */
const DEFAULT_MODEL = "eleven_flash_v2_5";

export type SpeechConfig = { apiKey: string; voiceId: string; modelId: string };

/**
 * Variables lues : `ELEVENLABS_API_KEY`, `ELEVENLABS_MODEL`,
 * `ELEVENLABS_VOICE_FEMALE`, `ELEVENLABS_VOICE_MALE` et leurs variantes
 * `_YOUNG`. Toutes sont optionnelles.
 */
type SpeechEnv = Readonly<Record<string, string | undefined>>;

const clean = (value: string | undefined) => value?.trim() || null;

/** Sexe de la personne qui parle : le patient, ou le proche qui répond pour lui. */
export function speakerSex(scenario: Pick<EcosScenario, "patient" | "voiceSex">): "F" | "M" {
  return scenario.voiceSex ?? scenario.patient.sex;
}

/** Voix ElevenLabs de la station, ou `null` si la voix réaliste n'est pas configurée. */
export function speechConfig(
  scenario: Pick<EcosScenario, "patient" | "voiceSex">,
  env: SpeechEnv = process.env,
): SpeechConfig | null {
  const apiKey = clean(env.ELEVENLABS_API_KEY);
  if (!apiKey) return null;
  const female = speakerSex(scenario) === "F";
  const base = clean(female ? env.ELEVENLABS_VOICE_FEMALE : env.ELEVENLABS_VOICE_MALE);
  // La voix « jeune » ne vaut que pour le patient lui-même : l'âge du proche
  // qui répond à sa place n'est pas connu.
  const young = !scenario.voiceSex && scenario.patient.age < YOUNG_VOICE_MAX_AGE
    ? clean(female ? env.ELEVENLABS_VOICE_FEMALE_YOUNG : env.ELEVENLABS_VOICE_MALE_YOUNG)
    : null;
  const voiceId = young ?? base;
  if (!voiceId) return null;
  return { apiKey, voiceId, modelId: clean(env.ELEVENLABS_MODEL) ?? DEFAULT_MODEL };
}

/** Corps de la requête de synthèse envoyée à ElevenLabs. */
export function speechRequestBody(text: string, modelId: string) {
  return {
    text,
    model_id: modelId,
    // Force le français quand le modèle l'accepte ; `eleven_multilingual_v2`
    // détecte la langue lui-même et refuse ce champ.
    ...(modelId.includes("multilingual") ? {} : { language_code: "fr" }),
  };
}

/** Format demandé à ElevenLabs : MP3, lisible par tous les navigateurs. */
const SPEECH_OUTPUT_FORMAT = "mp3_44100_128";

/** Requête de synthèse ElevenLabs pour une réplique. */
export function elevenLabsSpeechRequest(config: SpeechConfig, text: string) {
  return {
    url: `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(config.voiceId)}/stream?output_format=${SPEECH_OUTPUT_FORMAT}`,
    headers: { "xi-api-key": config.apiKey, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify(speechRequestBody(text, config.modelId)),
  };
}

/**
 * Refus qui se répétera à chaque réplique (clé, droits, voix ou requête
 * invalides) : inutile de réessayer, la voix du navigateur prend le relais.
 */
export function isPermanentVoiceFailure(status: number): boolean {
  return status === 400 || status === 401 || status === 403 || status === 404;
}

/** Motif court d'un refus d'ElevenLabs (`detail.status` et son message), pour le journal du serveur. */
export function speechErrorReason(data: unknown): string | null {
  const detail = (data as { detail?: string | { status?: unknown; code?: unknown; message?: unknown } } | null)?.detail;
  const parts = typeof detail === "string" ? [detail] : [detail?.status ?? detail?.code, detail?.message];
  const reason = parts.filter((part): part is string => typeof part === "string").join(" : ");
  return reason.replace(/[\r\n]+/g, " ").slice(0, 240) || null;
}

export class VoiceProviderError extends Error {
  /** Vrai si le refus se répétera (voir `isPermanentVoiceFailure`). */
  readonly permanent: boolean;

  constructor(message: string, permanent: boolean) {
    super(message);
    this.permanent = permanent;
  }
}

/** Synthétise une réplique et rend le MP3 complet. */
export async function synthesizeSpeech(
  config: SpeechConfig,
  text: string,
  { timeoutMs = 10_000, fetchImpl = fetch }: { timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<Uint8Array> {
  const { url, headers, body } = elevenLabsSpeechRequest(config, text);
  let response: Response;
  try {
    response = await fetchImpl(url, { method: "POST", headers, body, signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new VoiceProviderError("délai dépassé ou réseau indisponible", false);
  }
  if (!response.ok) {
    const reason = speechErrorReason(await response.json().catch(() => null));
    throw new VoiceProviderError(`${response.status}${reason ? ` — ${reason}` : ""}`, isPermanentVoiceFailure(response.status));
  }
  try {
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    throw new VoiceProviderError("audio interrompu", false);
  }
}
