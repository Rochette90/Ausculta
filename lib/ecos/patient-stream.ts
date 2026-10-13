/**
 * Outils de flux pour la réponse du patient. Rien ici ne touche au réseau :
 * tout se teste hors ligne.
 */

/** Plus long suffixe de `text` qui commence `tag` (balise coupée entre deux morceaux). */
function partialTagLength(text: string, tag: string): number {
  for (let length = Math.min(tag.length - 1, text.length); length > 0; length -= 1) {
    if (text.endsWith(tag.slice(0, length))) return length;
  }
  return 0;
}

/**
 * Retire les blocs `<think>…</think>` d'un flux de texte, même quand une balise
 * est coupée entre deux morceaux. Un bloc jamais refermé (réponse tronquée)
 * est entièrement retiré.
 */
export function createThinkFilter() {
  const OPEN = "<think>";
  const CLOSE = "</think>";
  let buffer = "";
  let inside = false;

  function drain(final: boolean): string {
    let output = "";
    for (;;) {
      const lower = buffer.toLowerCase();
      if (inside) {
        const end = lower.indexOf(CLOSE);
        if (end === -1) {
          buffer = final ? "" : buffer.slice(buffer.length - partialTagLength(lower, CLOSE));
          return output;
        }
        buffer = buffer.slice(end + CLOSE.length);
        inside = false;
        continue;
      }
      const start = lower.indexOf(OPEN);
      if (start !== -1) {
        output += buffer.slice(0, start);
        buffer = buffer.slice(start + OPEN.length);
        inside = true;
        continue;
      }
      const keep = final ? 0 : partialTagLength(lower, OPEN);
      output += buffer.slice(0, buffer.length - keep);
      buffer = buffer.slice(buffer.length - keep);
      return output;
    }
  }

  return {
    push: (text: string) => { buffer += text; return drain(false); },
    flush: () => drain(true),
  };
}

/** Personnes qu'un modèle met parfois en tête de réplique (« Le patient : … »). */
const GENERIC_SPEAKERS = "(?:le |la |l['’])?(?:patiente?|mari|époux|épouse|femme|mère|père|fils|fille|proche|accompagnante?)";
/** Texte gardé en tête de réponse le temps de reconnaître un nom suivi de « : ». */
const LEADING_LABEL_WINDOW = 32;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Ne garde que les paroles du patient, au fil du flux :
 * - retire les didascalies (`*se tient la poitrine*`, `(soupire)`, `[grimace]`),
 *   même coupées entre deux morceaux, et une didascalie jamais refermée ;
 * - retire le gras (`**…**`) sans retirer les mots ;
 * - retire un nom en tête de réponse (« M. Favre : », « Le patient : ») ;
 * - réduit les espaces laissés par ces retraits.
 * La ligne de l'examinateur (« Examinateur : … ») n'est pas touchée.
 */
