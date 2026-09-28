"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Mic, SendHorizontal, Square } from "lucide-react";
import { calculateEcosCriteria } from "@/lib/ecos/scoring";
import { EXAMINER_PREFIX, isExamTransition, PROCEDURE_PREFIX } from "@/lib/ecos/text";
import type { EcosCriterion, EcosCriterionDefinition, EcosMessage, EcosMode, EcosProcedureCategory, EcosStationView } from "@/lib/ecos/types";
import type { EcosDebriefView } from "@/lib/ecos/debrief";
import { BRAND_NAME, BRAND_NAME_UPPER } from "@/lib/brand";
import { remainingSeconds } from "@/lib/ecos/timing";

type Screen = "briefing" | "station" | "report";
type Phase = "anamnese" | "examen" | "synthese";

type CompletionResponse = {
  xp: number;
  score: number;
  maxScore: number;
  criteria: EcosCriterion[];
  synthesis?: { chosen: string | null; correct: string };
  procedures?: { missed: string[]; unhelpful: string[] };
  debrief?: EcosDebriefView;
};

const SETTING_LABEL = { urgences: "Urgences", cabinet: "Cabinet" } as const;

const PHASES: Array<{ id: Phase; label: string }> = [
  { id: "anamnese", label: "Anamnèse" },
  { id: "examen", label: "Examen clinique" },
  { id: "synthese", label: "Synthèse" },
];

const PROCEDURE_QUESTIONS: Array<{ category: EcosProcedureCategory; question: string }> = [
  { category: "constantes", question: "Quels paramètres relèves-tu ?" },
  { category: "examen", question: "Que recherches-tu à l’examen physique ?" },
  { category: "complementaire", question: "Quels examens complémentaires demandes-tu ?" },
];

const EXAM_TRANSITION_MESSAGE = "Je vais maintenant passer à l’examen clinique.";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

/** Examiner results and gestures are stored with a prefix; show them with their own label. */
function messageView(message: EcosMessage) {
  if (message.role === "patient" && message.content.startsWith(EXAMINER_PREFIX)) {
    return { label: "Examinateur", className: "message examiner", text: message.content.slice(EXAMINER_PREFIX.length) };
  }
  if (message.role === "student" && message.content.startsWith(PROCEDURE_PREFIX)) {
    return { label: "Geste", className: "message student procedure", text: message.content.slice(PROCEDURE_PREFIX.length) };
  }
  const label = message.role === "patient" ? "Patient" : message.role === "student" ? "Vous" : BRAND_NAME;
  return { label, className: `message ${message.role}`, text: message.content };
}

/** Error text sent by the API for expected refusals (time over, synthesis started…). */
async function apiErrorMessage(response: Response, fallback: string) {
  const data = await response.json().catch(() => null) as { error?: string } | null;
  return response.status === 400 || response.status === 409 ? data?.error ?? fallback : fallback;
}

function DebriefList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="ecos-debrief-block">
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

