import { EXAMINER_PREFIX } from "@/lib/ecos/text";

/**
 * Un court silence (WAV 8 bits, 8 kHz). Le jouer pendant un clic autorise
 * ensuite le même lecteur à lire les répliques sans nouveau geste : Safari
 * refuse sinon un son déclenché après une requête réseau.
 */
function silentAudioUrl() {
  const samples = 400;
  const bytes = new Uint8Array(44 + samples).fill(0x80);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  ascii(0, "RIFF"); view.setUint32(4, 36 + samples, true); ascii(8, "WAVEfmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 8_000, true); view.setUint32(28, 8_000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  ascii(36, "data"); view.setUint32(40, samples, true);
  return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
}

/** MP3 reçu en base64 dans le flux de réponse. */
export function base64AudioBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: "audio/mpeg" });
}

export type PatientVoiceCallbacks = {
  /** Le patient parle ou va parler : le micro de la conversation reste fermé. */
  onSpeakingChange: (speaking: boolean) => void;
  /** Premier son audible d'une réplique (mesure du délai). */
  onAudible?: () => void;
};

/** Un morceau de réplique : son MP3 s'il existe, sinon la voix du navigateur lit le texte. */
type Item = { text: string; url: string | null };

/**
 * Voix du patient. Une réplique arrive en morceaux (la première phrase
 * d'abord) : chacun est joué dès qu'il arrive, dans l'ordre. La voix réaliste
 * et celle du navigateur peuvent se relayer dans une même réplique, si un
 * morceau n'a pas pu être synthétisé ou lu.
 *
 * Chaque réplique porte un numéro (`begin`) : un morceau arrivé en retard
 * pour une réplique interrompue est ignoré.
 */
export class PatientVoicePlayer {
  /** Passe à false quand la voix réaliste est indisponible (non configurée, clé refusée). */
  serverVoice = true;

  private readonly callbacks: PatientVoiceCallbacks;
  private audio: HTMLAudioElement | null = null;
  private queue: Item[] = [];
  private current: Item | null = null;
  private reply = 0;
  private open = false;
  private speaking = false;
  private audible = false;
  // Garde une référence : sans elle, Chrome peut perdre la fin de lecture.
  private utterance: SpeechSynthesisUtterance | null = null;

  constructor(callbacks: PatientVoiceCallbacks) {
    this.callbacks = callbacks;
  }

  /** À appeler pendant un clic : crée le lecteur et l'autorise à jouer ensuite. */
  unlock() {
    if (this.audio) return;
    const audio = new Audio();
    audio.onplaying = () => { if (this.current?.url) this.reportAudible(); };
    audio.onended = () => { if (this.current?.url) this.next(this.reply); };
    // MP3 illisible : ce morceau est dit par la voix du navigateur.
    audio.onerror = () => {
      const item = this.current;
      if (!item?.url) return;
      URL.revokeObjectURL(item.url);
      item.url = null;
      this.speakText(item.text, this.reply);
    };
    this.audio = audio;
    const silence = silentAudioUrl();
    audio.src = silence;
    void audio.play().catch(() => undefined).finally(() => URL.revokeObjectURL(silence));
  }

  /**
   * Nouvelle réplique : coupe la précédente et rend son numéro. `hold` garde
   * l'état « parle » pendant que la voix se prépare.
   */
  begin({ hold = false }: { hold?: boolean } = {}): number {
    this.stop();
    this.open = true;
    this.audible = false;
    if (hold) this.setSpeaking(true);
    return this.reply;
  }

  pushAudio(reply: number, audio: Blob, text: string) {
    if (reply !== this.reply || !this.open) return;
    this.enqueue({ text, url: URL.createObjectURL(audio) });
  }

  pushText(reply: number, text: string) {
    const clean = text.trim();
    if (reply !== this.reply || !this.open || !clean || clean.startsWith(EXAMINER_PREFIX)) return;
    this.enqueue({ text: clean, url: null });
  }

  /** Plus aucun morceau pour cette réplique : le patient se tait à la fin du dernier. */
  end(reply: number) {
    if (reply !== this.reply) return;
    this.open = false;
    if (!this.current && !this.queue.length) this.setSpeaking(false);
  }

  stop() {
    this.reply += 1;
    for (const item of this.queue) if (item.url) URL.revokeObjectURL(item.url);
    this.queue = [];
    if (this.current?.url) {
      this.audio?.pause();
      URL.revokeObjectURL(this.current.url);
    }
    this.current = null;
    this.utterance = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    this.open = false;
    this.setSpeaking(false);
  }

  private enqueue(item: Item) {
    this.queue.push(item);
    this.setSpeaking(true);
    if (!this.current) this.next(this.reply);
  }

  private next(reply: number) {
    if (reply !== this.reply) return;
    if (this.current?.url) URL.revokeObjectURL(this.current.url);
    this.utterance = null;
    const item = this.queue.shift() ?? null;
    this.current = item;
    if (!item) {
      if (!this.open) this.setSpeaking(false);
      return;
    }
    if (item.url && this.audio) {
      this.audio.src = item.url;
      // Lecture refusée par le navigateur : la voix du navigateur prend le relais.
      void this.audio.play().catch(() => {
        if (reply !== this.reply || this.current !== item || !item.url) return;
        URL.revokeObjectURL(item.url);
        item.url = null;
        this.speakText(item.text, reply);
      });
      return;
    }
    this.speakText(item.text, reply);
  }

  private speakText(text: string, reply: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { this.next(reply); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.96;
    const frenchVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("fr"));
    if (frenchVoice) utterance.voice = frenchVoice;
    utterance.onstart = () => { if (reply === this.reply) this.reportAudible(); };
    utterance.onend = () => this.next(reply);
    utterance.onerror = () => this.next(reply);
    this.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  private reportAudible() {
    if (this.audible) return;
    this.audible = true;
    this.callbacks.onAudible?.();
  }

  private setSpeaking(active: boolean) {
    if (this.speaking === active) return;
    this.speaking = active;
    this.callbacks.onSpeakingChange(active);
  }
}
