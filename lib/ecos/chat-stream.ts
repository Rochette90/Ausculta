/**
 * Réponse du patient envoyée en flux par `/api/ecos/chat` : une ligne JSON par
 * événement (NDJSON). Le navigateur fait parler le patient dès le premier
 * morceau, sans attendre la fin de la réponse.
 *
 * 1. `start`       : `voice` indique si l'audio réaliste suivra.
 * 2. `segment`     : morceau de réplique prêt à être dit (dans l'ordre).
 * 3. `audio`       : MP3 du morceau `index`, en base64 (si `voice`).
 *    `audio-error` : la synthèse de ce morceau a échoué ; `disable` si elle
 *                    échouera aussi pour les suivants.
 * 4. `done`        : réplique complète, enregistrée en base. Toujours en dernier.
 *    `error`       : échec après le début du flux.
 */
export type ChatStreamEvent =
  | { type: "start"; voice: boolean }
  | { type: "segment"; index: number; text: string }
  | { type: "audio"; index: number; audio: string }
  | { type: "audio-error"; index: number; disable: boolean }
  | { type: "done"; reply: string; source: string }
  | { type: "error"; error: string };

const EVENT_TYPES = new Set<ChatStreamEvent["type"]>(["start", "segment", "audio", "audio-error", "done", "error"]);

const encoder = new TextEncoder();

export function encodeChatEvent(event: ChatStreamEvent): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

function parseChatEvent(line: string): ChatStreamEvent | null {
  const text = line.trim();
  if (!text) return null;
  try {
    const value = JSON.parse(text) as { type?: unknown };
    return value && typeof value === "object" && EVENT_TYPES.has(value.type as ChatStreamEvent["type"])
      ? value as ChatStreamEvent
      : null;
  } catch {
    return null;
  }
}

/** Lit le flux ligne par ligne et transmet chaque événement dès son arrivée. */
export async function readChatEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const emit = (line: string) => {
    const event = parseChatEvent(line);
    if (event) onEvent(event);
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      emit(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf("\n");
    }
  }
  emit(buffer + decoder.decode());
}
