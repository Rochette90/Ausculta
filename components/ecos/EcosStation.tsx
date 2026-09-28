"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, SendHorizontal, Square } from "lucide-react";
import { calculateEcosCriteria, type EcosCriterion, type EcosMessage } from "@/app/lib/ecos";
import type { ClinicalCaseSummary } from "@/lib/ecos/cases";
import { BRAND_NAME, BRAND_NAME_UPPER } from "@/lib/brand";

import { ECOS_DURATION_SECONDS, remainingSeconds } from "@/lib/ecos/timing";

type Screen = "briefing" | "station" | "report";

const TOTAL_SECONDS = ECOS_DURATION_SECONDS;

const quickActions = [
  { label: "Constantes", prompt: "Je relève les constantes vitales du patient." },
  { label: "ECG", prompt: "Je demande un ECG 12 dérivations immédiatement." },
  { label: "Auscultation", prompt: "Je réalise une auscultation cardiaque et pulmonaire." },
];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function EcosStation({ clinicalCase }: { clinicalCase: ClinicalCaseSummary }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("briefing");
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [messages, setMessages] = useState<EcosMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [mode, setMode] = useState<"training" | "exam">("training");
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stationError, setStationError] = useState<string | null>(null);
  const [savedCriteria, setSavedCriteria] = useState<EcosCriterion[] | null>(null);
  const deadline = useRef(0);
  const startLock = useRef(false);
  const finishLock = useRef(false);
  const messageLock = useRef(false);
  const pendingMessage = useRef<Promise<void> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [awardedXp, setAwardedXp] = useState<number | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const criteria = useMemo(() => savedCriteria ?? calculateEcosCriteria(messages), [messages, savedCriteria]);
  const score = criteria.reduce((total, criterion) => total + criterion.earned, 0);
  const maxScore = criteria.reduce((total, criterion) => total + criterion.points, 0);
  const percent = Math.round((score / maxScore) * 100);
  const patientInitials = (clinicalCase.patientLabel ?? "Patient simulé")
    .split(/\s+/).filter((part) => /^[A-ZÀ-Ý]/.test(part)).slice(0, 2).map((part) => part[0]).join("") || "PT";

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.96;
    const frenchVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("fr"));
    if (frenchVoice) utterance.voice = frenchVoice;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  async function startStation() {
    if (startLock.current) return;
    startLock.current = true;
    finishLock.current = false;
    setStarting(true);
    setStationError(null);
    setSavedCriteria(null);
    setAwardedXp(null);
    try {
      const response = await fetch("/api/ecos/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stationSlug: clinicalCase.slug }), signal: AbortSignal.timeout(20_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "La station n’a pas pu démarrer.");
      setSessionId(data.sessionId);
      deadline.current = Date.now() + TOTAL_SECONDS * 1_000;
      setSecondsLeft(TOTAL_SECONDS);
      const firstMessage: EcosMessage = { role: "patient", content: data.initialMessage };
      setMessages([firstMessage]);
      setScreen("station");
      speak(firstMessage.content);
    } catch {
      setSessionId(null);
      setStationError("La station n’a pas pu démarrer. Vérifie ta connexion puis réessaie.");
    } finally { startLock.current = false; setStarting(false); }
  }

  async function sendMessage(content: string) {
    const clean = content.trim();
    if (!clean || clean.length > 800 || messageLock.current || finishLock.current || !sessionId || screen !== "station" || secondsLeft === 0) return;
    messageLock.current = true;
    setLoading(true);
    setInput("");
    const task = (async () => {
      try {
        const response = await fetch("/api/ecos/chat", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: clean, sessionId }), signal: AbortSignal.timeout(25_000),
        });
        if (!response.ok) throw new Error("Patient indisponible");
        const data = (await response.json()) as { reply: string };
        setMessages((current) => [...current, { role: "student", content: clean }, { role: "patient", content: data.reply }]);
        if (!finishLock.current) speak(data.reply);
      } catch {
        setInput(clean);
        setMessages((current) => [...current, { role: "system", content: "Réponse non reçue. Ta question est conservée dans le champ de saisie. Le bilan final utilisera les échanges enregistrés par le serveur." }]);
      } finally { messageLock.current = false; setLoading(false); }
    })();
    pendingMessage.current = task;
    await task;
    pendingMessage.current = null;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function startListening() {
    if (recognitionRef.current) { recognitionRef.current.abort(); recognitionRef.current = null; setListening(false); return; }
    if (loading || finishLock.current || screen !== "station") return;
    const BrowserRecognition = (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition; SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!BrowserRecognition) {
      setMessages((current) => [...current, { role: "system", content: "La dictée vocale n’est pas disponible dans ce navigateur. Tu peux écrire ta question." }]);
      return;
    }
    const recognition = new BrowserRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => { recognitionRef.current = null; setListening(false); };
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput(transcript);
      if (transcript) void sendMessage(transcript);
    };
    try { recognition.start(); } catch { recognitionRef.current = null; setListening(false); }
  }

  const finishStation = useCallback(async () => {
    if (finishLock.current || !sessionId) return;
    finishLock.current = true;
    setSaving(true);
    setStationError(null);
    setScreen("report");
    window.speechSynthesis?.cancel();
    recognitionRef.current?.abort();
    try {
      // Finish a pending exchange before asking the server to grade its transcript.
      await pendingMessage.current;
      const response = await fetch(`/api/ecos/session/${sessionId}`, { method: "POST", signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw new Error("Sauvegarde indisponible");
      const data = (await response.json()) as { xp: number; criteria: EcosCriterion[] };
      setAwardedXp(data.xp);
      setSavedCriteria(data.criteria);
      router.refresh();
    } catch {
      setStationError("Le bilan n’a pas pu être enregistré. Réessaie la sauvegarde avant de quitter la page.");
    } finally { finishLock.current = false; setSaving(false); }
  }, [sessionId, router]);

  useEffect(() => {
    if (screen !== "station") return;
    const tick = () => {
      const remaining = remainingSeconds(deadline.current, Date.now());
      setSecondsLeft(remaining);
      if (remaining === 0) void finishStation();
    };
    const timer = window.setInterval(tick, 250);
    const warnOnLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warnOnLeave);
    return () => { window.clearInterval(timer); window.removeEventListener("beforeunload", warnOnLeave); };
  }, [screen, finishStation]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); recognitionRef.current?.abort(); }, []);

  function replay() {
    setSavedCriteria(null);
    setStationError(null);
    finishLock.current = false;
    setMessages([]);
    setSessionId(null);
    setSecondsLeft(TOTAL_SECONDS);
    setAwardedXp(null);
    setScreen("briefing");
  }

  function backToCatalog() {
    window.speechSynthesis?.cancel();
    router.push("/cas");
  }

  return (
    <main className="page-enter mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      {stationError && <div role="alert" className="learning-notice">{stationError}{screen === "report" && <button className="button secondary ml-3" disabled={saving} onClick={() => void finishStation()}>Réessayer la sauvegarde</button>}</div>}
      {saving && <p role="status" className="learning-notice">Enregistrement et calcul du bilan…</p>}
      {screen === "briefing" && (
        <div className="briefing-page page-enter">
          <button className="back-link" onClick={backToCatalog}>← Tous les cas cliniques</button>
          <div className="briefing-grid">
            <section>
              <p className="eyebrow">STATION ECOS{clinicalCase.specialty ? ` · ${clinicalCase.specialty.toUpperCase()}` : ""}</p>
              <h1>{clinicalCase.candidateTitle}</h1>
              <p className="lead">{clinicalCase.setting ?? "Station d’anamnèse et de prise en charge initiale."}</p>
              <div className="instruction-card">
                <div className="paper-label">CONSIGNE AU CANDIDAT</div>
                <p>Vous êtes médecin assistant·e au service des urgences du CHUV.</p>
                <p><strong>{clinicalCase.patientLabel ?? "Le patient"} se présente pour le motif suivant : {clinicalCase.candidateTitle}.</strong></p>
                <p>Vous devez réaliser une anamnèse ciblée, identifier les éléments de gravité et proposer votre prise en charge initiale.</p>
                <p className="muted">Vous ne devez pas réaliser d’examen physique réel. Décrivez les gestes que vous souhaitez effectuer.</p>
              </div>
              <fieldset className="ecos-mode-options"><legend>Choisis tes conditions</legend><label htmlFor="ecos-training" aria-label="Mode entraînement"><input id="ecos-training" type="radio" name="ecos-mode" checked={mode === "training"} onChange={() => setMode("training")} /><span><strong>Entraînement</strong><small>Repères de progression et actions rapides visibles.</small></span></label><label htmlFor="ecos-exam" aria-label="Mode examen"><input id="ecos-exam" type="radio" name="ecos-mode" checked={mode === "exam"} onChange={() => setMode("exam")} /><span><strong>Examen</strong><small>8 minutes, sans indices ni score pendant l’entretien.</small></span></label></fieldset>
            </section>
            <aside className="brief-aside">
              <div className="patient-portrait"><span>{patientInitials}</span><i /></div>
              <h2>{clinicalCase.patientLabel ?? "Patient simulé"}</h2>
              <p>Patient simulé interactif</p>
              <div className="station-facts"><div><strong>{clinicalCase.duration ?? "08:00"}</strong><span>Temps disponible</span></div><div><strong>18</strong><span>Points possibles</span></div></div>
              <ul>
                <li>Microphone recommandé</li>
                <li>Réponses vocales en français</li>
                <li>Échanges enregistrés pour le bilan</li>
              </ul>
              <button className="button primary full" disabled={starting} onClick={startStation}>{starting ? "Préparation de la station…" : "Démarrer la station"}<span aria-hidden="true"> →</span></button>
              <small>Le chronomètre démarre lorsque le patient est prêt.</small>
            </aside>
          </div>
        </div>
      )}

      {screen === "station" && (
        <div className="station-page page-enter">
          <section className="station-header">
            <div><p className="eyebrow">STATION EN COURS</p><h1>{clinicalCase.candidateTitle}</h1></div>
            <div className={`timer ${secondsLeft < 90 ? "timer-alert" : ""}`} role="timer" aria-live="off"><span>Temps restant</span><strong>{formatTime(secondsLeft)}</strong></div>
            <button className="button danger-ghost" disabled={loading || saving} onClick={() => void finishStation()}>Terminer</button>
          </section>

          <div className={`consultation-grid${mode === "exam" ? " ecos-exam" : ""}`}>
            <aside className="patient-panel">
              <div className="patient-portrait large"><span>{patientInitials}</span><i className={loading ? "speaking" : ""} /></div>
              <h2>{clinicalCase.patientLabel ?? "Patient simulé"}</h2>
              <div className="patient-status"><span className={loading ? "status-dot active" : "status-dot"} />{loading ? "Réfléchit…" : listening ? "Vous écoute…" : "En consultation"}</div>
              <button className="voice-toggle" onClick={() => { if (voiceEnabled) window.speechSynthesis?.cancel(); setVoiceEnabled((value) => !value); }} aria-pressed={voiceEnabled}>{voiceEnabled ? "Voix activée" : "Voix désactivée"}</button>
              <div className="privacy-note">Les échanges de cette simulation sont réservés à ton entraînement.</div>
            </aside>

            <section className="conversation-panel">
              <div className="transcript" ref={transcriptRef} aria-live="polite">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
                    <span>{message.role === "patient" ? "Patient" : message.role === "student" ? "Vous" : BRAND_NAME}</span>
                    <p>{message.content}</p>
                  </div>
                ))}
                {loading && <div className="message patient loading-message"><span>Patient</span><p><i /><i /><i /></p></div>}
              </div>
              {mode === "training" && <div className="quick-actions" aria-label="Actions cliniques rapides">
                {quickActions.map((action) => <button key={action.label} disabled={loading} onClick={() => void sendMessage(action.prompt)}>+ {action.label}</button>)}
              </div>}
              <form className="composer" onSubmit={submit}>
                <button
                  type="button"
                  className={`mic-button ${listening ? "recording" : ""}`}
                  disabled={loading}
                  onClick={startListening}
                  aria-pressed={listening}
                  aria-label={listening ? "Arrêter l’enregistrement vocal" : "Dicter une question au patient"}
                  title={listening ? "Enregistrement en cours…" : "Dicter ta question"}
                >
                  {listening ? <Square aria-hidden="true" size={16} /> : <Mic aria-hidden="true" size={18} />}
                </button>
                <input
                  maxLength={800}
                  disabled={loading}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={listening ? "Je vous écoute…" : "Pose ta question au patient…"}
                  aria-label="Question au patient"
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={!input.trim() || loading}
                  aria-label="Envoyer la question"
                  title="Envoyer"
                >
                  <SendHorizontal aria-hidden="true" size={18} />
                </button>
              </form>
              <p className="composer-hint">Appuie sur le micro pour parler, ou écris ta question.</p>
            </section>

            {mode === "training" && <aside className="objectives-panel">
              <p className="eyebrow">VOTRE PROGRESSION</p>
              <h2>Objectifs observés</h2>
              <div className="live-score"><strong>{score}</strong><span>/ {maxScore} points repérés</span></div>
              <div className="criteria-mini-list">
                {criteria.slice(0, 5).map((criterion) => <div key={criterion.id}><span className={criterion.earned > 0 ? "checked" : ""}>{criterion.earned > 0 ? "✓" : "·"}</span><p>{criterion.label}</p></div>)}
              </div>
              <p className="objectives-note">Repérage automatique par mots-clés : indicatif, sans validation de la pertinence clinique.</p>
            </aside>}
          </div>
        </div>
      )}

      {screen === "report" && (
        <div className="report-page page-enter">
          <button className="back-link" onClick={backToCatalog}>← Tous les cas cliniques</button>
          <section className="report-hero">
            <div className="score-ring" style={{ "--score": `${percent * 3.6}deg` } as React.CSSProperties}><div><strong>{percent}%</strong><span>{score}/{maxScore} points</span></div></div>
            <div>
              <p className="eyebrow">{savedCriteria ? "BILAN ENREGISTRÉ" : "STATION TERMINÉE · ESTIMATION LOCALE"}</p>
              <h1>{percent >= 70 ? "Des repères bien couverts." : "Une bonne base à consolider."}</h1>
              <p className="lead">Ce bilan repère les thèmes abordés dans tes échanges. Il ne vérifie pas à lui seul la pertinence des décisions cliniques.</p>
              {awardedXp !== null && <div className="report-tags"><span>+{awardedXp} XP</span><span>Bilan enregistré</span></div>}
            </div>
          </section>
          <section className="report-grid">
            <div className="rubric-card">
              <div className="section-heading"><div><p className="eyebrow">GRILLE ECOS</p><h2>Analyse par compétence</h2></div><strong>{score}/{maxScore}</strong></div>
              {criteria.map((criterion) => (
                <div className="rubric-row" key={criterion.id}>
                  <span className={criterion.earned === criterion.points ? "criterion-icon success" : criterion.earned > 0 ? "criterion-icon partial" : "criterion-icon"}>{criterion.earned === criterion.points ? "✓" : criterion.earned > 0 ? "~" : "!"}</span>
                  <div><strong>{criterion.label}</strong><p>{criterion.earned === criterion.points ? "Objectif couvert dans ton entretien." : criterion.hint}</p></div>
                  <b>{criterion.earned}/{criterion.points}</b>
                </div>
              ))}
            </div>
            <aside className="feedback-card">
              <p className="eyebrow">COACH {BRAND_NAME_UPPER}</p><h2>À retenir</h2>
              <div className="feedback good"><span>+</span><p><strong>Thème couvert</strong>{criteria.find((criterion) => criterion.earned === criterion.points)?.label ?? "Aucun thème complètement repéré pour le moment."}</p></div>
              <div className="feedback improve"><span>↗</span><p><strong>À améliorer</strong>{criteria.filter((criterion) => criterion.earned < criterion.points)[0]?.hint ?? "Poursuis cette approche structurée."}</p></div>
              {clinicalCase.diagnosis && <div className="feedback good"><span>Dx</span><p><strong>Diagnostic du cas</strong>{clinicalCase.diagnosis}</p></div>}
              <button className="button primary full" disabled={saving || Boolean(stationError)} onClick={replay}>Rejouer la station</button>
              <button className="button secondary full" onClick={backToCatalog}>Continuer l’entraînement</button>
            </aside>
          </section>
          <p className="medical-disclaimer">Simulation pédagogique. Cette évaluation ne constitue pas une certification clinique.</p>
        </div>
      )}
    </main>
  );
}

declare global {
  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    onresult: ((event: { results: ArrayLike<{ [index: number]: { transcript: string } }> }) => void) | null;
    start(): void;
    abort(): void;
  }
}
