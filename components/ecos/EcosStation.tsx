"use client";
/* eslint-disable @next/next/no-img-element -- images d’examens déposées dans public/ecos/, dimensions inconnues : le composant Image de Next exige largeur et hauteur. */

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Mic, SendHorizontal, Square } from "lucide-react";
import { EXAMINER_PREFIX, isExamTransition, PROCEDURE_PREFIX } from "@/lib/ecos/text";
import type { EcosCriterion, EcosMessage, EcosMode, EcosProcedure, EcosProcedureCategory, EcosStationView } from "@/lib/ecos/types";
import type { EcosDebriefView } from "@/lib/ecos/debrief";
import type { EcosCommunicationReport } from "@/lib/ecos/communication";
import { BRAND_NAME } from "@/lib/brand";
import { ListeningBars } from "@/components/brand/BrandLogo";
import { remainingSeconds } from "@/lib/ecos/timing";
import { readChatEvents } from "@/lib/ecos/chat-stream";
import { base64AudioBlob, PatientVoicePlayer } from "./patient-voice";
import { StationFeedback } from "./StationFeedback";
import { CommunicationReport, DebriefList, messageView } from "./StationReport";

type Screen = "briefing" | "station" | "report";
type Phase = "anamnese" | "examen" | "analyse" | "synthese";

type CompletionResponse = {
  xp: number;
  score: number;
  maxScore: number;
  criteria: EcosCriterion[];
  synthesis?: { chosen: string | null; correct: string };
  procedures?: { missed: string[]; unhelpful: string[] };
  /** Relecture de la grille par le modèle (questions posées autrement). */
  review?: { done: boolean; added: number };
  communication?: EcosCommunicationReport;
  debrief?: EcosDebriefView;
};

const SETTING_LABEL = { urgences: "Urgences", cabinet: "Cabinet" } as const;

type ProcedureImage = NonNullable<EcosProcedure["image"]>;
type ProcedureResult = { label: string; result: string; image: ProcedureImage | null };

/** Image d'un examen (ECG, radio…), reçue avec son résultat. */
function ProcedureFigure({ image }: { image: ProcedureImage | null }) {
  if (!image) return null;
  return (
    <figure className="ecos-procedure-image">
      <img src={image.src} alt={image.alt} loading="lazy" />
      <figcaption>{image.alt}</figcaption>
    </figure>
  );
}

/**
 * Sans audio réaliste après ce délai pour un morceau, la voix du navigateur
 * le lit. Volontairement large : une première synthèse met couramment
 * 2 à 3 s, et un seuil trop court la masquerait à chaque fois.
 */
const VOICE_AUDIO_FALLBACK_MS = 4_000;

/** Chronos de l'échange vocal, visibles en développement seulement. */
function logTiming(label: string, since: number) {
  if (process.env.NODE_ENV === "development") console.info(`${BRAND_NAME} timing ${label}=${Math.round(performance.now() - since)}ms`);
}

const PHASES: Array<{ id: Phase; label: string }> = [
  { id: "anamnese", label: "Anamnèse" },
  { id: "examen", label: "Examen clinique" },
  { id: "synthese", label: "Synthèse" },
];
/** Stations de 5ᵉ année : les examens demandés s'interprètent par écrit avant la synthèse. */
const PHASES_WITH_ANALYSIS: Array<{ id: Phase; label: string }> = [
  { id: "anamnese", label: "Anamnèse" },
  { id: "examen", label: "Examen clinique" },
  { id: "analyse", label: "Analyse" },
  { id: "synthese", label: "Synthèse" },
];

/** Le patient n'est interrogé qu'à l'anamnèse et pendant l'examen clinique. */
const chatPhase = (phase: Phase) => phase === "anamnese" || phase === "examen";

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

/** Error text sent by the API for expected refusals (time over, synthesis started…). */
async function apiErrorMessage(response: Response, fallback: string) {
  const data = await response.json().catch(() => null) as { error?: string } | null;
  return response.status === 400 || response.status === 409 || response.status === 429 ? data?.error ?? fallback : fallback;
}

