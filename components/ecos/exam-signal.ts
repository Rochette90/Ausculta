/**
 * Signal sonore du mode examen : un bip pour « il reste 2 minutes », deux
 * bips plus graves pour la fin. Le contexte audio est créé au clic qui lance
 * la station (les navigateurs refusent le son sans geste de l'utilisateur).
 */
export function playExamSignal(context: AudioContext | null, kind: "warning" | "end") {
  if (!context) return;
  if (context.state === "suspended") void context.resume().catch(() => undefined);
  const tones = kind === "warning" ? [{ at: 0, frequency: 880 }] : [{ at: 0, frequency: 660 }, { at: 0.45, frequency: 520 }];
  for (const { at, frequency } of tones) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    const start = context.currentTime + at;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.4);
  }
}