export function createStageDirectionFilter({ speakers = [] }: { speakers?: readonly string[] } = {}) {
  const names = [...speakers.map((name) => name.trim()).filter(Boolean).map(escapeRegExp), GENERIC_SPEAKERS];
  const LEADING_LABEL = new RegExp(`^\\s*(?:${names.join("|")})\\s*[:：]\\s*`, "i");
  const CLOSERS: Record<string, string> = { "*": "*", "(": ")", "[": "]" };
  let buffer = "";
  let closer: string | null = null;
  let head = "";
  let headDone = false;
  let started = false;
  // Un blanc n'est écrit qu'avec le mot qui le suit : il peut encore tomber
  // devant un point, ou être le dernier caractère de la réponse.
  let pendingSpace = false;

  /** Retire les didascalies ; garde la fin du texte si elle peut encore ouvrir du gras. */
  function strip(final: boolean): string {
    let output = "";
    let index = 0;
    while (index < buffer.length) {
      const char = buffer[index];
      if (closer) {
        if (char === closer) closer = null;
        index += 1;
        continue;
      }
      if (char === "*") {
        if (index + 1 >= buffer.length && !final) break;
        if (buffer[index + 1] === "*") { index += 2; continue; }
      }
      if (char in CLOSERS) {
        closer = CLOSERS[char];
        index += 1;
        continue;
      }
      // Un seul espace entre deux mots, même là où une didascalie a été retirée.
      if (/\s/.test(char)) {
        pendingSpace = started;
        index += 1;
        continue;
      }
      // « J’ai mal (soupire). » : pas d'espace laissé devant le point ou la virgule.
      if (pendingSpace && char !== "." && char !== ",") output += " ";
      pendingSpace = false;
      output += char;
      started = true;
      index += 1;
    }
    buffer = final ? "" : buffer.slice(index);
    if (final) closer = null;
    return output;
  }

  function release(text: string, final: boolean): string {
    if (headDone) return text;
    head += text;
    const decided = final || head.length >= LEADING_LABEL_WINDOW || /[:：\n]/.test(head);
    if (!decided) return "";
    headDone = true;
    const out = head.replace(LEADING_LABEL, "");
    head = "";
    // Tout le début était le nom : la réponse repart sans blanc en tête.
    if (!out) { started = false; pendingSpace = false; }
    return out;
  }

  return {
    push: (text: string) => { buffer += text; return release(strip(false), false); },
    flush: () => release(strip(true), true),
  };
}

/** En deçà, une première phrase (« Oui. ») attend la suivante : trop courte pour valoir un envoi à part. */
const FIRST_SEGMENT_MIN_CHARACTERS = 20;

/**
 * Fin de phrase suivie d'un blanc. Guillemets et parenthèse fermante suivent
 * la phrase, y compris après l'espace de la typographie française (« … »).
 */
const SENTENCE_END = /[.!?…]+(?:[\s\u00a0\u202f]*["»”’)])*(?=\s)/g;

/**
 * Découpe une réplique en au plus deux morceaux à dire à voix haute : la
 * première phrase dès qu'elle est complète, pour que le patient commence à
 * parler pendant que la suite s'écrit, puis tout le reste à la fin. Une
 * réplique que `mute` désigne (ligne de l'examinateur) n'est jamais dite.
 */
export function createSpeechSegmenter({
  minFirst = FIRST_SEGMENT_MIN_CHARACTERS,
  mute = () => false,
}: { minFirst?: number; mute?: (text: string) => boolean } = {}) {
  let buffer = "";
  let firstSent = false;
  let muted = false;

  return {
    push(text: string): string[] {
      buffer += text;
      if (firstSent || muted) return [];
      for (const match of buffer.matchAll(SENTENCE_END)) {
        const end = (match.index ?? 0) + match[0].length;
        const segment = buffer.slice(0, end).trim();
        if (segment.length < minFirst) continue;
        buffer = buffer.slice(end);
        firstSent = true;
        if (mute(segment)) { muted = true; return []; }
        return [segment];
      }
      return [];
    },
    flush(): string[] {
      const rest = buffer.trim();
      buffer = "";
      if (muted || !rest) return [];
      if (!firstSent && mute(rest)) { muted = true; return []; }
      firstSent = true;
      return [rest];
    },
  };
}

/**
 * Lit un flux « server-sent events » morceau par morceau et rend le contenu
 * des champs `data` de chaque événement complet. Commentaires (`:`) et autres
 * champs (`event:`, `id:`) sont ignorés.
 */
export function createSseParser() {
  let buffer = "";
  let data: string[] = [];

  function consume(lines: string[]): string[] {
    const events: string[] = [];
    for (const line of lines) {
      if (line === "") {
        if (data.length) events.push(data.join("\n"));
        data = [];
      } else if (line.startsWith("data:")) {
        data.push(line.slice(5).replace(/^ /, ""));
      }
    }
    return events;
  }

  return {
    push(text: string): string[] {
      buffer += text;
      const lines = buffer.split(/\r\n|\r|\n/);
      buffer = lines.pop() ?? "";
      return consume(lines);
    },
    flush(): string[] {
      const lines = buffer ? [buffer, ""] : [""];
      buffer = "";
      return consume(lines);
    },
  };
}