export function EcosStation({ station }: { station: EcosStationView }) {
  const router = useRouter();
  const examSeconds = station.examDurationSeconds;
  const [screen, setScreen] = useState<Screen>("briefing");
  const [phase, setPhase] = useState<Phase>("anamnese");
  const [mode, setMode] = useState<EcosMode>("training");
  const [secondsLeft, setSecondsLeft] = useState(examSeconds);
  const [messages, setMessages] = useState<EcosMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  // Source réelle de la voix entendue : un repli silencieux ferait croire à une panne.
  const [voiceSource, setVoiceSource] = useState<"realiste" | "navigateur" | null>(null);
  const [voiceLatencyMs, setVoiceLatencyMs] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState(false);
  // Mode conversation : le micro se rouvre seul après chaque réponse du patient.
  const [conversation, setConversation] = useState(false);
  // Texte de la réponse en cours d'arrivée, affiché avant qu'elle soit complète.
  const [streamingText, setStreamingText] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stationError, setStationError] = useState<string | null>(null);
  const [performed, setPerformed] = useState<string[]>([]);
  const [pendingProcedure, setPendingProcedure] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ProcedureResult | null>(null);
  const [confirmingSynthesis, setConfirmingSynthesis] = useState(false);
  const [openingSynthesis, setOpeningSynthesis] = useState(false);
  const [options, setOptions] = useState<string[] | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [examResults, setExamResults] = useState<Array<ProcedureResult & { id: string }>>([]);
  const [result, setResult] = useState<CompletionResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const deadline = useRef(0);
  const startLock = useRef(false);
  const finishLock = useRef(false);
  const messageLock = useRef(false);
  const pendingMessage = useRef<Promise<void> | null>(null);
  const pendingGesture = useRef<Promise<void> | null>(null);
  const synthesisRef = useRef({ diagnosis: "", plan: "", analysis: "" });
  const phaseRef = useRef<Phase>("anamnese");
  const examAnnounced = useRef(false);
  const focusOnPhase = useRef(false);
  const examHeadingRef = useRef<HTMLHeadingElement>(null);
  const analysisHeadingRef = useRef<HTMLHeadingElement>(null);
  const synthesisHeadingRef = useRef<HTMLHeadingElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Voix du patient (créée au premier clic qui l'active, voir enableVoice).
  const playerRef = useRef<PatientVoicePlayer | null>(null);
  // Lus dans des rappels asynchrones (dictée, fin de lecture) : l'état seul serait périmé.
  const voiceEnabledRef = useRef(false);
  const conversationRef = useRef(false);
  const speakingWatchdog = useRef<number | undefined>(undefined);
  const quickMicFailures = useRef(0);
  const replyStartedAt = useRef(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Comme à l'examen, la grille n'est montrée qu'au bilan, une fois la station corrigée par le serveur.
  const criteria = result?.criteria ?? [];
  const score = criteria.reduce((total, criterion) => total + criterion.earned, 0);
  const maxScore = result?.maxScore ?? station.maxScore;
  const percent = Math.round((score / maxScore) * 100);
  const coveredCriterion = criteria.find((criterion) => criterion.earned === criterion.points);
  const missedCriterion = criteria.find((criterion) => criterion.earned < criterion.points);
  const timed = mode === "exam";
  const timeOver = timed && secondsLeft === 0;
  const busy = loading || saving || Boolean(pendingProcedure) || openingSynthesis;
  // En conversation vocale l'échange écrit est replié : la dernière note de l'interface doit rester visible.
  const lastMessage = messages.at(-1);
  const lastSystemNote = lastMessage?.role === "system" ? lastMessage.content : null;

  useEffect(() => { synthesisRef.current = { diagnosis, plan, analysis }; }, [diagnosis, plan, analysis]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, streamingText]);

  // Keyboard and screen-reader users land on the new step instead of the top of the page.
  useEffect(() => {
    if (!focusOnPhase.current) return;
    focusOnPhase.current = false;
    (phase === "examen" ? examHeadingRef : phase === "analyse" ? analysisHeadingRef : phase === "synthese" ? synthesisHeadingRef : null)?.current?.focus();
  }, [phase]);

  /**
   * « Le patient parle » couvre aussi la préparation de sa voix : tant que cet
   * état est vrai, le mode conversation ne rouvre pas le micro, sinon la
   * dictée transcrirait le patient. Un garde-fou le relâche si la fin de
   * lecture n'est jamais signalée par le navigateur.
   */
  const markSpeaking = useCallback((active: boolean) => {
    window.clearTimeout(speakingWatchdog.current);
    if (active) speakingWatchdog.current = window.setTimeout(() => setSpeaking(false), 45_000);
    setSpeaking(active);
  }, []);

  const stopSpeaking = useCallback(() => {
    playerRef.current?.stop();
    markSpeaking(false);
  }, [markSpeaking]);

  /**
   * Coupe la parole du patient, à tout moment. En mode conversation, le
   * micro se rouvre de lui-même dès que l'état « parle » tombe.
   */
  const interruptPatient = useCallback(() => {
    stopSpeaking();
  }, [stopSpeaking]);

  // Échap interrompt aussi le patient, sans chercher le bouton.
  useEffect(() => {
    if (screen !== "station" || !speaking) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") interruptPatient();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, speaking, interruptPatient]);

  /**
   * Phrase d'ouverture du patient : déjà enregistrée en base, elle est lue
   * par /api/ecos/speech. Les réponses suivantes arrivent avec leur audio.
   * `session` est passé explicitement : l'état n'est pas encore à jour.
   */
  async function speakOpening(text: string, session: string) {
    const player = playerRef.current;
    if (!voiceEnabledRef.current || !player || text.startsWith(EXAMINER_PREFIX)) return;
    const reply = player.begin({ hold: true });
    replyStartedAt.current = performance.now();
    if (player.serverVoice) {
      try {
        const response = await fetch("/api/ecos/speech", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId: session, text }), signal: AbortSignal.timeout(20_000),
        });
        // 503 : la voix réaliste n'est pas configurée, inutile de la redemander.
        if (response.status === 503) player.serverVoice = false;
        if (response.ok) {
          setVoiceSource("realiste");
          player.pushAudio(reply, await response.blob(), text);
          player.end(reply);
          return;
        }
      } catch { /* la voix du navigateur prend le relais */ }
    }
    setVoiceSource("navigateur");
    player.pushText(reply, text);
    player.end(reply);
  }

  /** À appeler pendant un clic : crée le lecteur et l'autorise à lire sans nouveau geste. */
  function enableVoice() {
    if (!playerRef.current) {
      playerRef.current = new PatientVoicePlayer({
        onSpeakingChange: markSpeaking,
        onAudible: () => {
          logTiming("question→audible", replyStartedAt.current);
          setVoiceLatencyMs(Math.round(performance.now() - replyStartedAt.current));
        },
      });
    }
    playerRef.current.unlock();
    voiceEnabledRef.current = true;
    setVoiceEnabled(true);
  }

  function toggleVoice() {
    if (!voiceEnabled) { enableVoice(); return; }
    stopSpeaking();
    voiceEnabledRef.current = false;
    setVoiceEnabled(false);
  }

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
    setAnalysis("");
    setExamResults([]);
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
      if (!response.ok) {
        // Quota du jour atteint : le serveur l'explique, on le dit tel quel.
        setSessionId(null);
        setStationError(response.status === 429 && typeof data.error === "string" ? data.error : "La station n’a pas pu démarrer. Vérifie ta connexion puis réessaie.");
        return;
      }
      setSessionId(data.sessionId);
      deadline.current = Date.now() + examSeconds * 1_000;
      const firstMessage: EcosMessage = { role: "patient", content: data.initialMessage };
      setMessages([firstMessage]);
      setScreen("station");
      void speakOpening(firstMessage.content, data.sessionId);
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
    if (!clean || clean.length > 800 || messageLock.current || finishLock.current || !sessionId || screen !== "station" || !chatPhase(phaseRef.current) || timeOver) return;
    messageLock.current = true;
    setLoading(true);
    setInput("");
    const task = (async () => {
      const askedAt = performance.now();
      replyStartedAt.current = askedAt;
      // La voix réaliste arrive avec la réponse ; sinon le navigateur lit chaque morceau.
      const player = voiceEnabledRef.current ? playerRef.current : null;
      let reply: number | null = null;
      let serverAudio = false;
      const segments: string[] = [];
      // Audio réaliste trop lent pour un morceau : la voix du navigateur le lit
      // sans attendre l'échec, et l'audio arrivé ensuite est ignoré.
      const voiceTimers = new Map<number, number>();
      const voiceSettled = new Set<number>();
      const settleVoice = (index: number) => {
        voiceSettled.add(index);
        const timer = voiceTimers.get(index);
        if (timer !== undefined) window.clearTimeout(timer);
        voiceTimers.delete(index);
      };
      const outcome: { reply?: string; error?: string } = {};
      try {
        const response = await fetch("/api/ecos/chat", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: clean, sessionId, voice: Boolean(player?.serverVoice) }), signal: AbortSignal.timeout(40_000),
        });
        if (!response.ok || !response.body) throw new Error(await apiErrorMessage(response, "Réponse non reçue. Ta question est conservée dans le champ de saisie."));
        // La nouvelle réponse coupe ce que le patient disait encore.
        if (player && !finishLock.current) reply = player.begin();
        await readChatEvents(response.body, (event) => {
          switch (event.type) {
            case "start":
              serverAudio = event.voice;
              if (player) setVoiceSource(event.voice ? "realiste" : "navigateur");
              break;
            case "segment": {
              segments[event.index] = event.text;
              if (event.index === 0) logTiming("question→first-sentence", askedAt);
              setStreamingText((current) => (current ? `${current} ${event.text}` : event.text));
              if (player && reply !== null && !serverAudio) player.pushText(reply, event.text);
              else if (player && reply !== null) {
                const index = event.index;
                const spokenReply = reply;
                voiceTimers.set(index, window.setTimeout(() => {
                  voiceTimers.delete(index);
                  if (voiceSettled.has(index)) return;
                  voiceSettled.add(index);
                  setVoiceSource("navigateur");
                  player.pushText(spokenReply, segments[index] ?? "");
                }, VOICE_AUDIO_FALLBACK_MS));
              }
              break;
            }
            case "audio":
              if (player && reply !== null && !voiceSettled.has(event.index)) {
                settleVoice(event.index);
                setVoiceSource("realiste");
                player.pushAudio(reply, base64AudioBlob(event.audio), segments[event.index] ?? "");
              }
              break;
            case "audio-error":
              // Refus définitif (clé, voix) : les réponses suivantes passeront par la voix du navigateur.
              if (player && event.disable) player.serverVoice = false;
              if (player && reply !== null && !voiceSettled.has(event.index)) {
                settleVoice(event.index);
                setVoiceSource("navigateur");
                player.pushText(reply, segments[event.index] ?? "");
              }
              break;
            case "done":
              outcome.reply = event.reply;
              break;
            case "error":
              outcome.error = event.error;
              break;
          }
        });
        if (outcome.error || outcome.reply === undefined) {
          throw new Error(outcome.error ?? "Réponse interrompue. Ta question est conservée dans le champ de saisie.");
        }
        logTiming("question→done", askedAt);
        const patientReply = outcome.reply;
        setMessages((current) => [...current, { role: "student", content: clean }, { role: "patient", content: patientReply }]);
        // « On passe à l’examen clinique » : le médecin annonce l’examen.
        if (isExamTransition(clean)) enterExamPhase();
      } catch (error) {
        setInput(clean);
        setMessages((current) => [...current, { role: "system", content: error instanceof Error && error.message ? error.message : "Réponse non reçue." }]);
      } finally {
        if (player && reply !== null) player.end(reply);
        setStreamingText("");
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
        const data = await response.json() as { label: string; result: string; image?: ProcedureImage | null };
        const image = data.image ?? null;
        setPerformed((current) => [...current, procedureId]);
        setLastResult({ label: data.label, result: data.result, image });
        if (station.procedures.some((procedure) => procedure.id === procedureId && procedure.category === "complementaire")) {
          setExamResults((current) => [...current, { id: procedureId, label: data.label, result: data.result, image }]);
        }
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
    // L'entretien est clos : la conversation vocale s'arrête avec lui.
    if (conversationRef.current) stopConversation();
    stopSpeaking();
    setOpeningSynthesis(true);
    setOptionsError(false);
    changePhase("synthese");
    try {
      await pendingMessage.current;
      await pendingGesture.current;
      // L'analyse écrite est enregistrée avant que les propositions ne soient connues.
      const response = await fetch(`/api/ecos/session/${sessionId}/synthesis`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ analysis: synthesisRef.current.analysis }), signal: AbortSignal.timeout(20_000),
      });
      const data = await response.json() as { options?: string[] };
      if (!response.ok || !data.options?.length) throw new Error("Options indisponibles");
      setOptions(data.options);
    } catch { setOptionsError(true); }
    finally { setOpeningSynthesis(false); }
  }

  /** L'analyse ferme l'entretien : la conversation vocale s'arrête, l'étudiant peut revenir à l'examen. */
  function enterAnalysis() {
    if (!chatPhase(phaseRef.current)) return;
    if (conversationRef.current) stopConversation();
    stopSpeaking();
    changePhase("analyse");
  }

  /** Going to the synthesis closes the history and the exam: ask first. */
  function requestSynthesis() {
    if (phaseRef.current === "synthese") return;
    // Avec une étape d'analyse, la synthèse s'ouvre depuis l'analyse seulement.
    if (station.analysis && phaseRef.current !== "analyse") { enterAnalysis(); return; }
    setConfirmingSynthesis(true);
  }

  function goToPhase(next: Phase) {
    if (phaseRef.current === "synthese" || next === phaseRef.current) return;
    if (next === "synthese") { requestSynthesis(); return; }
    if (next === "analyse") { enterAnalysis(); return; }
    if (next === "examen" && phaseRef.current === "anamnese") { void announceExam(); return; }
    changePhase(next);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  /** Quitte le mode conversation ; `note` explique pourquoi quand ce n'est pas l'étudiant qui l'arrête. */
  function stopConversation(note?: string) {
    conversationRef.current = false;
    setConversation(false);
    recognitionRef.current?.abort();
    if (note) setMessages((current) => [...current, { role: "system", content: note }]);
  }

  /** Ouvre le micro pour une question. Le mode conversation le rappelle après chaque réponse. */
  function beginListening() {
    if (recognitionRef.current || loading || finishLock.current || screen !== "station" || !chatPhase(phaseRef.current)) return;
    // Couper le patient avant d'ouvrir le micro : sinon la dictée transcrit sa voix.
    stopSpeaking();
    const BrowserRecognition = (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition; SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!BrowserRecognition) {
      const note = "La dictée vocale n’est pas disponible dans ce navigateur. Tu peux écrire ta question.";
      if (conversationRef.current) stopConversation(note);
      else setMessages((current) => [...current, { role: "system", content: note }]);
      return;
    }
    const recognition = new BrowserRecognition();
    recognitionRef.current = recognition;
    const startedAt = Date.now();
    let understood = false;
    let showedInterim = false;
    let lastHeardAt = 0;
    recognition.lang = "fr-FR";
    // Les résultats provisoires montrent à l'étudiant ce que le micro comprend.
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      if (understood) { quickMicFailures.current = 0; return; }
      // N'efface que le texte provisoire de la dictée, jamais une question tapée au clavier.
      if (showedInterim) setInput("");
      // Un micro qui se referme aussitôt, plusieurs fois de suite, ne marchera pas mieux au tour suivant.
      quickMicFailures.current = Date.now() - startedAt < 1_200 ? quickMicFailures.current + 1 : 0;
      if (conversationRef.current && quickMicFailures.current >= 4) {
        quickMicFailures.current = 0;
        stopConversation("Le micro se coupe aussitôt ouvert. La conversation vocale est en pause : vérifie ton micro, ou écris ta question.");
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      // Un silence ou une interruption volontaire ne sont pas des pannes.
      if (!conversationRef.current || event.error === "no-speech" || event.error === "aborted") return;
      stopConversation(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Le navigateur n’a pas accès au micro. Autorise-le pour ce site, puis relance la conversation vocale."
        : "La dictée vocale s’est interrompue. Relance la conversation vocale, ou écris ta question.");
    };
    recognition.onresult = (event) => {
      if (understood) return;
      let finalText = "";
      let interimText = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += text; else interimText += text;
      }
      const heard = finalText.trim();
      if (!heard) { showedInterim = true; lastHeardAt = performance.now(); setInput(interimText); return; }
      // Délai entre le dernier mot perçu et la validation de la phrase par le navigateur.
      if (lastHeardAt) logTiming("silence→question", lastHeardAt);
      understood = true;
      setInput(heard);
      void sendMessage(heard);
    };
    try { recognition.start(); } catch { recognitionRef.current = null; setListening(false); }
  }

  /** Bouton micro du champ de saisie : un clic ouvre le micro, un second l'arrête. */
  function startListening() {
    if (recognitionRef.current) { recognitionRef.current.abort(); recognitionRef.current = null; setListening(false); return; }
    beginListening();
  }

  // Dictée dans un champ libre (analyse, prise en charge) : le texte reconnu
  // s'ajoute au champ, rien n'est envoyé au patient.
  const [dictatingField, setDictatingField] = useState<"analysis" | "plan" | null>(null);
  const [dictationNote, setDictationNote] = useState<string | null>(null);
  const fieldRecognitionRef = useRef<SpeechRecognition | null>(null);

  function toggleFieldDictation(field: "analysis" | "plan") {
    if (fieldRecognitionRef.current) {
      fieldRecognitionRef.current.abort();
      fieldRecognitionRef.current = null;
      setDictatingField(null);
      return;
    }
    const BrowserRecognition = (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition; SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!BrowserRecognition) {
      setDictationNote("La dictée vocale n’est pas disponible dans ce navigateur. Tu peux écrire au clavier.");
      return;
    }
    setDictationNote(null);
    const recognition = new BrowserRecognition();
    fieldRecognitionRef.current = recognition;
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onend = () => { fieldRecognitionRef.current = null; setDictatingField(null); };
    recognition.onerror = (event) => {
      fieldRecognitionRef.current = null;
      setDictatingField(null);
      if (event.error === "no-speech" || event.error === "aborted") return;
      setDictationNote(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Le navigateur n’a pas accès au micro. Autorise-le pour ce site, puis réessaie."
        : "La dictée s’est interrompue. Réessaie, ou écris au clavier.");
    };
    recognition.onresult = (event) => {
      let heard = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) heard += result[0]?.transcript ?? "";
      }
      const text = heard.trim();
      if (!text) return;
      const append = (current: string) => `${current ? `${current.replace(/\s+$/, "")} ` : ""}${text}`.slice(0, 1200);
      if (field === "analysis") setAnalysis(append);
      else setPlan(append);
    };
    setDictatingField(field);
    try { recognition.start(); } catch { fieldRecognitionRef.current = null; setDictatingField(null); }
  }

  function startConversation() {
    quickMicFailures.current = 0;
    enableVoice();
    conversationRef.current = true;
    setConversation(true);
  }

  const finishStation = useCallback(async () => {
    if (finishLock.current || !sessionId) return;
    finishLock.current = true;
    setSaving(true);
    setStationError(null);
    setScreen("report");
    stopSpeaking();
    // La fin de la station (ou du temps) ferme la conversation vocale.
    conversationRef.current = false;
    setConversation(false);
    recognitionRef.current?.abort();
    try {
      // Let a pending exchange or gesture reach the transcript before grading it.
      await pendingMessage.current;
      await pendingGesture.current;
      const response = await fetch(`/api/ecos/session/${sessionId}`, {
        method: "POST", headers: { "content-type": "application/json" },
        // La grille est relue par le modèle avant l'enregistrement : quelques secondes de plus.
        body: JSON.stringify(synthesisRef.current), signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error("Sauvegarde indisponible");
      setResult((await response.json()) as CompletionResponse);
      router.refresh();
    } catch {
      setStationError("Le bilan n’a pas pu être enregistré. Réessaie la sauvegarde avant de quitter la page.");
    } finally { finishLock.current = false; setSaving(false); }
  }, [sessionId, router, stopSpeaking]);

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

  // Mode conversation : dès que personne ne parle ni ne réfléchit, le micro se rouvre.
  const conversationIdle = conversation && screen === "station" && chatPhase(phase) && !timeOver
    && !loading && !speaking && !listening && !saving && !pendingProcedure && !openingSynthesis && !confirmingSynthesis;
  useEffect(() => {
    if (!conversationIdle) return;
    // Court répit : la fin d'une réplique ne doit pas être prise pour une question.
    const timer = window.setTimeout(() => beginListening(), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- beginListening est recréée à chaque rendu ; seul l'état d'attente doit relancer le micro.
  }, [conversationIdle]);

  useEffect(() => () => { window.clearTimeout(speakingWatchdog.current); playerRef.current?.stop(); recognitionRef.current?.abort(); }, []);

  function replay() {
    finishLock.current = false;
    setSessionId(null);
    resetStation();
    setScreen("briefing");
  }

  function backToCatalog() {
    stopSpeaking();
    router.push("/cas");
  }

  const examMinutes = Math.round(examSeconds / 60);
  const phases = station.analysis ? PHASES_WITH_ANALYSIS : PHASES;
  const phaseIndex = phases.findIndex((entry) => entry.id === phase);
  const stationNumber = station.code.replace(/^station-/, "");
  const briefingMeta = [`Station ${stationNumber}`, SETTING_LABEL[station.setting], station.specialty].filter(Boolean).join(", ");
  // « M. Favre, 62 ans » → « M. Favre » dans l'échange.
  const patientShort = station.patientLabel.split(",")[0]?.trim() || "Patient";
  const patientState = speaking || loading ? "speaking" : listening ? "listening" : "idle";
  const filledPoints = Math.floor(score);
  const halfPoint = score - filledPoints >= 0.5;

  return (
    <main className="station-main">
      {stationError && <div role="alert" className="learning-notice">{stationError}{screen === "report" && <button className="button secondary small ml-3" disabled={saving} onClick={() => void finishStation()}>Réessayer la sauvegarde</button>}</div>}
      {saving && <p role="status" className="learning-notice">Enregistrement et calcul du bilan…</p>}
      {screen === "briefing" && (
        <div className="briefing">
          <button className="text-link station-back" onClick={backToCatalog} type="button">Toutes les stations</button>
          <div className="briefing-grid">
            <section className="briefing-main">
              <p className="briefing-meta">{briefingMeta}</p>
              <h1>{station.candidateTitle}</h1>
              <div className="consigne">
                <h2>Consigne au candidat</h2>
                {station.brief.map((line, index) => index === 1 ? <p key={line}><strong>{line}</strong></p> : <p key={line}>{line}</p>)}
              </div>
              <h2 className="briefing-subtitle">Le déroulé</h2>
              <ol className="ecos-brief-steps">
                <li><strong>Anamnèse.</strong> Interroge le patient, à l’écrit ou à la voix.</li>
                <li><strong>Examen clinique.</strong> Annonce-le (« On passe à l’examen clinique ») puis choisis tes gestes et tes examens ; chacun débloque son résultat. Les gestes inutiles coûtent des points.</li>
                <li><strong>Synthèse.</strong> Ton diagnostic principal et ta prise en charge, puis le bilan. Une fois la synthèse ouverte, l’entretien et l’examen sont terminés.</li>
              </ol>
              <fieldset className="ecos-mode-options">
                <legend>Choisis tes conditions</legend>
                <label htmlFor="ecos-training" aria-label="Mode entraînement"><input id="ecos-training" type="radio" name="ecos-mode" checked={mode === "training"} onChange={() => setMode("training")} /><span><strong>Entraînement</strong><small>Sans chronomètre. La grille et les conseils arrivent au bilan, à la fin.</small></span></label>
                <label htmlFor="ecos-exam" aria-label="Mode examen"><input id="ecos-exam" type="radio" name="ecos-mode" checked={mode === "exam"} onChange={() => setMode("exam")} /><span><strong>Examen</strong><small>{examMinutes} minutes pour toute la station, comme le jour de l’examen.</small></span></label>
              </fieldset>
            </section>
            <aside className="briefing-patient" aria-label="Patient">
              <span className="patient-mark"><ListeningBars /></span>
              <p className="patient-name voice">{station.patientLabel}</p>
              <p className="patient-kind">Patient simulé, répond à l’écrit et à la voix</p>
              <dl className="briefing-facts">
                <div><dt>{mode === "exam" ? "Temps disponible" : "Chronomètre"}</dt><dd>{mode === "exam" ? formatTime(examSeconds) : "Aucun"}</dd></div>
                <div><dt>Points possibles</dt><dd>{station.maxScore}</dd></div>
              </dl>
              <ul className="briefing-tips">
                <li>Micro recommandé</li>
                <li>Réponses vocales en français</li>
                <li>Débriefing et sources après la station</li>
              </ul>
              <button className="button primary full" disabled={starting} onClick={startStation} type="button">{starting ? "Préparation de la station…" : "Entrer dans la salle"}</button>
              <small>{mode === "exam" ? "Le chronomètre démarre lorsque le patient est prêt." : "Prends le temps qu’il te faut."}</small>
            </aside>
          </div>
        </div>
      )}

      {screen === "station" && (
        <div className="station">
          <header className="station-bar">
            <div className="station-bar-title">
              <p>Station {stationNumber}, {mode === "exam" ? "mode examen" : "entraînement"}</p>
              <h1>{station.candidateTitle}</h1>
            </div>
            <nav className="ecos-phases" aria-label="Étapes de la station">
              <ol>
                {phases.map((item, index) => {
                  const locked = phase === "synthese" && item.id !== "synthese";
                  return (
                    <li key={item.id}>
                      <button type="button" aria-current={phase === item.id ? "step" : undefined} aria-disabled={busy || locked || undefined} className={phase === item.id ? "active" : phaseIndex > index ? "done" : ""} onClick={() => { if (!busy && !locked) goToPhase(item.id); }}>
                        {phaseIndex > index && <Check aria-hidden="true" size={14} />}{item.label}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
            <div className="station-bar-end">
              {timed
                ? <div className={`timer${secondsLeft < 90 ? " timer-alert" : ""}`} role="timer" aria-live="off"><span>Temps restant</span><strong>{formatTime(secondsLeft)}</strong></div>
                : <span className="ecos-free-time">Sans chronomètre</span>}
              <button className="button secondary small" disabled={busy} onClick={() => (phase === "synthese" ? void finishStation() : requestSynthesis())} type="button">{phase === "synthese" ? "Terminer" : station.analysis && phase !== "analyse" ? "Aller à l’analyse" : "Aller à la synthèse"}</button>
            </div>
          </header>

          <div className="consultation">
            <aside className="patient-panel" aria-label="Patient">
              <div className="patient-id">
                <span className="patient-mark"><ListeningBars state={patientState} /></span>
                <div>
                  <p className="patient-name voice">{station.patientLabel}</p>
                  <p className="patient-status" role="status">{speaking ? "Vous répond…" : loading && streamingText ? "Prépare sa réponse…" : loading ? "Réfléchit…" : listening ? "Vous écoute…" : phase === "examen" ? "Examen en cours" : !chatPhase(phase) ? "Attend vos conclusions" : "En consultation"}</p>
                </div>
              </div>
              {speaking && (
                <button className="interrupt-button" onClick={interruptPatient} type="button">
                  <Square aria-hidden="true" size={14} /> Interrompre le patient
                </button>
              )}
              {chatPhase(phase) && (
                <button className={`conversation-toggle${conversation ? " active" : ""}`} onClick={() => (conversation ? stopConversation() : startConversation())} aria-pressed={conversation} type="button">
                  {conversation ? <><Square aria-hidden="true" size={15} /> Arrêter la conversation</> : <><Mic aria-hidden="true" size={17} /> Conversation vocale</>}
                </button>
              )}
              {!conversation && <button className="voice-toggle" onClick={toggleVoice} aria-pressed={voiceEnabled} type="button">{voiceEnabled ? "Voix du patient activée" : "Voix du patient coupée"}</button>}
              {voiceEnabled && voiceSource && (
                <p className="voice-source" role="status">
                  {voiceSource === "realiste" ? "Voix réaliste" : "Voix du navigateur — la voix réaliste n’a pas pris le relais"}
                  {process.env.NODE_ENV === "development" && voiceLatencyMs !== null ? ` · premier son à ${voiceLatencyMs} ms` : ""}
                </p>
              )}
              <p className="privacy-note">Les échanges de cette simulation servent uniquement à ton entraînement.</p>
            </aside>

            <section className="conversation-panel" aria-label="Entretien">
              {conversation && (
                <div className="voice-stage">
                  <span className="voice-stage-mic"><ListeningBars state={patientState} /></span>
                  <p className="voice-stage-status" role="status">{speaking ? "Le patient vous répond…" : loading && streamingText ? "Le patient prépare sa réponse…" : loading ? "Le patient réfléchit…" : listening ? "À vous : je vous écoute." : "Un instant…"}</p>
                  {speaking && (
                    <button className="interrupt-button" onClick={interruptPatient} type="button">
                      <Square aria-hidden="true" size={14} /> Interrompre et parler
                    </button>
                  )}
                  {lastSystemNote && <p className="voice-stage-note">{lastSystemNote}</p>}
                  <p className="voice-stage-heard">{input ? <><span>Compris</span> {input}</> : phase === "anamnese" ? "Parlez normalement. Pour passer à l’examen, dites « je vais vous examiner »." : "Vous pouvez encore poser une question au patient."}</p>
                  <button type="button" className="text-link" onClick={() => setShowTranscript((value) => !value)} aria-expanded={showTranscript}>{showTranscript ? "Masquer l’échange écrit" : "Afficher l’échange écrit"}</button>
                </div>
              )}

              <div className={`transcript${conversation && !showTranscript ? " is-collapsed" : ""}`} ref={transcriptRef} aria-live={conversation ? "off" : "polite"}>
                {messages.map((message, index) => {
                  const view = messageView(message);
                  return (
                    <div key={`${message.role}-${index}`} className={view.className}>
                      <span>{view.label === "Patient" ? patientShort : view.label}</span>
                      <p>{view.text}</p>
                    </div>
                  );
                })}
                {loading && (streamingText
                  ? <div className="message patient"><span>{patientShort}</span><p>{streamingText}</p></div>
                  : <div className="message patient loading-message"><span>{patientShort}</span><p><ListeningBars state="speaking" /><span className="sr-only">Le patient répond…</span></p></div>)}
              </div>

              {confirmingSynthesis && phase !== "synthese" && (
                <div className="ecos-confirm" role="alertdialog" aria-labelledby="ecos-confirm-title">
                  <p id="ecos-confirm-title"><strong>Passer à la synthèse ?</strong> {station.analysis ? "Tu ne pourras plus interroger le patient, réaliser de geste ni modifier ton analyse." : "Tu ne pourras plus interroger le patient ni réaliser de geste."}</p>
                  <div>
                    <button type="button" className="button secondary small" onClick={() => setConfirmingSynthesis(false)}>Continuer la station</button>
                    <button type="button" className="button primary small" disabled={openingSynthesis} onClick={() => void openSynthesis()}>Ouvrir la synthèse</button>
                  </div>
                </div>
              )}

              {phase === "anamnese" && !confirmingSynthesis && (
                <div className="ecos-phase-actions">
                  <p>Anamnèse terminée ? Annonce l’examen clinique.</p>
                  <button className="button quiet small" aria-disabled={busy || undefined} onClick={() => { if (!busy) void announceExam(); }} type="button">On passe à l’examen clinique</button>
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
                                <span className="procedure-box" aria-hidden="true">{done ? <Check size={14} /> : null}</span>{pendingProcedure === procedure.id ? "Résultat en cours…" : procedure.label}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    );
                  })}
                  <div className="ecos-last-result" aria-live="polite">
                    {lastResult
                      ? <><p><strong>{lastResult.label}</strong>{lastResult.result}</p><ProcedureFigure image={lastResult.image} /></>
                      : <p>Les résultats s’affichent ici et dans l’échange.</p>}
                  </div>
                  {!confirmingSynthesis && (
                    <div className="ecos-phase-actions">
                      <p>{performed.length} geste{performed.length > 1 ? "s" : ""} réalisé{performed.length > 1 ? "s" : ""}.</p>
                      <button className="button quiet small" aria-disabled={busy || undefined} onClick={() => { if (!busy) requestSynthesis(); }} type="button">{station.analysis ? "Passer à l’analyse des examens" : "Passer à la synthèse"}</button>
                    </div>
                  )}
                </div>
              )}

              {phase === "analyse" && (
                <form className="ecos-synthesis ecos-analysis" onSubmit={(event) => { event.preventDefault(); if (!busy) requestSynthesis(); }}>
                  <h2 ref={analysisHeadingRef} tabIndex={-1}>Analyse des examens</h2>
                  {examResults.length
                    ? <div className="ecos-exam-results">{examResults.map((item) => <div key={item.id}><p><strong>{item.label}</strong>{item.result}</p><ProcedureFigure image={item.image} /></div>)}</div>
                    : <p>Tu n’as demandé aucun examen complémentaire. <button type="button" className="text-link" onClick={() => goToPhase("examen")}>Revenir à l’examen clinique</button></p>}
                  <label className="ecos-synthesis-plan">
                    <span>Ton analyse : décris chaque examen de façon systématique, puis conclus</span>
                    <textarea maxLength={1200} rows={6} value={analysis} disabled={!examResults.length} onChange={(event) => setAnalysis(event.target.value)} placeholder="Ex. : radiographie de … face et profil, qualité correcte. Alignement…, corticales…, interligne…, parties molles… Conclusion : …" />
                  </label>
                  <div className="dictation-row">
                    <button type="button" className={`mic-button${dictatingField === "analysis" ? " recording" : ""}`} disabled={!examResults.length} onClick={() => toggleFieldDictation("analysis")} aria-pressed={dictatingField === "analysis"} aria-label={dictatingField === "analysis" ? "Arrêter la dictée de l’analyse" : "Dicter ton analyse"}>
                      {dictatingField === "analysis" ? <Square aria-hidden="true" size={16} /> : <Mic aria-hidden="true" size={19} />}
                    </button>
                    <span>{dictatingField === "analysis" ? "Je t’écoute, dicte ton analyse…" : "Tu peux aussi dicter ton analyse."}</span>
                  </div>
                  {dictationNote && <p role="alert" className="dictation-note">{dictationNote}</p>}
                  {!confirmingSynthesis && (
                    <div className="ecos-phase-actions">
                      <p>Ton analyse est notée dans la grille. Elle est enregistrée à l’ouverture de la synthèse.</p>
                      <button type="submit" className="button quiet small" aria-disabled={busy || undefined}>Passer à la synthèse</button>
                    </div>
                  )}
                </form>
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
                        ? <p role="alert">Les propositions n’ont pas pu être chargées. <button type="button" className="text-link" onClick={() => void openSynthesis()}>Réessayer</button></p>
                        : <p role="status">Chargement des propositions…</p>}
                  </fieldset>
                  <label className="ecos-synthesis-plan">
                    <span>Ta prise en charge : examens, traitements, orientation et ce que tu expliques au patient</span>
                    <textarea maxLength={1200} rows={5} value={plan} onChange={(event) => setPlan(event.target.value)} placeholder="Ex. : je donne…, j’appelle…, j’hospitalise en…, j’explique au patient que…" />
                  </label>
                  <div className="dictation-row">
                    <button type="button" className={`mic-button${dictatingField === "plan" ? " recording" : ""}`} onClick={() => toggleFieldDictation("plan")} aria-pressed={dictatingField === "plan"} aria-label={dictatingField === "plan" ? "Arrêter la dictée de la prise en charge" : "Dicter ta prise en charge"}>
                      {dictatingField === "plan" ? <Square aria-hidden="true" size={16} /> : <Mic aria-hidden="true" size={19} />}
                    </button>
                    <span>{dictatingField === "plan" ? "Je t’écoute, dicte ta prise en charge…" : "Tu peux aussi dicter ta prise en charge."}</span>
                  </div>
                  {dictationNote && <p role="alert" className="dictation-note">{dictationNote}</p>}
                  <div className="ecos-phase-actions">
                    <p>{diagnosis ? "Tu peux terminer la station." : "Choisis un diagnostic pour terminer."}</p>
                    <button type="submit" className="button primary" aria-disabled={busy || !diagnosis || undefined}>Terminer et voir le bilan</button>
                  </div>
                </form>
              )}

              {chatPhase(phase) && !conversation && (
                <>
                  <form className="composer" onSubmit={submit}>
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
                      type="button"
                      className={`mic-button${listening ? " recording" : ""}`}
                      disabled={loading}
                      onClick={startListening}
                      aria-pressed={listening}
                      aria-label={listening ? "Arrêter l’enregistrement vocal" : "Dicter une question au patient"}
                      title={listening ? "Enregistrement en cours…" : "Dicter ta question"}
                    >
                      {listening ? <Square aria-hidden="true" size={16} /> : <Mic aria-hidden="true" size={19} />}
                    </button>
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
                  <p className="composer-hint">{phase === "examen" ? "Les gestes se choisissent dans la liste ci-dessus." : "Une question à la fois fonctionne le mieux. Le micro dicte ta question ; la conversation vocale te laisse parler sans les mains."}</p>
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {screen === "report" && (
        <div className="report">
          <button className="text-link station-back" onClick={backToCatalog} type="button">Toutes les stations</button>
          <section className="report-hero">
            <div>
              <p className="briefing-meta">{result ? "Bilan enregistré" : "Station terminée"}, {mode === "exam" ? "mode examen" : "entraînement"}</p>
              <h1>{!result ? (saving ? "Correction en cours…" : "Bilan en attente.") : percent >= 70 ? "Des repères bien couverts." : "Une bonne base à consolider."}</h1>
              <p className="lead">{saving ? "Relecture de ta grille en cours…" : "Ce bilan repère les thèmes abordés dans ton entretien, tes gestes et ta synthèse, et ta façon de communiquer. Compare ta démarche au débriefing ci-dessous."}</p>
            </div>
            <div className="score-card">
              <p className="score"><strong>{result ? score : "…"}</strong><span>sur {maxScore} points</span></p>
              <div className="score-cells" aria-hidden="true">
                {Array.from({ length: maxScore }, (_, index) => <i className={result && index < filledPoints ? "is-on" : result && halfPoint && index === filledPoints ? "is-half" : ""} key={index} />)}
              </div>
              {result && <p className="score-foot"><span>{percent} %</span><span>+{result.xp} XP</span></p>}
            </div>
          </section>
          <section className="report-grid">
            <div className="rubric-card">
              <div className="section-heading"><h2>Ta grille</h2><strong>{score}/{maxScore}</strong></div>
              {criteria.map((criterion) => (
                <div className="rubric-row" key={criterion.id}>
                  <span className={criterion.earned === criterion.points ? "criterion-icon success" : criterion.earned > 0 ? "criterion-icon partial" : "criterion-icon"}>{criterion.earned === criterion.points ? "✓" : criterion.earned > 0 ? "~" : "!"}<span className="sr-only">{criterion.earned === criterion.points ? " couvert" : criterion.earned > 0 ? " en partie" : " manqué"}</span></span>
                  <div><strong>{criterion.label}</strong><p>{criterion.earned === criterion.points ? "Objectif couvert." : criterion.hint}</p>{criterion.reviewed ? <span className="review-badge">+{criterion.reviewed} à la relecture</span> : null}</div>
                  <b>{criterion.earned}/{criterion.points}</b>
                </div>
              ))}
              {result?.review?.done && (
                <p className="review-note">
                  {result.review.added > 0
                    ? `Grille relue par l’IA : ${result.review.added} point${result.review.added > 1 ? "s" : ""} ajouté${result.review.added > 1 ? "s" : ""} pour des questions posées avec d’autres mots.`
                    : "Grille relue par l’IA : rien à ajouter aux mots-clés."}
                </p>
              )}
            </div>
            <aside className="feedback-card">
              <h2>À retenir</h2>
              {result?.synthesis && (
                <div className={`feedback ${result.synthesis.chosen === result.synthesis.correct ? "good" : "improve"}`}>
                  <p><strong>{result.synthesis.chosen === result.synthesis.correct ? "Bon diagnostic" : "Diagnostic attendu"}</strong>{result.synthesis.chosen ? `Ton choix : ${result.synthesis.chosen}. ` : "Aucun diagnostic proposé. "}{result.synthesis.chosen === result.synthesis.correct ? "" : `Attendu : ${result.synthesis.correct}.`}</p>
                </div>
              )}
              {result && <div className="feedback good"><p><strong>Thème couvert</strong>{coveredCriterion?.label ?? "Aucun thème complètement repéré."}</p></div>}
              {result && <div className="feedback improve"><p><strong>À améliorer</strong>{missedCriterion?.hint ?? "Poursuis cette approche structurée."}</p></div>}
              <div className="feedback-actions">
                <button className="button primary full" disabled={saving || Boolean(stationError)} onClick={replay} type="button">Rejouer la station</button>
                <button className="button secondary full" onClick={backToCatalog} type="button">Choisir une autre station</button>
              </div>
            </aside>
          </section>

          {result?.communication && <CommunicationReport report={result.communication} />}

          {result?.procedures && (result.procedures.missed.length > 0 || result.procedures.unhelpful.length > 0) && (
            <section className="ecos-debrief ecos-procedure-feedback" aria-labelledby="procedures-title">
              <h2 id="procedures-title">Ton examen clinique</h2>
              <div className="ecos-debrief-grid">
                <DebriefList title="Gestes attendus non réalisés" items={result.procedures.missed} />
                <DebriefList title="Gestes peu utiles dans cette situation" items={result.procedures.unhelpful} />
              </div>
            </section>
          )}

          {result?.debrief ? (
            <section className="ecos-debrief" aria-labelledby="ecos-debrief-title">
              <h2 id="ecos-debrief-title">Débriefing</h2>
              <p className="debrief-dx voice">{result.debrief.diagnosis}</p>
              <p className="lead">{result.debrief.summary}</p>
              <div className="ecos-debrief-grid">
                <DebriefList title="Éléments clés du cas" items={result.debrief.keyFindings} />
                <DebriefList title="Drapeaux rouges" items={result.debrief.redFlags} />
                <DebriefList title="Prise en charge attendue" items={result.debrief.management} />
                <DebriefList title="Diagnostics différentiels" items={result.debrief.differentials} />
                {result.debrief.examReading && <DebriefList title="Lecture attendue des examens" items={result.debrief.examReading} />}
              </div>
              {result.debrief.fiches.length > 0 && (
                <div className="ecos-debrief-links">
                  <h3>Réviser avec les fiches</h3>
                  <div>{result.debrief.fiches.map((fiche) => <Link className="text-link" href={`/pathologies/${fiche.slug}`} key={fiche.slug}><BookOpen aria-hidden="true" size={15} /> {fiche.title}</Link>)}</div>
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
          {result && sessionId && !saving && <StationFeedback key={sessionId} sessionId={sessionId} />}
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
    onerror: ((event: { error?: string }) => void) | null;
    onresult: ((event: { results: ArrayLike<{ isFinal?: boolean; [index: number]: { transcript: string } }> }) => void) | null;
    start(): void;
    abort(): void;
  }
}
