/**
 * Modèle de langage qui joue le patient simulé. Trois fournisseurs sont pris
 * en charge, tous optionnels. Ceux dont la clé est présente forment une chaîne :
 * si le premier échoue (clé, quota, panne, délai), le suivant est essayé, puis
 * le moteur local (`localPatientReply`) répond à partir des mots-clés du script.
 *
 * Les clés restent côté serveur : ne jamais les préfixer par `NEXT_PUBLIC_`.
 */

export type PatientAiProvider = "anthropic" | "openrouter" | "groq";
export type PatientAiConfig = { provider: PatientAiProvider; apiKey: string; model: string };

/** Message de l'entretien tel qu'il est stocké en base. */
export type TranscriptMessage = { role: "patient" | "student" | "system"; content: string };
type ChatMessage = { role: "user" | "assistant"; content: string };

const DEFAULT_MODELS: Record<PatientAiProvider, string> = {
  // Le plus rapide et le moins cher de la gamme : une réplique de patient tient en trois phrases.
  anthropic: "claude-haiku-5-5",
  // Le même modèle par une autre route et une autre facturation : le secours
  // tient si le compte Anthropic est à court de crédit ou si son API est en panne.
  openrouter: "anthropic/claude-haiku-5.5",
  groq: "qwen/qwen3-32b",
};

/** Ordre d'essai par défaut : le fournisseur principal, puis ses secours. */
const DEFAULT_ORDER: readonly PatientAiProvider[] = ["anthropic", "openrouter", "groq"];

/** Une réponse de patient tient en une ou deux phrases : ces bornes ne sont qu'une sécurité. */
const PATIENT_REPLY_MAX_TOKENS = 300;
export const PATIENT_REPLY_MAX_CHARACTERS = 1_200;

type PatientAiEnv = Readonly<Record<string, string | undefined>>;
const clean = (value: string | undefined) => value?.trim() || null;

/**
 * Fournisseurs à essayer, dans l'ordre : Anthropic, puis OpenRouter, puis Groq,
 * en ne gardant que ceux dont la clé est présente. `PATIENT_AI_PROVIDER`
 * (« anthropic », « openrouter » ou « groq ») place ce fournisseur en tête.
 */
export function patientAiChain(env: PatientAiEnv = process.env): PatientAiConfig[] {
  const settings: Record<PatientAiProvider, { apiKey: string | null; model: string }> = {
    anthropic: { apiKey: clean(env.ANTHROPIC_API_KEY), model: clean(env.ANTHROPIC_MODEL) ?? DEFAULT_MODELS.anthropic },
    openrouter: { apiKey: clean(env.OPENROUTER_API_KEY), model: clean(env.OPENROUTER_MODEL) ?? DEFAULT_MODELS.openrouter },
    groq: { apiKey: clean(env.GROQ_API_KEY), model: clean(env.GROQ_MODEL) ?? DEFAULT_MODELS.groq },
  };
  const requested = clean(env.PATIENT_AI_PROVIDER)?.toLowerCase();
  const first = DEFAULT_ORDER.find((provider) => provider === requested);
  const order = first ? [first, ...DEFAULT_ORDER.filter((provider) => provider !== first)] : DEFAULT_ORDER;
  return order.flatMap((provider) => {
    const { apiKey, model } = settings[provider];
    return apiKey ? [{ provider, apiKey, model }] : [];
  });
}

/** Fournisseur principal, ou `null` si aucune clé n'est configurée. */
export function patientAiConfig(env: PatientAiEnv = process.env): PatientAiConfig | null {
  return patientAiChain(env)[0] ?? null;
}

/**
 * Délai accordé à chaque fournisseur : la chaîne entière doit tenir dans la
 * durée maximale de la route, moteur local compris.
 */
export function patientAiTimeoutMs(chainLength: number): number {
  return Math.min(12_000, Math.max(4_000, Math.floor(15_000 / Math.max(1, chainLength))));
}

/**
 * Entretien au format « user / assistant ». Les messages système de
 * l'interface (erreurs, rappels) n'en font pas partie.
 */
