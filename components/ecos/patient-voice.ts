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
  /** Second lecteur : il précharge le morceau suivant pendant la lecture (double tampon). */
  private standby: HTMLAudioElement | null = null;
  private standbyUrl: string | null = null;
  private queue: Item[] = [];
  private current: Item | null = null;
  private reply = 0;
  private open = false;
  private speaking = false;
  private audible = false;
  /** Fin de lecture jamais signalée : ce garde-fou, proportionné au texte, passe au morceau suivant. */
  private itemTimer: number | undefined = undefined;
  // Garde une référence : sans elle, Chrome peut perdre la fin de lecture.
  private utterance: SpeechSynthesisUtterance | null = null;
  /** Voix du navigateur connues ; `getVoices()` est souvent vide au premier appel (Chrome). */
  private voices: SpeechSynthesisVoice[] = [];
  private voicesHooked = false;

  constructor(callbacks: PatientVoiceCallbacks) {
    this.callbacks = callbacks;
  }

  /** Un lecteur audio dont les événements ne comptent que s'il est le lecteur actif. */
  private createPlayer(): HTMLAudioElement {
    const audio = new Audio();
    audio.onplaying = () => { if (audio === this.audio && this.current?.url) this.reportAudible(); };
    audio.onended = () => { if (audio === this.audio && this.current?.url) this.next(this.reply); };
    // MP3 illisible : ce morceau est dit par la voix du navigateur.
    audio.onerror = () => {
      const item = this.current;
      if (audio !== this.audio || !item?.url) return;
      URL.revokeObjectURL(item.url);
      item.url = null;
      this.speakText(item.text, this.reply);
    };
    return audio;
  }

  /** À appeler pendant un clic : crée les lecteurs et les autorise à jouer ensuite. */
  unlock() {
    this.hookVoices();
    if (this.audio) return;
    this.audio = this.createPlayer();
    this.standby = this.createPlayer();
    const silence = silentAudioUrl();
    for (const player of [this.audio, this.standby]) {
      player.src = silence;
      void player.play().catch(() => undefined);
    }
    window.setTimeout(() => URL.revokeObjectURL(silence), 1_000);
  }

  /** Mémorise les voix du navigateur dès qu'elles sont connues (chargement asynchrone sous Chrome). */
  private hookVoices() {
    if (this.voicesHooked || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.voicesHooked = true;
    const update = () => { this.voices = window.speechSynthesis.getVoices(); };
    update();
    window.speechSynthesis.addEventListener?.("voiceschanged", update);
  }

  private frenchVoice(): SpeechSynthesisVoice | undefined {
    const known = this.voices.length ? this.voices : window.speechSynthesis.getVoices();
    return known.find((voice) => voice.lang.toLowerCase().startsWith("fr"));
  }

  /** Précharge le prochain morceau MP3 sur le lecteur en attente, pendant la lecture en cours. */
  private preloadNext() {
    const upcoming = this.queue[0];
    if (!upcoming?.url || !this.standby || this.standbyUrl === upcoming.url) return;
    this.standbyUrl = upcoming.url;
    this.standby.src = upcoming.url;
    this.standby.preload = "auto";
    this.standby.load();
  }

  /** Arme le garde-fou du morceau en cours : durée estimée du texte, plus une marge. */
  private armItemWatchdog(item: Item, reply: number) {
    this.clearItemWatchdog();
    const estimatedMs = Math.min(60_000, 5_000 + item.text.length * 120);
    this.itemTimer = window.setTimeout(() => {
      if (reply === this.reply && this.current === item) this.next(reply);
    }, estimatedMs);
  }

  private clearItemWatchdog() {
    if (this.itemTimer !== undefined) window.clearTimeout(this.itemTimer);
    this.itemTimer = undefined;
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
    this.clearItemWatchdog();
    for (const item of this.queue) if (item.url) URL.revokeObjectURL(item.url);
    this.queue = [];
    if (this.current?.url) {
      this.audio?.pause();
      URL.revokeObjectURL(this.current.url);
    }
    this.current = null;
    this.standbyUrl = null;
    this.standby?.pause();
    this.utterance = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    this.open = false;
    this.setSpeaking(false);
  }

  private enqueue(item: Item) {
    this.queue.push(item);
    this.setSpeaking(true);
    if (!this.current) this.next(this.reply);
    else this.preloadNext();
  }

  private next(reply: number) {
    if (reply !== this.reply) return;
    this.clearItemWatchdog();
    if (this.current?.url) URL.revokeObjectURL(this.current.url);
    this.utterance = null;
    const item = this.queue.shift() ?? null;
    this.current = item;
    if (!item) {
      if (!this.open) this.setSpeaking(false);
      return;
    }
    if (item.url && this.audio) {
      // Morceau déjà préchargé : les deux lecteurs échangent leurs rôles.
      if (this.standby && this.standbyUrl === item.url) {
        const previous = this.audio;
        this.audio = this.standby;
        this.standby = previous;
        this.standbyUrl = null;
        previous.pause();
      } else {
        this.audio.src = item.url;
      }
      this.armItemWatchdog(item, reply);
      // Lecture refusée par le navigateur : la voix du navigateur prend le relais.
      void this.audio.play().catch(() => {
        if (reply !== this.reply || this.current !== item || !item.url) return;
        URL.revokeObjectURL(item.url);
        item.url = null;
        this.speakText(item.text, reply);
      });
      this.preloadNext();
      return;
    }
    this.speakText(item.text, reply);
  }

  private speakText(text: string, reply: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { this.next(reply); return; }
    this.hookVoices();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.96;
    const frenchVoice = this.frenchVoice();
    if (frenchVoice) utterance.voice = frenchVoice;
    utterance.onstart = () => { if (reply === this.reply) this.reportAudible(); };
    utterance.onend = () => this.next(reply);
    utterance.onerror = () => this.next(reply);
    this.utterance = utterance;
    if (this.current) this.armItemWatchdog(this.current, reply);
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
