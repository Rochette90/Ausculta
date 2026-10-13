"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GRID_DURATION_SECONDS, GRID_WARNING_SECONDS } from "@/lib/grids/scoring";
import { cn } from "@/lib/utils";

type TimerStatus = "ready" | "running" | "paused" | "done";

const statusLabels: Record<TimerStatus, string> = { ready: "Prêt", running: "En cours", paused: "Pause", done: "Terminé" };

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.95;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith("fr"));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

/** Sonnerie synthétisée : trois notes descendantes, ou cinq alternées pour la fin. */
function ring(final: boolean) {
  const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const now = context.currentTime;
  const notes = final ? [0, 0.3, 0.6, 0.9, 1.2] : [0, 0.5, 1];
  notes.forEach((delay, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const length = final ? 0.3 : 0.5;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(final ? (index % 2 === 0 ? 1046 : 880) : 880, now + delay);
    if (!final) oscillator.frequency.exponentialRampToValueAtTime(660, now + delay + 0.4);
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(0.35, now + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + length);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + length + 0.05);
  });
  window.setTimeout(() => void context.close(), 2500);
}

const format = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

/** Chrono de station : annonce vocale au départ, sonnerie à deux minutes, signal de fin. */
export function GridTimer() {
  const [remaining, setRemaining] = useState(GRID_DURATION_SECONDS);
  const [status, setStatus] = useState<TimerStatus>("ready");
  const warned = useRef(false);

  useEffect(() => {
    if (status !== "running") return;
    const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== "running") return;
    if (remaining === GRID_WARNING_SECONDS && !warned.current) {
      warned.current = true;
      ring(false);
      speak("Attention, il vous reste deux minutes.");
    }
    if (remaining === 0) {
      ring(true);
      speak("Fin de la station.");
      // Le chrono s'arrête de lui-même ; l'état suit le temps écoulé.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("done");
    }
  }, [remaining, status]);

  function toggle() {
    if (status === "running") return setStatus("paused");
    if (status === "done") return;
    if (status === "ready") speak("Début de la station.");
    setStatus("running");
  }

  function reset() {
    warned.current = false;
    setRemaining(GRID_DURATION_SECONDS);
    setStatus("ready");
  }

  const warning = remaining <= GRID_WARNING_SECONDS && status !== "ready";

  return (
    <div className={cn("grid-timer", status === "running" && "is-running", warning && "is-warning")} role="timer" aria-live="off">
      <div>
        <span className="grid-timer-time">{format(remaining)}</span>
        <span className="grid-timer-status">{statusLabels[status]}</span>
      </div>
      <div className="grid-timer-actions">
        <button className="button primary small" disabled={status === "done"} onClick={toggle} type="button">
          {status === "running" ? <><Pause aria-hidden="true" size={16} /> Pause</> : <><Play aria-hidden="true" size={16} /> {status === "ready" ? "Démarrer" : "Reprendre"}</>}
        </button>
        <button aria-label="Remettre le chrono à 13 minutes" className="button quiet small" onClick={reset} type="button">
          <RotateCcw aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
}