function chatMessages(history: readonly TranscriptMessage[]): ChatMessage[] {
  return history
    .filter((item) => item.role !== "system")
    .map((item) => ({ role: item.role === "patient" ? "assistant" as const : "user" as const, content: item.content }));
}

/**
 * L'API Messages d'Anthropic attend un premier message « user » et une
 * alternance stricte : les répliques du patient en tête de fenêtre (dont sa
 * phrase d'ouverture) sont retirées, et deux messages consécutifs du même
 * rôle sont fusionnés.
 */
export function alternatingMessages(history: readonly TranscriptMessage[]): ChatMessage[] {
  const merged: ChatMessage[] = [];
  for (const message of chatMessages(history)) {
    const previous = merged.at(-1);
    if (!previous && message.role === "assistant") continue;
    if (previous?.role === message.role) previous.content = `${previous.content}\n${message.content}`;
    else merged.push({ ...message });
  }
  return merged;
}

/** Requête HTTP prête à l'envoi pour le fournisseur configuré. */
export function patientAiRequest(
  config: PatientAiConfig,
  systemPrompt: string,
  history: readonly TranscriptMessage[],
): { url: string; headers: Record<string, string>; body: Record<string, unknown> } {
  if (config.provider === "anthropic") {
    return {
      url: "https://api.anthropic.com/v1/messages",
      headers: { "x-api-key": config.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: {
        model: config.model,
        max_tokens: PATIENT_REPLY_MAX_TOKENS,
        // La réponse arrive mot à mot : le patient commence à parler dès sa première phrase.
        stream: true,
        // Réponse courte et immédiate : effort minimal, sans phase de réflexion.
        output_config: { effort: "low" },
        thinking: { type: "disabled" },
        system: systemPrompt,
        messages: alternatingMessages(history),
      },
    };
  }
  // OpenRouter et Groq parlent le même format « chat completions ».
  const messages = [{ role: "system", content: systemPrompt }, ...chatMessages(history)];
  const headers = { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" };
  if (config.provider === "openrouter") {
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers,
      body: { model: config.model, max_tokens: PATIENT_REPLY_MAX_TOKENS, stream: true, messages },
    };
  }
  return {
    url: "https://api.groq.com/openai/v1/chat/completions",
    headers,
    body: { model: config.model, temperature: 0.45, max_completion_tokens: 220, stream: true, messages },
  };
}

export type PatientAiDelta = { text?: string; done?: boolean; error?: string };

/**
 * Contenu d'un événement du flux de réponse : un morceau de texte, la fin de
 * la réponse, ou une erreur du fournisseur en cours de route. Le raisonnement
 * éventuel (`thinking`, `reasoning`) n'est jamais repris.
 */
export function patientAiStreamDelta(provider: PatientAiProvider, payload: string): PatientAiDelta {
  if (payload.trim() === "[DONE]") return { done: true };
  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    return {};
  }
  if (data && typeof data === "object" && "error" in data && (data as { error?: unknown }).error) {
    return { error: patientAiErrorReason(data) ?? "erreur du fournisseur" };
  }
  if (provider === "anthropic") {
    const event = data as { type?: string; delta?: { type?: string; text?: unknown } };
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && typeof event.delta.text === "string") {
      return { text: event.delta.text };
    }
    return event.type === "message_stop" ? { done: true } : {};
  }
  const content = (data as { choices?: Array<{ delta?: { content?: unknown } }> }).choices?.[0]?.delta?.content;
  return typeof content === "string" && content ? { text: content } : {};
}

/** Motif court d'un refus du fournisseur, pour le journal du serveur uniquement. */
export function patientAiErrorReason(data: unknown): string | null {
  const error = (data as { error?: { type?: unknown; code?: unknown; message?: unknown } | string } | null)?.error;
  const parts = typeof error === "string" ? [error] : [error?.type ?? error?.code, error?.message];
  // OpenRouter renvoie un code numérique, les autres un identifiant texte.
  const reason = parts
    .map((part) => (typeof part === "number" ? String(part) : part))
    .filter((part): part is string => typeof part === "string")
    .join(" : ");
  return reason.replace(/[\r\n]+/g, " ").slice(0, 240) || null;
}