export function EcosStation({ station }: { station: EcosStationView }) {
  const router = useRouter();
  const examSeconds = station.examDurationSeconds;
  const [screen, setScreen] = useState<Screen>("briefing");
  const [phase, setPhase] = useState<Phase>("anamnese");
  const [mode, setMode] = useState<EcosMode>("training");
  const [grid, setGrid] = useState<EcosCriterionDefinition[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(examSeconds);
  const [messages, setMessages] = useState<EcosMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stationError, setStationError] = useState<string | null>(null);
  const [performed, setPerformed] = useState<string[]>([]);
  const [pendingProcedure, setPendingProcedure] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ label: string; result: string } | null>(null);
  const [confirmingSynthesis, setConfirmingSynthesis] = useState(false);
  const [openingSynthesis, setOpeningSynthesis] = useState(false);
  const [options, setOptions] = useState<string[] | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [result, setResult] = useState<CompletionResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const deadline = useRef(0);
  const startLock = useRef(false);
  const finishLock = useRef(false);
  const messageLock = useRef(false);
  const pendingMessage = useRef<Promise<void> | null>(null);
  const pendingGesture = useRef<Promise<void> | null>(null);
  const synthesisRef = useRef({ diagnosis: "", plan: "" });
  const phaseRef = useRef<Phase>("anamnese");
  const examAnnounced = useRef(false);
  const focusOnPhase = useRef(false);
  const examHeadingRef = useRef<HTMLHeadingElement>(null);
  const synthesisHeadingRef = useRef<HTMLHeadingElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const liveCriteria = useMemo(() => calculateEcosCriteria(grid, messages), [messages, grid]);
  const criteria = result?.criteria ?? liveCriteria;
  const score = criteria.reduce((total, criterion) => total + criterion.earned, 0);
  const maxScore = result?.maxScore ?? station.maxScore;
  const percent = Math.round((score / maxScore) * 100);
  const patientInitials = station.patientLabel
    .split(/\s+/).filter((part) => /^[A-ZÀ-Ý]/.test(part)).slice(0, 2).map((part) => part[0]).join("") || "PT";
  const coveredCriterion = criteria.find((criterion) => criterion.earned === criterion.points);
  const missedCriterion = criteria.find((criterion) => criterion.earned < criterion.points);
  const timed = mode === "exam";
  const timeOver = timed && secondsLeft === 0;
  const busy = loading || saving || Boolean(pendingProcedure) || openingSynthesis;

  useEffect(() => { synthesisRef.current = { diagnosis, plan }; }, [diagnosis, plan]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Keyboard and screen-reader users land on the new step instead of the top of the page.
  useEffect(() => {
    if (!focusOnPhase.current) return;
    focusOnPhase.current = false;
    (phase === "examen" ? examHeadingRef : phase === "synthese" ? synthesisHeadingRef : null)?.current?.focus();
  }, [phase]);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || text.startsWith(EXAMINER_PREFIX) || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.96;
    const frenchVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("fr"));
    if (frenchVoice) utterance.voice = frenchVoice;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  function changePhase(next: Phase, focus = true) {
    phaseRef.current = next;
    focusOnPhase.current = focus;
    setPhase(next);
  }

  function resetStation() {
    changePhase("anamnese", false);
    examAnnounced.current = false;
    setMessages([]);
    setPerformed([]);
    setLastResult(null);
    setConfirmingSynthesis(false);
    setOptions(null);
    setOptionsError(false);
    setDiagnosis("");
    setPlan("");
    setResult(null);
    setStationError(null);
    setSecondsLeft(examSeconds);
  }

  async function startStation() {
    if (startLock.current) return;
    startLock.current = true;
    finishLock.current = false;
    setStarting(true);
    resetStation();
    try {
      const response = await fetch("/api/ecos/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ station: station.code, mode }), signal: AbortSignal.timeout(20_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "La station n’a pas pu démarrer.");
      setSessionId(data.sessionId);
      setGrid(Array.isArray(data.criteria) ? data.criteria : []);
      deadline.current = Date.now() + examSeconds * 1_000;
      const firstMessage: EcosMessage = { role: "patient", content: data.initialMessage };
      setMessages([firstMessage]);
      setScreen("station");
      speak(firstMessage.content);
    } catch {
      setSessionId(null);
      setStationError("La station n’a pas pu démarrer. Vérifie ta connexion puis réessaie.");
    } finally { startLock.current = false; setStarting(false); }
  }

  function enterExamPhase() {
    if (phaseRef.current !== "anamnese") return;
    changePhase("examen");
    if (examAnnounced.current) return;
    examAnnounced.current = true;
    setMessages((list) => [...list, { role: "system", content: "Examen clinique : choisis les gestes et les examens que tu réalises. Chaque choix débloque son résultat." }]);
  }

  async function sendMessage(content: string) {
    const clean = content.trim();
    if (!clean || clean.length > 800 || messageLock.current || finishLock.current || !sessionId || screen !== "station" || phaseRef.current === "synthese" || timeOver) return;
    messageLock.current = true;
    setLoading(true);
    setInput("");
    const task = (async () => {
      try {
        const response = await fetch("/api/ecos/chat", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: clean, sessionId }), signal: AbortSignal.timeout(25_000),
        });
        if (!response.ok) throw new Error(await apiErrorMessage(response, "Réponse non reçue. Ta question est conservée dans le champ de saisie."));
        const data = (await response.json()) as { reply: string };
        setMessages((current) => [...current, { role: "student", content: clean }, { role: "patient", content: data.reply }]);
        if (!finishLock.current) speak(data.reply);
        // « On passe à l’examen clinique » : le médecin annonce l’examen.
        if (isExamTransition(clean)) enterExamPhase();
      } catch (error) {
        setInput(clean);
        setMessages((current) => [...current, { role: "system", content: error instanceof Error && error.message ? error.message : "Réponse non reçue." }]);
      } finally {
        messageLock.current = false;
        setLoading(false);
      }
    })();
    pendingMessage.current = task;
    await task;
    pendingMessage.current = null;
  }

  async function announceExam() {
    if (phaseRef.current !== "anamnese") return;
    // Le médecin annonce l’examen au patient une seule fois ; revenir ensuite à
    // l’anamnèse puis repasser à l’examen ne répète pas l’annonce.
    if (sessionId && !loading && !examAnnounced.current) await sendMessage(EXAM_TRANSITION_MESSAGE);
    enterExamPhase();
  }

  async function performProcedure(procedureId: string) {
    if (!sessionId || busy || finishLock.current || performed.includes(procedureId) || phaseRef.current !== "examen" || timeOver) return;
    setPendingProcedure(procedureId);
    const task = (async () => {
      try {
        const response = await fetch(`/api/ecos/session/${sessionId}/procedure`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ procedureId }), signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) throw new Error(await apiErrorMessage(response, "Le résultat de ce geste n’a pas pu être obtenu. Réessaie."));
        const data = await response.json() as { label: string; result: string };
        setPerformed((current) => [...current, procedureId]);
        setLastResult({ label: data.label, result: data.result });
        setMessages((current) => [...current, { role: "student", content: `${PROCEDURE_PREFIX}${data.label}` }, { role: "patient", content: `${EXAMINER_PREFIX}${data.result}` }]);
      } catch (error) {
        setMessages((current) => [...current, { role: "system", content: error instanceof Error && error.message ? error.message : "Le résultat de ce geste n’a pas pu être obtenu." }]);
      } finally { setPendingProcedure(null); }
    })();
    pendingGesture.current = task;
    await task;
    pendingGesture.current = null;
  }

  async function openSynthesis() {
    if (!sessionId || openingSynthesis) return;
    setConfirmingSynthesis(false);
    setOpeningSynthesis(true);
    setOptionsError(false);
    changePhase("synthese");
    try {
      await pendingMessage.current;
      await pendingGesture.current;
      const response = await fetch(`/api/ecos/session/${sessionId}/synthesis`, { method: "POST", signal: AbortSignal.timeout(20_000) });
      const data = await response.json() as { options?: string[] };
      if (!response.ok || !data.options?.length) throw new Error("Options indisponibles");
      setOptions(data.options);
    } catch { setOptionsError(true); }
    finally { setOpeningSynthesis(false); }
  }

  /** Going to the synthesis closes the history and the exam: ask first. */
  function requestSynthesis() {
    if (phaseRef.current === "synthese") return;
    setConfirmingSynthesis(true);
  }

  function goToPhase(next: Phase) {
    if (phaseRef.current === "synthese" || next === phaseRef.current) return;
    if (next === "synthese") { requestSynthesis(); return; }
    if (next === "examen" && phaseRef.current === "anamnese") { void announceExam(); return; }
    changePhase(next);
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
      // Let a pending exchange or gesture reach the transcript before grading it.
      await pendingMessage.current;
      await pendingGesture.current;
      const response = await fetch(`/api/ecos/session/${sessionId}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(synthesisRef.current), signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error("Sauvegarde indisponible");
      setResult((await response.json()) as CompletionResponse);
      router.refresh();
    } catch {
      setStationError("Le bilan n’a pas pu être enregistré. Réessaie la sauvegarde avant de quitter la page.");
    } finally { finishLock.current = false; setSaving(false); }
  }, [sessionId, router]);

  useEffect(() => {
    if (screen !== "station") return;
    const warnOnLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warnOnLeave);
    // Entraînement : aucun chronomètre. Examen : 13 minutes pour toute la station.
    const timer = timed ? window.setInterval(() => {
      const remaining = remainingSeconds(deadline.current, Date.now());
      setSecondsLeft(remaining);
      if (remaining === 0) void finishStation();
    }, 250) : undefined;
    return () => { if (timer) window.clearInterval(timer); window.removeEventListener("beforeunload", warnOnLeave); };
  }, [screen, timed, finishStation]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); recognitionRef.current?.abort(); }, []);

  function replay() {
    finishLock.current = false;
    setSessionId(null);
    resetStation();
    setScreen("briefing");
  }

  function backToCatalog() {
    window.speechSynthesis?.cancel();
    router.push("/cas");
  }

  const eyebrow = ["STATION ECOS", station.specialty?.toUpperCase(), SETTING_LABEL[station.setting].toUpperCase()].filter(Boolean).join(" · ");
  const examMinutes = Math.round(examSeconds / 60);
  const phaseIndex = PHASES.findIndex((entry) => entry.id === phase);

  return (
    <main className="page-enter mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      {stationError && <div role="alert" className="learning-notice">{stationError}{screen === "report" && <button className="button secondary ml-3" disabled={saving} onClick={() => void finishStation()}>Réessayer la sauvegarde</button>}</div>}
      {saving && <p role="status" className="learning-notice">Enregistrement et calcul du bilan…</p>}
      {screen === "briefing" && (
        <div className="briefing-page page-enter">
          <button className="back-link" onClick={backToCatalog}>← Tous les cas cliniques</button>
          <div className="briefing-grid">
            <section>
              <p className="eyebrow">{eyebrow}</p>
              <h1>{station.candidateTitle}</h1>
              <p className="lead">Anamnèse, examen clinique puis synthèse : la station se déroule comme à l’examen.</p>
              <div className="instruction-card">
                <div className="paper-label">CONSIGNE AU CANDIDAT</div>
                {station.brief.map((line, index) => index === 1 ? <p key={line}><strong>{line}</strong></p> : <p key={line}>{line}</p>)}
                <ol className="ecos-brief-steps">
                  <li><strong>Anamnèse</strong> : interroge le patient, à l’écrit ou à la voix.</li>
                  <li><strong>Examen clinique</strong> : annonce-le (« On passe à l’examen clinique ») puis choisis tes gestes et tes examens ; chacun débloque son résultat. Les gestes inutiles coûtent des points.</li>
                  <li><strong>Synthèse</strong> : ton diagnostic principal et ta prise en charge, puis le bilan. Une fois la synthèse ouverte, l’entretien et l’examen sont terminés.</li>
                </ol>
              </div>
              <fieldset className="ecos-mode-options"><legend>Choisis tes conditions</legend><label htmlFor="ecos-training" aria-label="Mode entraînement"><input id="ecos-training" type="radio" name="ecos-mode" checked={mode === "training"} onChange={() => setMode("training")} /><span><strong>Entraînement</strong><small>Sans chronomètre, avec les repères de progression.</small></span></label><label htmlFor="ecos-exam" aria-label="Mode examen"><input id="ecos-exam" type="radio" name="ecos-mode" checked={mode === "exam"} onChange={() => setMode("exam")} /><span><strong>Examen</strong><small>{examMinutes} minutes pour toute la station, sans indices ni score pendant l’épreuve.</small></span></label></fieldset>
            </section>
            <aside className="brief-aside">
              <div className="patient-portrait"><span>{patientInitials}</span><i /></div>
              <h2>{station.patientLabel}</h2>
              <p>Patient simulé interactif</p>
              <div className="station-facts"><div><strong>{mode === "exam" ? formatTime(examSeconds) : "Libre"}</strong><span>{mode === "exam" ? "Temps disponible" : "Sans chronomètre"}</span></div><div><strong>{station.maxScore}</strong><span>Points possibles</span></div></div>
              <ul>
                <li>Microphone recommandé</li>
                <li>Réponses vocales en français</li>
                <li>Débriefing et sources après la station</li>
              </ul>
              <button className="button primary full" disabled={starting} onClick={startStation}>{starting ? "Préparation de la station…" : "Démarrer la station"}<span aria-hidden="true"> →</span></button>
              <small>{mode === "exam" ? "Le chronomètre démarre lorsque le patient est prêt." : "Prends le temps qu’il te faut."}</small>
            </aside>
          </div>
        </div>
      )}

      {screen === "station" && (
        <div className="station-page page-enter">
          <section className="station-header">
            <div><p className="eyebrow">{mode === "exam" ? "MODE EXAMEN" : "MODE ENTRAÎNEMENT"}</p><h1>{station.candidateTitle}</h1></div>
            {timed
              ? <div className={`timer ${secondsLeft < 90 ? "timer-alert" : ""}`} role="timer" aria-live="off"><span>Temps restant</span><strong>{formatTime(secondsLeft)}</strong></div>
              : <div className="ecos-free-time"><span>Entraînement</span><strong>Sans chrono</strong></div>}
            <button className="button danger-ghost" disabled={busy} onClick={() => (phase === "synthese" ? void finishStation() : requestSynthesis())}>{phase === "synthese" ? "Terminer" : "Aller à la synthèse"}</button>
          </section>

          <div className={`consultation-grid${mode === "exam" ? " ecos-exam" : ""}`}>
            <aside className="patient-panel">
              <div className="patient-portrait large"><span>{patientInitials}</span><i className={loading ? "speaking" : ""} /></div>
              <h2>{station.patientLabel}</h2>
              <div className="patient-status"><span className={loading ? "status-dot active" : "status-dot"} />{loading ? "Réfléchit…" : listening ? "Vous écoute…" : phase === "examen" ? "Examen en cours" : phase === "synthese" ? "Attend vos conclusions" : "En consultation"}</div>
              <button className="voice-toggle" onClick={() => { if (voiceEnabled) window.speechSynthesis?.cancel(); setVoiceEnabled((value) => !value); }} aria-pressed={voiceEnabled}>{voiceEnabled ? "Voix activée" : "Voix désactivée"}</button>
              <div className="privacy-note">Les échanges de cette simulation sont réservés à ton entraînement.</div>
            </aside>

            <section className="conversation-panel">
              <nav className="ecos-phases" aria-label="Étapes de la station">
                <ol>
                  {PHASES.map((item, index) => {
                    const locked = phase === "synthese" && item.id !== "synthese";
                    return (
                      <li key={item.id}>
                        <button type="button" aria-current={phase === item.id ? "step" : undefined} aria-disabled={busy || locked || undefined} className={phase === item.id ? "active" : phaseIndex > index ? "done" : ""} onClick={() => { if (!busy && !locked) goToPhase(item.id); }}>
                          <span>{phaseIndex > index ? <Check aria-hidden="true" size={13} /> : index + 1}</span>{item.label}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              <div className="transcript" ref={transcriptRef} aria-live="polite">
                {messages.map((message, index) => {
                  const view = messageView(message);
                  return (
                    <div key={`${message.role}-${index}`} className={view.className}>
                      <span>{view.label}</span>
                      <p>{view.text}</p>
                    </div>
                  );
                })}
                {loading && <div className="message patient loading-message"><span>Patient</span><p><i /><i /><i /></p></div>}
              </div>

              {confirmingSynthesis && phase !== "synthese" && (
                <div className="ecos-confirm" role="alertdialog" aria-labelledby="ecos-confirm-title">
                  <p id="ecos-confirm-title"><strong>Passer à la synthèse ?</strong> Tu ne pourras plus interroger le patient ni réaliser de geste.</p>
                  <div>
                    <button type="button" className="button secondary" onClick={() => setConfirmingSynthesis(false)}>Continuer la station</button>
                    <button type="button" className="button primary" disabled={openingSynthesis} onClick={() => void openSynthesis()}>Ouvrir la synthèse</button>
                  </div>
                </div>
              )}

              {phase === "anamnese" && !confirmingSynthesis && (
                <div className="ecos-phase-actions">
                  <p>Anamnèse terminée ? Annonce l’examen clinique.</p>
                  <button className="button secondary" aria-disabled={busy || undefined} onClick={() => { if (!busy) void announceExam(); }}>On passe à l’examen clinique →</button>
                </div>
              )}

              {phase === "examen" && (
                <div className="ecos-procedures">
                  <h2 className="sr-only" ref={examHeadingRef} tabIndex={-1}>Examen clinique : choix des gestes</h2>
                  {PROCEDURE_QUESTIONS.map(({ category, question }) => {
                    const items = station.procedures.filter((procedure) => procedure.category === category);
                    if (!items.length) return null;
                    return (
                      <fieldset key={category}>
                        <legend>{question}</legend>
                        <div>
                          {items.map((procedure) => {
                            const done = performed.includes(procedure.id);
                            const unavailable = done || busy || timeOver;
                            return (
                              <button key={procedure.id} type="button" className={done ? "done" : ""} aria-pressed={done} aria-disabled={unavailable || undefined} onClick={() => { if (!unavailable) void performProcedure(procedure.id); }}>
                                {done ? <Check aria-hidden="true" size={15} /> : null}{pendingProcedure === procedure.id ? "Résultat en cours…" : procedure.label}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    );
                  })}
                  <div className="ecos-last-result" aria-live="polite">
                    {lastResult
                      ? <p><strong>{lastResult.label}</strong> — {lastResult.result}</p>
                      : <p>Les résultats s’affichent ici et dans l’échange.</p>}
                  </div>
                  {!confirmingSynthesis && (
                    <div className="ecos-phase-actions">
                      <p>{performed.length} geste{performed.length > 1 ? "s" : ""} réalisé{performed.length > 1 ? "s" : ""}.</p>
                      <button className="button secondary" aria-disabled={busy || undefined} onClick={() => { if (!busy) requestSynthesis(); }}>Passer à la synthèse →</button>
                    </div>
                  )}
                </div>
              )}

              {phase === "synthese" && (
                <form className="ecos-synthesis" onSubmit={(event) => { event.preventDefault(); if (diagnosis && !busy) void finishStation(); }}>
                  <h2 ref={synthesisHeadingRef} tabIndex={-1}>Synthèse</h2>
                  <fieldset>
                    <legend>Quel est ton diagnostic principal ?</legend>
                    {options
                      ? <div className="ecos-synthesis-options">{options.map((option) => (
                          <label key={option}><input type="radio" name="ecos-diagnosis" value={option} checked={diagnosis === option} onChange={() => setDiagnosis(option)} /><span>{option}</span></label>
                        ))}</div>
                      : optionsError
                        ? <p role="alert">Les propositions n’ont pas pu être chargées. <button type="button" className="learning-inline-link" onClick={() => void openSynthesis()}>Réessayer</button></p>
                        : <p role="status">Chargement des propositions…</p>}
                  </fieldset>
                  <label className="ecos-synthesis-plan">
                    <span>Ta prise en charge : examens, traitements, orientation et ce que tu expliques au patient</span>
                    <textarea maxLength={1200} rows={5} value={plan} onChange={(event) => setPlan(event.target.value)} placeholder="Ex. : je donne…, j’appelle…, j’hospitalise en…, j’explique au patient que…" />
                  </label>
                  <div className="ecos-phase-actions">
                    <p>{diagnosis ? "Tu peux terminer la station." : "Choisis un diagnostic pour terminer."}</p>
                    <button type="submit" className="button primary" aria-disabled={busy || !diagnosis || undefined}>Terminer et voir le bilan</button>
                  </div>
                </form>
              )}

              {phase !== "synthese" && (
                <>
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
                      readOnly={busy}
                      aria-busy={busy}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder={listening ? "Je vous écoute…" : phase === "examen" ? "Une question au patient pendant l’examen…" : "Pose ta question au patient…"}
                      aria-label="Question au patient"
                    />
                    <button
                      type="submit"
                      className="send-button"
                      disabled={!input.trim() || busy}
                      aria-label="Envoyer la question"
                      title="Envoyer"
                    >
                      <SendHorizontal aria-hidden="true" size={18} />
                    </button>
                  </form>
                  <p className="composer-hint">{phase === "examen" ? "Les gestes se choisissent dans la liste ci-dessus." : "Une question à la fois fonctionne le mieux. Appuie sur le micro pour parler."}</p>
                </>
              )}
            </section>

            {mode === "training" && <aside className="objectives-panel">
              <p className="eyebrow">VOTRE PROGRESSION</p>
              <h2>Objectifs observés</h2>
              <div className="live-score"><strong>{score}</strong><span>/ {maxScore} points repérés</span></div>
              <div className="criteria-mini-list">
                {liveCriteria.map((criterion) => <div key={criterion.id}><span className={criterion.earned > 0 ? "checked" : ""}>{criterion.earned > 0 ? "✓" : "·"}</span><p>{criterion.label}</p></div>)}
                <div><span className={performed.length ? "checked" : ""}>{performed.length || "·"}</span><p>Gestes d’examen (notés à la fin)</p></div>
              </div>
              <p className="objectives-note">Repérage automatique par mots-clés : indicatif, sans validation de la pertinence clinique. L’examen clinique et le diagnostic sont notés à la fin.</p>
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
              <p className="eyebrow">{result ? "BILAN ENREGISTRÉ" : "STATION TERMINÉE · ESTIMATION LOCALE"}</p>
              <h1>{percent >= 70 ? "Des repères bien couverts." : "Une bonne base à consolider."}</h1>
              <p className="lead">Ce bilan repère les thèmes abordés dans ton entretien, tes gestes et ta synthèse. Compare ta démarche au débriefing ci-dessous.</p>
              {result && <div className="report-tags"><span>+{result.xp} XP</span><span>{mode === "exam" ? "Mode examen" : "Entraînement"}</span></div>}
            </div>
          </section>
          <section className="report-grid">
            <div className="rubric-card">
              <div className="section-heading"><div><p className="eyebrow">GRILLE ECOS</p><h2>Analyse par compétence</h2></div><strong>{score}/{maxScore}</strong></div>
              {criteria.map((criterion) => (
                <div className="rubric-row" key={criterion.id}>
                  <span className={criterion.earned === criterion.points ? "criterion-icon success" : criterion.earned > 0 ? "criterion-icon partial" : "criterion-icon"}>{criterion.earned === criterion.points ? "✓" : criterion.earned > 0 ? "~" : "!"}</span>
                  <div><strong>{criterion.label}</strong><p>{criterion.earned === criterion.points ? "Objectif couvert." : criterion.hint}</p></div>
                  <b>{criterion.earned}/{criterion.points}</b>
                </div>
              ))}
            </div>
            <aside className="feedback-card">
              <p className="eyebrow">COACH {BRAND_NAME_UPPER}</p><h2>À retenir</h2>
              {result?.synthesis && (
                <div className={`feedback ${result.synthesis.chosen === result.synthesis.correct ? "good" : "improve"}`}>
                  <span>Dx</span>
                  <p><strong>{result.synthesis.chosen === result.synthesis.correct ? "Bon diagnostic" : "Diagnostic attendu"}</strong>{result.synthesis.chosen ? `Ton choix : ${result.synthesis.chosen}. ` : "Aucun diagnostic proposé. "}{result.synthesis.chosen === result.synthesis.correct ? "" : `Attendu : ${result.synthesis.correct}.`}</p>
                </div>
              )}
              <div className="feedback good"><span>+</span><p><strong>Thème couvert</strong>{coveredCriterion?.label ?? "Aucun thème complètement repéré pour le moment."}</p></div>
              <div className="feedback improve"><span>↗</span><p><strong>À améliorer</strong>{missedCriterion?.hint ?? "Poursuis cette approche structurée."}</p></div>
              <button className="button primary full" disabled={saving || Boolean(stationError)} onClick={replay}>Rejouer la station</button>
              <button className="button secondary full" onClick={backToCatalog}>Continuer l’entraînement</button>
            </aside>
          </section>

          {result?.procedures && (result.procedures.missed.length > 0 || result.procedures.unhelpful.length > 0) && (
            <section className="ecos-debrief ecos-procedure-feedback" aria-label="Retour sur l’examen clinique">
              <p className="eyebrow">EXAMEN CLINIQUE</p>
              <div className="ecos-debrief-grid">
                <DebriefList title="Gestes attendus non réalisés" items={result.procedures.missed} />
                <DebriefList title="Gestes peu utiles dans cette situation" items={result.procedures.unhelpful} />
              </div>
            </section>
          )}

          {result?.debrief ? (
            <section className="ecos-debrief" aria-labelledby="ecos-debrief-title">
              <p className="eyebrow">DÉBRIEFING</p>
              <h2 id="ecos-debrief-title">{result.debrief.diagnosis}</h2>
              <p className="lead">{result.debrief.summary}</p>
              <div className="ecos-debrief-grid">
                <DebriefList title="Éléments clés du cas" items={result.debrief.keyFindings} />
                <DebriefList title="Drapeaux rouges" items={result.debrief.redFlags} />
                <DebriefList title="Prise en charge attendue" items={result.debrief.management} />
                <DebriefList title="Diagnostics différentiels" items={result.debrief.differentials} />
              </div>
              {result.debrief.fiches.length > 0 && (
                <div className="ecos-debrief-links">
                  <h3>Réviser avec les fiches</h3>
                  <div>{result.debrief.fiches.map((fiche) => <Link className="learning-inline-link" href={`/pathologies/${fiche.slug}`} key={fiche.slug}><BookOpen aria-hidden="true" size={15} /> {fiche.title}</Link>)}</div>
                </div>
              )}
              <div className="ecos-debrief-sources">
                <h3>Sources</h3>
                <ul>{result.debrief.sources.map((source) => <li key={source.url}><a href={source.url} rel="noreferrer" target="_blank">{source.label}</a></li>)}</ul>
                <p>Synthèse pédagogique en attente de validation médicale signée. Les protocoles locaux priment.</p>
              </div>
            </section>
          ) : !saving && (
            <p className="learning-notice">Le débriefing (diagnostic, points clés et sources) s’affiche une fois le bilan enregistré.</p>
          )}
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
