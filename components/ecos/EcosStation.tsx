"use client";
/* eslint-disable @next/next/no-img-element -- images d’examens déposées dans public/ecos/, dimensions inconnues : le composant Image de Next exige largeur et hauteur. */

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Mic, SendHorizontal, Square } from "lucide-react";
import { ANNOUNCE_PREFIX, EXAMINER_PREFIX, isExamTransition, normalizeEcosText, PROCEDURE_PREFIX } from "@/lib/ecos/text";
import type { EcosCriterion, EcosMessage, EcosMode, EcosProcedure, EcosStationView } from "@/lib/ecos/types";
import type { EcosDebriefView } from "@/lib/ecos/debrief";
import { LICENSE_URLS } from "@/lib/ecos/image-credits";
import type { EcosCommunicationReport } from "@/lib/ecos/communication";
import { BRAND_NAME } from "@/lib/brand";
import { ListeningBars } from "@/components/brand/BrandLogo";
import { examSignal, remainingSeconds } from "@/lib/ecos/timing";
import { playExamSignal } from "./exam-signal";
import { readChatEvents } from "@/lib/ecos/chat-stream";
import { joinTranscripts, SERVER_SPEECH_END_SILENCE_MS, SPEECH_END_SILENCE_MS, SPEECH_PAUSE_MS } from "@/lib/ecos/dictation";
import { base64AudioBlob, PatientVoicePlayer } from "./patient-voice";
import { StationFeedback } from "./StationFeedback";
import { DiagnosisPicker } from "./DiagnosisPicker";
import { canCaptureVoice, MicrophoneUnavailableError, VoiceCapture } from "./voice-capture";
import { FOLLOW_UP_QUESTIONS, MAX_FOLLOW_UP_LENGTH, type FollowUpId } from "@/lib/ecos/follow-ups";
import { CommunicationReport, DebriefList, messageView } from "./StationReport";

type Screen = "briefing" | "station" | "report";
type Phase = "anamnese" | "examen" | "analyse" | "synthese";

export type CompletionResponse = {
  xp: number;
  /** Détail de l'XP gagnée (absent quand on rouvre un bilan déjà enregistré). */
  xpLines?: Array<{ label: string; xp: number }>;
  score: number;
  maxScore: number;
  criteria: EcosCriterion[];
  synthesis?: { chosen: string | null; correct: string };
  procedures?: { missed: string[]; unhelpful: string[] };
  /** Relecture de la grille par le modèle (questions posées autrement). */
  review?: { done: boolean; added: number };
  communication?: EcosCommunicationReport;
  /** Entretien relu : chaque message porte les lignes de grille qu'il a fait gagner. */
  interview?: Array<{ role: "student" | "patient" | "examiner" | "gesture" | "plan" | "announce"; text: string; criteria: string[] }>;
  /** Tempérament joué par le patient pendant cette séance. */
  patientVariant?: string;
  /** Retour formatif sur l'annonce au patient (hors note). */
  announcement?: { done: boolean; nextSteps: boolean; empathy: boolean; understanding: boolean; jargon: Array<{ term: string; plain: string }>; tips: string[] };
  /** Diagnostics différentiels choisis, comparés à ceux du débriefing (hors note). */
  differentials?: { chosen: Array<{ label: string; expected: boolean }>; expected: Array<{ label: string; found: boolean }> };
  /** Relances de l'examinateur : réponse de l'étudiant et éléments attendus. */
  followUps?: Array<{ id: string; question: string; answer: string; expected: string[] }>;
  debrief?: EcosDebriefView;
};

const ANNOTATED_ROLE = { student: "Toi", patient: "Patient", examiner: "Examinateur", gesture: "Geste", plan: "Prise en charge", announce: "Annonce" } as const;

/** Champ libre qui accepte la dictée : analyse, prise en charge, réponses aux relances. */
type DictationField = "analysis" | "plan" | "announcement" | FollowUpId;

const REPORT_TABS = [
  { id: "grid", label: "Grille" },
  { id: "interview", label: "Entretien annoté" },
  { id: "communication", label: "Communication" },
  { id: "exam", label: "Examen clinique" },
  { id: "debrief", label: "Débriefing" },
] as const;
type ReportTab = (typeof REPORT_TABS)[number]["id"];

/**
 * Compte de 0 à `target` en ~0,9 s quand `active` devient vrai (score et XP
 * du bilan). Sans animation si l'utilisateur la refuse.
 */
function useCountUp(target: number, active: boolean): number {
  const [value, setValue] = useState(0);
  // Lu au rendu : le bilan n'existe jamais au premier rendu serveur, pas de décalage d'hydratation.
  const reduced = typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (!active || reduced) return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 900);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target, active, reduced]);
  return !active || reduced ? target : value;
}

const SYNTHESIS_STEPS = ["Diagnostic", "Prise en charge", "Annonce", "Examinateur"] as const;

/** Messages d'annonce au patient permis (comme côté serveur). */
const MAX_ANNOUNCEMENTS = 4;

const SETTING_LABEL = { urgences: "Urgences", cabinet: "Cabinet" } as const;

type ProcedureImage = NonNullable<EcosProcedure["image"]>;
type TranscriptionOutcome = { text: string } | { unavailable: true } | { error: string };
type ProcedureResult = { label: string; result: string; image: ProcedureImage | null };

/** Image d'un examen (ECG, radio…), reçue avec son résultat. */
function ProcedureFigure({ image }: { image: ProcedureImage | null }) {
  if (!image) return null;
  return (
    <figure className="ecos-procedure-image">
      <a href={image.src} target="_blank" rel="noopener noreferrer" aria-label={`${image.alt} (agrandir dans un nouvel onglet)`}><img src={image.src} alt={image.alt} loading="lazy" /></a>
      <figcaption>
        {image.alt}
        {image.credit && <small> · Image : {image.credit.author}, <a href={LICENSE_URLS[image.credit.license]} target="_blank" rel="noopener noreferrer">{image.credit.license}</a>, Wikimedia Commons</small>}
      </figcaption>
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

/** Abréviations courantes tapées dans la recherche d'examens. */
const EXAM_SEARCH_ALIASES: Readonly<Record<string, string>> = {
  rx: "radiographie", radio: "radiographie", scanner: "ct", tdm: "ct", nfs: "formule", bu: "bandelette",
  ta: "tension", sat: "constantes", saturation: "constantes", temperature: "constantes", fc: "constantes",
  gaz: "gazometrie", pl: "ponction lombaire", hcg: "grossesse", bnp: "probnp", gcs: "glasgow",
};

/** Examens du catalogue dont le libellé contient chaque mot tapé (accents et casse ignorés). */
function searchExams<T extends { label: string }>(items: readonly T[], query: string): T[] {
  const words = normalizeEcosText(query).trim().split(" ").filter(Boolean).map((word) => EXAM_SEARCH_ALIASES[word] ?? word);
  if (!words.length) return [];
  return items.filter((item) => {
    const label = normalizeEcosText(item.label);
    return words.every((word) => label.includes(word));
  });
}

/** Ordre d'affichage des catégories du catalogue d'examens. */
const EXAM_GROUP_ORDER: readonly string[] = [
  "Constantes et mesures", "État général et peau", "Cœur et vaisseaux", "Poumons", "Abdomen et urogénital",
  "Neurologie et psychiatrie", "ORL et cou", "Appareil locomoteur", "Biologie sanguine", "Urines et prélèvements",
  "ECG et explorations", "Imagerie", "Scores et questionnaires",
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

/** Bilan déjà enregistré, rouvert depuis l'historique (`/historique/[id]`). */
export type SavedReport = { sessionId: string; mode: EcosMode; report: CompletionResponse };

/** Place de la station dans un examen blanc (`/examen-blanc/station`) : plan, étape, sessions déjà jouées. */
export type MockCircuit = { plan: string[]; step: number; sessions: string[] };

export function EcosStation({ station, serverTranscription = false, savedReport = null, circuit = null }: { station: EcosStationView; serverTranscription?: boolean; savedReport?: SavedReport | null; circuit?: MockCircuit | null }) {
  const router = useRouter();
  const examSeconds = station.examDurationSeconds;
  const [screen, setScreen] = useState<Screen>(savedReport ? "report" : "briefing");
  const [phase, setPhase] = useState<Phase>("anamnese");
  // Examen blanc : toujours en conditions d'examen.
  const [mode, setMode] = useState<EcosMode>(circuit ? "exam" : savedReport?.mode ?? "training");
  const [secondsLeft, setSecondsLeft] = useState(examSeconds);
  // Mode examen : signal sonore et message à 2 minutes de la fin, puis à la fin.
  const [examNotice, setExamNotice] = useState<string | null>(null);
  const previousSecondsLeft = useRef(examSeconds);
  const signalContextRef = useRef<AudioContext | null>(null);
  const [messages, setMessages] = useState<EcosMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  // Question enregistrée, en cours de transcription par le serveur.
  const [transcribing, setTranscribing] = useState(false);
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
  // Recherche dans le catalogue d'examens, commun à toutes les stations.
  const [examQuery, setExamQuery] = useState("");
  const [pendingProcedure, setPendingProcedure] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ProcedureResult | null>(null);
  const [confirmingSynthesis, setConfirmingSynthesis] = useState(false);
  const [openingSynthesis, setOpeningSynthesis] = useState(false);
  // La synthèse n'a pas pu s'ouvrir côté serveur (réseau) : l'étudiant peut réessayer.
  const [synthesisError, setSynthesisError] = useState(false);
  // Identifiants de la liste commune des diagnostics (lib/ecos/diagnosis-catalog.ts).
  const [diagnosis, setDiagnosis] = useState("");
  const [differentials, setDifferentials] = useState<string[]>([]);
  const [plan, setPlan] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [examResults, setExamResults] = useState<Array<ProcedureResult & { id: string }>>([]);
  const [result, setResult] = useState<CompletionResponse | null>(savedReport?.report ?? null);
  const [sessionId, setSessionId] = useState<string | null>(savedReport?.sessionId ?? null);
  const deadline = useRef(0);
  const startLock = useRef(false);
  const finishLock = useRef(false);
  const messageLock = useRef(false);
  const pendingMessage = useRef<Promise<void> | null>(null);
  const pendingGesture = useRef<Promise<void> | null>(null);
  // Réponses aux relances de l'examinateur, écrites ou dictées en fin de synthèse.
  const [followUps, setFollowUps] = useState<Partial<Record<FollowUpId, string>>>({});
  // Annonce au patient, pendant la synthèse.
  const [announceInput, setAnnounceInput] = useState("");
  // Synthèse en étapes courtes : diagnostic, prise en charge, annonce, questions de l'examinateur.
  const [synthesisStep, setSynthesisStep] = useState(0);
  // Bilan : onglet affiché sous le résumé.
  const [reportTab, setReportTab] = useState<ReportTab>("grid");
  const synthesisRef = useRef<{ diagnosis: string; differentials: string[]; plan: string; analysis: string; followUps: Partial<Record<FollowUpId, string>> }>({ diagnosis: "", differentials: [], plan: "", analysis: "", followUps: {} });
  const phaseRef = useRef<Phase>("anamnese");
  const examAnnounced = useRef(false);
  const focusOnPhase = useRef(false);
  const examHeadingRef = useRef<HTMLHeadingElement>(null);
  const analysisHeadingRef = useRef<HTMLHeadingElement>(null);
  const synthesisHeadingRef = useRef<HTMLHeadingElement>(null);
  // Micro ouvert pour une question : `send` envoie ce qui a été entendu, `cancel` le jette.
  const listeningRef = useRef<{ send: () => void; cancel: () => void } | null>(null);
  // Transcription serveur (Scribe) tant qu'elle répond ; sinon dictée du navigateur.
  const serverTranscriptionRef = useRef(serverTranscription);
  const transcribingRef = useRef(false);
  const captureRef = useRef<VoiceCapture | null>(null);
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
  // Le score et l'XP se remplissent à l'arrivée du bilan.
  const shownScore = useCountUp(score, Boolean(result));
  const shownXp = useCountUp(result?.xp ?? 0, Boolean(result));
  const coveredCriterion = criteria.find((criterion) => criterion.earned === criterion.points);
  // Ligne qui a coûté le plus de points : la priorité pour la prochaine fois.
  const missedCriterion = [...criteria].filter((criterion) => criterion.earned < criterion.points).sort((left, right) => (right.points - right.earned) - (left.points - left.earned))[0];
  const timed = mode === "exam";
  const timeOver = timed && secondsLeft === 0;
  const busy = loading || saving || Boolean(pendingProcedure) || openingSynthesis;
  // En conversation vocale l'échange écrit est replié : la dernière note de l'interface doit rester visible.
  const lastMessage = messages.at(-1);
  const lastSystemNote = lastMessage?.role === "system" ? lastMessage.content : null;

  useEffect(() => { synthesisRef.current = { diagnosis, differentials, plan, analysis, followUps }; }, [diagnosis, differentials, plan, analysis, followUps]);

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
    setSynthesisStep(0);
    setReportTab("grid");
    examAnnounced.current = false;
    setMessages([]);
    setPerformed([]);
    setLastResult(null);
    setConfirmingSynthesis(false);
    setSynthesisError(false);
    setDiagnosis("");
    setDifferentials([]);
    setPlan("");
    setAnalysis("");
    setExamResults([]);
    setResult(null);
    setStationError(null);
    setSecondsLeft(examSeconds);
  }

  async function startStation() {
    if (startLock.current) return;
    // Créé dans le clic : sans geste de l'utilisateur, le signal resterait muet.
    if (mode === "exam" && !signalContextRef.current && typeof AudioContext !== "undefined") signalContextRef.current = new AudioContext();
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

  /** `announcement` : explication au patient pendant la synthèse, hors notation. */
  async function sendMessage(content: string, stage: "interview" | "announcement" = "interview") {
    const clean = content.trim();
    const open = stage === "announcement" ? phaseRef.current === "synthese" : chatPhase(phaseRef.current);
    if (!clean || clean.length > 800 || messageLock.current || finishLock.current || !sessionId || screen !== "station" || !open || timeOver) return;
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
          body: JSON.stringify({ message: clean, sessionId, voice: Boolean(player?.serverVoice), ...(stage === "announcement" ? { stage } : {}) }), signal: AbortSignal.timeout(40_000),
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
        setMessages((current) => [...current, { role: "student", content: stage === "announcement" ? `${ANNOUNCE_PREFIX}${clean}` : clean }, { role: "patient", content: patientReply }]);
        // « On passe à l’examen clinique » : le médecin annonce l’examen.
        if (stage === "interview" && isExamTransition(clean)) enterExamPhase();
      } catch (error) {
        if (stage === "announcement") setAnnounceInput(clean); else setInput(clean);
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

  /** Bouton d'un examen du catalogue : coché une fois demandé. */
  function examButton(procedure: EcosStationView["procedures"][number], onChosen?: () => void) {
    const done = performed.includes(procedure.id);
    const unavailable = done || busy || timeOver;
    return (
      <button key={procedure.id} type="button" className={done ? "done" : ""} aria-pressed={done} aria-disabled={unavailable || undefined} onClick={() => { if (unavailable) return; onChosen?.(); void performProcedure(procedure.id); }}>
        <span className="procedure-box" aria-hidden="true">{done ? <Check size={14} /> : null}</span>{pendingProcedure === procedure.id ? "Résultat en cours…" : procedure.label}
      </button>
    );
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
    setSynthesisError(false);
    changePhase("synthese");
    try {
      await pendingMessage.current;
      await pendingGesture.current;
      // L'analyse écrite est enregistrée à l'ouverture ; l'entretien et l'examen se ferment.
      const response = await fetch(`/api/ecos/session/${sessionId}/synthesis`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ analysis: synthesisRef.current.analysis }), signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error("Synthèse indisponible");
    } catch { setSynthesisError(true); }
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
    listeningRef.current?.cancel();
    captureRef.current?.release();
    if (note) setMessages((current) => [...current, { role: "system", content: note }]);
  }

  /**
   * Ouvre le micro pour une question. Le mode conversation le rappelle après
   * chaque réponse. La question part après un silence de
   * SPEECH_END_SILENCE_MS, pas à la première pause que le navigateur valide.
   */
  function beginListening() {
    if (listeningRef.current || transcribingRef.current || loading || finishLock.current || screen !== "station" || !chatPhase(phaseRef.current)) return;
    // Couper le patient avant d'ouvrir le micro : sinon la dictée transcrit sa voix.
    stopSpeaking();
    if (serverTranscriptionRef.current && canCaptureVoice()) { listenWithServer(); return; }
    const BrowserRecognition = (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition; SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!BrowserRecognition) {
      const note = "La dictée vocale n’est pas disponible dans ce navigateur. Tu peux écrire ta question.";
      if (conversationRef.current) stopConversation(note);
      else setMessages((current) => [...current, { role: "system", content: note }]);
      return;
    }
    const recognition = new BrowserRecognition();
    const startedAt = Date.now();
    let finished = false;
    let showedInterim = false;
    let lastHeardAt = 0;
    let finals: string[] = [];
    let interim = "";
    let silenceTimer: number | undefined;
    const heardText = () => joinTranscripts([...finals, interim]);
    // Ferme le micro ; `send` envoie la question entendue, sinon elle est jetée.
    const finish = (send: boolean) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(silenceTimer);
      if (listeningRef.current === control) listeningRef.current = null;
      setListening(false);
      const heard = send ? heardText().slice(0, 800) : "";
      if (heard) {
        if (lastHeardAt) logTiming("silence→question", lastHeardAt);
        quickMicFailures.current = 0;
        void sendMessage(heard);
      }
      // N'efface que le texte provisoire de la dictée, jamais une question tapée au clavier.
      else if (showedInterim) setInput("");
      try { recognition.abort(); } catch { /* déjà fermé */ }
      return heard;
    };
    const control = { send: () => { finish(true); }, cancel: () => { finish(false); } };
    listeningRef.current = control;
    recognition.lang = "fr-FR";
    // Les résultats provisoires montrent à l'étudiant ce que le micro comprend.
    recognition.interimResults = true;
    // Le micro reste ouvert pendant les pauses ; le silence décide de l'envoi.
    recognition.continuous = true;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      if (finished) return;
      // Le navigateur a fermé le micro de lui-même : ce qui a été dit part quand même.
      if (finish(true)) return;
      // Un micro qui se referme aussitôt, plusieurs fois de suite, ne marchera pas mieux au tour suivant.
      quickMicFailures.current = Date.now() - startedAt < 1_200 ? quickMicFailures.current + 1 : 0;
      if (conversationRef.current && quickMicFailures.current >= 4) {
        quickMicFailures.current = 0;
        stopConversation("Le micro se coupe aussitôt ouvert. La conversation vocale est en pause : vérifie ton micro, ou écris ta question.");
      }
    };
    recognition.onerror = (event) => {
      // Un silence ou une interruption volontaire ne sont pas des pannes.
      if (event.error === "no-speech" || event.error === "aborted") return;
      finish(false);
      if (!conversationRef.current) return;
      stopConversation(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Le navigateur n’a pas accès au micro. Autorise-le pour ce site, puis relance la conversation vocale."
        : "La dictée vocale s’est interrompue. Relance la conversation vocale, ou écris ta question.");
    };
    recognition.onresult = (event) => {
      if (finished) return;
      const nextFinals: string[] = [];
      let nextInterim = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) nextFinals.push(text); else nextInterim += text;
      }
      finals = nextFinals;
      interim = nextInterim;
      const heard = heardText();
      if (!heard) return;
      showedInterim = true;
      lastHeardAt = performance.now();
      setInput(heard);
      // Chaque mot perçu repousse l'envoi : une pause pour réfléchir ne coupe plus la phrase.
      window.clearTimeout(silenceTimer);
      silenceTimer = window.setTimeout(() => finish(true), SPEECH_END_SILENCE_MS);
    };
    try { recognition.start(); } catch { finish(false); }
  }

  /** Note de la station : dans l'échange, et sur la scène vocale en conversation. */
  function systemNote(content: string) {
    setMessages((current) => [...current, { role: "system", content }]);
  }

  /**
   * Envoie un enregistrement à /api/ecos/transcribe. `unavailable` (503) :
   * transcription non configurée ou quota atteint.
   */
  async function requestTranscription(audio: Blob, signal?: AbortSignal): Promise<TranscriptionOutcome> {
    if (!sessionId) return { text: "" };
    try {
      const form = new FormData();
      form.set("sessionId", sessionId);
      form.set("audio", audio, "dictee");
      const timeout = AbortSignal.timeout(20_000);
      const response = await fetch("/api/ecos/transcribe", { method: "POST", body: form, signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
      if (response.status === 503) return { unavailable: true };
      if (!response.ok) return { error: await apiErrorMessage(response, "") };
      const data = await response.json() as { text?: unknown };
      return { text: typeof data.text === "string" ? data.text.trim() : "" };
    } catch {
      return { error: "" };
    }
  }

  /**
   * Texte compris d'un enregistrement. `early` : transcription lancée par
   * anticipation à la dernière pause, sur le même audio ; si elle a échoué,
   * l'enregistrement complet est transcrit. Sur 503, la dictée du navigateur
   * prend le relais pour la suite de la station.
   */
  async function transcribeAudio(audio: Blob, onNote: (note: string) => void, early?: Promise<TranscriptionOutcome> | null): Promise<string | null> {
    transcribingRef.current = true;
    setTranscribing(true);
    try {
      let outcome = early ? await early : null;
      if (!outcome || "error" in outcome) outcome = await requestTranscription(audio);
      if ("unavailable" in outcome) {
        serverTranscriptionRef.current = false;
        onNote("La transcription n’est pas disponible pour le moment : la dictée du navigateur prend le relais. Répète ta phrase.");
        return null;
      }
      if ("error" in outcome) {
        onNote(outcome.error || "Ta phrase n’a pas pu être transcrite. Répète-la, ou écris-la.");
        return null;
      }
      return outcome.text;
    } finally {
      transcribingRef.current = false;
      setTranscribing(false);
    }
  }

  /**
   * Transcription serveur : le micro enregistre jusqu'au silence (ou au second
   * clic), puis le texte compris part au patient. Dès une courte pause,
   * l'audio part déjà en transcription : si l'étudiant a fini, le texte est
   * prêt quand le silence le confirme ; s'il reprend, ce résultat est jeté.
   */
  function listenWithServer() {
    const capture = (captureRef.current ??= new VoiceCapture());
    const startedAt = Date.now();
    const early: { current: { abort: AbortController; outcome: Promise<TranscriptionOutcome> } | null } = { current: null };
    const dropEarly = () => { early.current?.abort.abort(); early.current = null; };
    const handle = capture.listen({
      silenceMs: SERVER_SPEECH_END_SILENCE_MS,
      maxMs: 45_000,
      pauseMs: SPEECH_PAUSE_MS,
      onPause: (audio) => {
        dropEarly();
        const abort = new AbortController();
        early.current = { abort, outcome: requestTranscription(audio, abort.signal) };
      },
      onResume: dropEarly,
    });
    let cancelled = false;
    // Un envoi au clic peut couper une phrase en cours : l'anticipation ne vaut plus.
    const control = { send: () => { dropEarly(); handle.finish(true); }, cancel: () => { cancelled = true; dropEarly(); handle.finish(false); } };
    listeningRef.current = control;
    setListening(true);
    void (async () => {
      let audio: Blob | null = null;
      let failure: unknown = null;
      try { audio = await handle.result; } catch (error) { failure = error; }
      if (listeningRef.current === control) listeningRef.current = null;
      setListening(false);
      // Hors conversation, le micro est rendu aussitôt : le navigateur cesse d'afficher l'enregistrement.
      if (!conversationRef.current) capture.release();
      if (failure) {
        if (failure instanceof MicrophoneUnavailableError) {
          const note = "Le navigateur n’a pas accès au micro. Autorise-le pour ce site, puis relance la conversation vocale.";
          if (conversationRef.current) stopConversation(note); else systemNote(note);
        } else {
          // Enregistrement impossible dans ce navigateur : sa propre dictée prend le relais.
          serverTranscriptionRef.current = false;
          systemNote("L’enregistrement n’a pas pu démarrer : la dictée du navigateur prend le relais. Répète ta question.");
        }
        return;
      }
      if (cancelled || !audio) dropEarly();
      if (cancelled) return;
      if (!audio) {
        // Un micro qui se referme aussitôt, plusieurs fois de suite, ne marchera pas mieux au tour suivant.
        quickMicFailures.current = Date.now() - startedAt < 1_200 ? quickMicFailures.current + 1 : 0;
        if (conversationRef.current && quickMicFailures.current >= 4) {
          quickMicFailures.current = 0;
          stopConversation("Le micro se coupe aussitôt ouvert. La conversation vocale est en pause : vérifie ton micro, ou écris ta question.");
        }
        return;
      }
      quickMicFailures.current = 0;
      const text = await transcribeAudio(audio, systemNote, early.current?.outcome);
      if (process.env.NODE_ENV === "development") console.info(`micro transcription : « ${text} »`);
      // Échec déjà signalé par transcribeAudio.
      if (text === null) return;
      // Rien compris (bruit, toux, voix trop basse) : le dire plutôt que d'attendre en silence.
      if (!text) { systemNote("Je n’ai pas compris ta question. Répète-la un peu plus fort, ou écris-la."); return; }
      if (!finishLock.current) void sendMessage(text.slice(0, 800));
    })();
  }

  /** Bouton micro du champ de saisie : un clic ouvre le micro, un second envoie ce qui a été dit. */
  function startListening() {
    if (listeningRef.current) { listeningRef.current.send(); return; }
    beginListening();
  }

  // Dictée dans un champ libre (analyse, prise en charge) : le texte reconnu
  // s'ajoute au champ, rien n'est envoyé au patient.
  const [dictatingField, setDictatingField] = useState<DictationField | null>(null);
  const [dictationNote, setDictationNote] = useState<string | null>(null);
  const fieldRecognitionRef = useRef<SpeechRecognition | null>(null);
  const fieldCaptureRef = useRef<{ finish: (keep: boolean) => void } | null>(null);
  const [transcribingField, setTranscribingField] = useState<DictationField | null>(null);

  function fieldValue(field: DictationField): string {
    if (field === "announcement") return announceInput;
    return field === "analysis" ? analysis : field === "plan" ? plan : followUps[field] ?? "";
  }

  /** Complète un champ libre avec le texte dicté, dans la limite de sa longueur. */
  function updateField(field: DictationField, next: (current: string) => string) {
    const limit = field === "analysis" || field === "plan" ? 1200 : MAX_FOLLOW_UP_LENGTH;
    const bounded = (current: string) => next(current).slice(0, limit);
    if (field === "announcement") setAnnounceInput(bounded);
    else if (field === "analysis") setAnalysis(bounded);
    else if (field === "plan") setPlan(bounded);
    else setFollowUps((current) => ({ ...current, [field]: bounded(current[field] ?? "") }));
  }

  /** Dictée d'un champ par la transcription serveur : enregistre jusqu'au second clic, puis complète le champ. */
  function dictateFieldWithServer(field: DictationField) {
    const capture = (captureRef.current ??= new VoiceCapture());
    const handle = capture.listen({ silenceMs: null, maxMs: 120_000 });
    fieldCaptureRef.current = handle;
    setDictationNote(null);
    setDictatingField(field);
    void (async () => {
      let audio: Blob | null = null;
      try { audio = await handle.result; } catch (error) {
        if (!(error instanceof MicrophoneUnavailableError)) serverTranscriptionRef.current = false;
        setDictationNote(error instanceof MicrophoneUnavailableError
          ? "Le navigateur n’a pas accès au micro. Autorise-le pour ce site, puis réessaie."
          : "L’enregistrement n’a pas pu démarrer. Réessaie : la dictée du navigateur prend le relais.");
      }
      fieldCaptureRef.current = null;
      setDictatingField(null);
      if (!conversationRef.current) capture.release();
      if (!audio) return;
      setTranscribingField(field);
      const text = await transcribeAudio(audio, setDictationNote);
      setTranscribingField(null);
      if (!text) return;
      updateField(field, (current) => `${current.replace(/\s+$/, "")}${current.trim() ? " " : ""}${text}`);
    })();
  }

  function toggleFieldDictation(field: DictationField) {
    if (fieldCaptureRef.current) { fieldCaptureRef.current.finish(true); return; }
    if (transcribingRef.current) return;
    if (!fieldRecognitionRef.current && serverTranscriptionRef.current && canCaptureVoice()) { dictateFieldWithServer(field); return; }
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
    // Le micro reste ouvert pendant les pauses, jusqu'au second clic.
    recognition.continuous = true;
    recognition.onend = () => { fieldRecognitionRef.current = null; setDictatingField(null); };
    recognition.onerror = (event) => {
      fieldRecognitionRef.current = null;
      setDictatingField(null);
      if (event.error === "no-speech" || event.error === "aborted") return;
      setDictationNote(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Le navigateur n’a pas accès au micro. Autorise-le pour ce site, puis réessaie."
        : "La dictée s’est interrompue. Réessaie, ou écris au clavier.");
    };
    // Le texte déjà écrit reste en tête ; la dictée de cette prise le complète.
    const before = fieldValue(field).replace(/\s+$/, "");
    recognition.onresult = (event) => {
      const finals: string[] = [];
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finals.push(result[0]?.transcript ?? "");
      }
      const text = joinTranscripts(finals);
      if (!text) return;
      updateField(field, () => `${before ? `${before} ` : ""}${text}`);
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
    listeningRef.current?.cancel();
    captureRef.current?.release();
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

  useEffect(() => {
    const signal = timed && screen === "station" ? examSignal(previousSecondsLeft.current, secondsLeft) : null;
    previousSecondsLeft.current = secondsLeft;
    if (!signal) return;
    playExamSignal(signalContextRef.current, signal);
    if (signal === "warning") {
      setExamNotice("Il reste 2 minutes.");
      const timer = window.setTimeout(() => setExamNotice(null), 8_000);
      return () => window.clearTimeout(timer);
    }
  }, [secondsLeft, timed, screen]);

  useEffect(() => () => { void signalContextRef.current?.close().catch(() => undefined); }, []);

  // Mode conversation : dès que personne ne parle ni ne réfléchit, le micro se rouvre.
  const conversationIdle = conversation && screen === "station" && chatPhase(phase) && !timeOver
    && !loading && !transcribing && !speaking && !listening && !saving && !pendingProcedure && !openingSynthesis && !confirmingSynthesis;
  useEffect(() => {
    if (!conversationIdle) return;
    // Court répit : la fin d'une réplique ne doit pas être prise pour une question.
    const timer = window.setTimeout(() => beginListening(), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- beginListening est recréée à chaque rendu ; seul l'état d'attente doit relancer le micro.
  }, [conversationIdle]);

  useEffect(() => () => { window.clearTimeout(speakingWatchdog.current); playerRef.current?.stop(); listeningRef.current?.cancel(); captureRef.current?.release(); }, []);

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
  // Examen blanc : le rang dans le circuit, puis « d'examen blanc » quand le bilan est rouvert.
  const stationNumber = circuit ? String(circuit.step + 1) : station.code.startsWith("blanc-") ? "d’examen blanc" : station.code.replace(/^station-/, "");
  // Ni spécialité ni titre éditorial : la feuille de porte suffit, comme au vrai ECOS.
  const briefingMeta = SETTING_LABEL[station.setting];
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
          {circuit ? <Link className="text-link station-back" href="/examen-blanc">Quitter l’examen blanc</Link> : <button className="text-link station-back" onClick={backToCatalog} type="button">Toutes les stations</button>}
          <div className="briefing-grid">
            <section className="briefing-main">
              <p className="briefing-meta">{circuit ? `Examen blanc · station ${circuit.step + 1} sur ${circuit.plan.length} · ${briefingMeta}` : briefingMeta}</p>
              <h1>Station {stationNumber}</h1>
              <div className="consigne">
                <h2>Consigne au candidat</h2>
                {station.brief.map((line, index) => index === 1 ? <p key={line}><strong>{line}</strong></p> : <p key={line}>{line}</p>)}
              </div>
              <h2 className="briefing-subtitle">Le déroulé</h2>
              <ol className="ecos-brief-steps">
                <li><strong>Anamnèse.</strong> Interroge le patient, à l’écrit ou à la voix.</li>
                <li><strong>Examen clinique.</strong> Annonce-le (« On passe à l’examen clinique ») puis choisis tes gestes et tes examens ; chacun débloque son résultat. Les gestes inutiles coûtent des points.</li>
                <li><strong>Synthèse.</strong> Ton diagnostic principal et ta prise en charge, puis l’annonce au patient et les questions de l’examinateur. Une fois la synthèse ouverte, l’entretien et l’examen sont terminés.</li>
                <li><strong>Bilan.</strong> Ta grille, ton entretien annoté et le débriefing, avec l’XP gagnée.</li>
              </ol>
              {circuit ? <p className="circuit-note">Examen blanc : {examMinutes} minutes, conditions d’examen, bilan à la fin du circuit.</p> : <fieldset className="ecos-mode-options">
                <legend>Choisis tes conditions</legend>
                <label htmlFor="ecos-training" aria-label="Mode entraînement"><input id="ecos-training" type="radio" name="ecos-mode" checked={mode === "training"} onChange={() => setMode("training")} /><span><strong>Entraînement</strong><small>Sans chronomètre. La grille et les conseils arrivent au bilan, à la fin.</small></span></label>
                <label htmlFor="ecos-exam" aria-label="Mode examen"><input id="ecos-exam" type="radio" name="ecos-mode" checked={mode === "exam"} onChange={() => setMode("exam")} /><span><strong>Examen</strong><small>{examMinutes} minutes pour toute la station, comme le jour de l’examen.</small></span></label>
              </fieldset>}
            </section>
            <aside className="briefing-patient" aria-label="Patient">
              <span className="patient-mark"><ListeningBars /></span>
              <p className="patient-name voice">{station.patientLabel}</p>
              <p className="patient-kind">Patient simulé, répond à l’écrit et à la voix</p>
              <dl className="briefing-facts">
                <div><dt>{mode === "exam" ? "Temps disponible" : "Chronomètre"}</dt><dd>{mode === "exam" ? formatTime(examSeconds) : "Aucun"}</dd></div>
                {circuit ? <div><dt>Station</dt><dd>{circuit.step + 1} sur {circuit.plan.length}</dd></div> : <div><dt>Points possibles</dt><dd>{station.maxScore}</dd></div>}
              </dl>
              <ul className="briefing-tips">
                <li>Micro recommandé</li>
                <li>Réponses vocales en français</li>
                <li>{circuit ? "Bilan global à la fin du circuit" : "Débriefing et sources après la station"}</li>
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
                ? <div className={`timer${secondsLeft <= 120 ? " timer-alert" : ""}`} role="timer" aria-live="off"><span>Temps restant</span><strong>{formatTime(secondsLeft)}</strong>{examNotice && <span className="exam-signal" role="alert">{examNotice}</span>}</div>
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
                  <p className="patient-status" role="status">{speaking ? "Vous répond…" : loading && streamingText ? "Prépare sa réponse…" : loading || transcribing ? "Réfléchit…" : listening ? "Vous écoute…" : phase === "examen" ? "Examen en cours" : !chatPhase(phase) ? "Attend vos conclusions" : "En consultation"}</p>
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

            <section className={`conversation-panel${phase !== "anamnese" ? " is-working" : ""}`} aria-label="Entretien">
              {conversation && (
                <div className="voice-stage">
                  <span className="voice-stage-mic"><ListeningBars state={patientState} /></span>
                  <p className="voice-stage-status" role="status">{speaking ? "Le patient vous répond…" : loading && streamingText ? "Le patient prépare sa réponse…" : loading || transcribing ? "Le patient réfléchit…" : listening ? "À vous : je vous écoute." : "Un instant…"}</p>
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

              {/* Panneau de travail : à droite de l'échange sur grand écran dès l'examen clinique. */}
              <div className="station-work">
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
                  <div className="exam-search">
                    <label htmlFor="exam-search">Que fais-tu ? Examen physique, biologie, imagerie…</label>
                    <input id="exam-search" type="search" autoComplete="off" value={examQuery} onChange={(event) => setExamQuery(event.target.value)} placeholder="Ex. : auscultation, troponine, radiographie" aria-describedby="exam-search-help" />
                    <p id="exam-search-help">Tape un examen ou parcours les catégories ci-dessous. Chaque examen demandé compte : un examen inutile coûte un demi-point.</p>
                  </div>
                  {examQuery.trim() && (() => {
                    const matches = searchExams(station.procedures, examQuery).slice(0, 10);
                    return matches.length
                      ? <div className="exam-matches" role="group" aria-label="Examens correspondants">{matches.map((procedure) => examButton(procedure, () => setExamQuery("")))}</div>
                      : <p className="exam-no-match" role="status">Aucun examen ne correspond. Essaie un autre mot ou parcours les catégories.</p>;
                  })()}
                  <div className="exam-groups">
                    {[...new Set(station.procedures.map((procedure) => procedure.group))]
                      .sort((left, right) => EXAM_GROUP_ORDER.indexOf(left) - EXAM_GROUP_ORDER.indexOf(right))
                      .map((group) => {
                        const items = station.procedures.filter((procedure) => procedure.group === group);
                        const done = items.filter((procedure) => performed.includes(procedure.id)).length;
                        return (
                          <details key={group}>
                            <summary>{group}{done > 0 && <span className="exam-group-count"> · {done} demandé{done > 1 ? "s" : ""}</span>}</summary>
                            <div>{items.map((procedure) => examButton(procedure))}</div>
                          </details>
                        );
                      })}
                  </div>
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
                    <button type="button" className={`mic-button${dictatingField === "analysis" ? " recording" : ""}`} disabled={!examResults.length || transcribingField !== null} onClick={() => toggleFieldDictation("analysis")} aria-pressed={dictatingField === "analysis"} aria-label={dictatingField === "analysis" ? "Arrêter la dictée de l’analyse" : "Dicter ton analyse"}>
                      {dictatingField === "analysis" ? <Square aria-hidden="true" size={16} /> : <Mic aria-hidden="true" size={19} />}
                    </button>
                    <span>{dictatingField === "analysis" ? "Je t’écoute, dicte ton analyse… Clique pour terminer." : transcribingField === "analysis" ? "Transcription en cours…" : "Tu peux aussi dicter ton analyse."}</span>
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
                  <ol className="synthesis-steps" aria-label="Étapes de la synthèse">
                    {SYNTHESIS_STEPS.map((label, index) => (
                      <li key={label}>
                        <button type="button" aria-current={index === synthesisStep ? "step" : undefined} className={index < synthesisStep ? "is-done" : ""} disabled={index > 0 && !diagnosis} onClick={() => setSynthesisStep(index)}>
                          <span aria-hidden="true">{index < synthesisStep ? <Check size={13} /> : index + 1}</span>{label}
                        </button>
                      </li>
                    ))}
                  </ol>
                  {synthesisStep === 0 && (
                  <fieldset className="synthesis-step">
                    <legend className="sr-only">Diagnostic principal et diagnostics différentiels</legend>
                    {synthesisError && <p role="alert">La synthèse n’a pas pu s’ouvrir. <button type="button" className="text-link" onClick={() => void openSynthesis()}>Réessayer</button></p>}
                    <DiagnosisPicker label="Quel est ton diagnostic principal ?" hint="Rien n’est proposé : cherche-le dans la liste, comme tu le formulerais." selected={diagnosis ? [diagnosis] : []} onChange={(ids) => { setDiagnosis(ids[0] ?? ""); setDifferentials((current) => current.filter((item) => item !== ids[0])); }} max={1} disabled={openingSynthesis} />
                    <DiagnosisPicker label="Tes diagnostics différentiels (jusqu’à trois)" hint="Hors note : le bilan les compare à ceux qui étaient attendus." selected={differentials} onChange={setDifferentials} max={3} exclude={diagnosis ? [diagnosis] : []} disabled={openingSynthesis} />
                  </fieldset>
                  )}
                  {synthesisStep === 1 && (
                  <div className="synthesis-step">
                  <label className="ecos-synthesis-plan">
                    <span>Ta prise en charge : examens, traitements, orientation et ce que tu expliques au patient</span>
                    <textarea maxLength={1200} rows={5} value={plan} onChange={(event) => setPlan(event.target.value)} placeholder="Ex. : je donne…, j’appelle…, j’hospitalise en…, j’explique au patient que…" />
                  </label>
                  <div className="dictation-row">
                    <button type="button" className={`mic-button${dictatingField === "plan" ? " recording" : ""}`} disabled={transcribingField !== null} onClick={() => toggleFieldDictation("plan")} aria-pressed={dictatingField === "plan"} aria-label={dictatingField === "plan" ? "Arrêter la dictée de la prise en charge" : "Dicter ta prise en charge"}>
                      {dictatingField === "plan" ? <Square aria-hidden="true" size={16} /> : <Mic aria-hidden="true" size={19} />}
                    </button>
                    <span>{dictatingField === "plan" ? "Je t’écoute, dicte ta prise en charge… Clique pour terminer." : transcribingField === "plan" ? "Transcription en cours…" : "Tu peux aussi dicter ta prise en charge."}</span>
                  </div>
                  </div>
                  )}
                  {dictationNote && <p role="alert" className="dictation-note">{dictationNote}</p>}
                  {synthesisStep === 2 && (() => {
                    const firstAnnounce = messages.findIndex((message) => message.role === "student" && message.content.startsWith(ANNOUNCE_PREFIX));
                    const exchanges = firstAnnounce < 0 ? [] : messages.slice(firstAnnounce).filter((message) => message.role !== "system");
                    const announced = exchanges.filter((message) => message.role === "student").length;
                    const full = announced >= MAX_ANNOUNCEMENTS;
                    return (
                      <fieldset className="ecos-announce synthesis-step">
                        <legend>Annonce au patient</legend>
                        <p>Explique-lui ce que tu penses et la suite, avec des mots simples, comme à voix haute. Il peut te poser une question. Hors note : le bilan te dit comment tu as communiqué.</p>
                        {exchanges.length > 0 && (
                          <ol className="announce-lines">
                            {exchanges.map((message, index) => { const view = messageView(message); return <li className={view.className} key={`${index}-${view.text.slice(0, 16)}`}><span>{view.label === "Annonce" ? "Toi" : view.label}</span><p>{view.text}</p></li>; })}
                            {loading && <li className="message patient"><span>Patient</span><p>{streamingText || "…"}</p></li>}
                          </ol>
                        )}
                        {!full && (
                          <>
                            <textarea aria-label="Ce que tu dis au patient" maxLength={800} rows={3} value={announceInput} onChange={(event) => setAnnounceInput(event.target.value)} placeholder="Ex. : D’après ce que vous me décrivez et l’examen, je pense que… Nous allons…" />
                            <div className="dictation-row">
                              <button type="button" className={`mic-button${dictatingField === "announcement" ? " recording" : ""}`} disabled={transcribingField !== null || loading} onClick={() => toggleFieldDictation("announcement")} aria-pressed={dictatingField === "announcement"} aria-label={dictatingField === "announcement" ? "Arrêter la dictée de l’annonce" : "Dicter ton annonce"}>
                                {dictatingField === "announcement" ? <Square aria-hidden="true" size={16} /> : <Mic aria-hidden="true" size={19} />}
                              </button>
                              <span>{dictatingField === "announcement" ? "Je t’écoute… Clique pour terminer." : transcribingField === "announcement" ? "Transcription en cours…" : "Parle ou écris, puis envoie."}</span>
                              <button type="button" className="button secondary small announce-send" disabled={loading || !announceInput.trim()} onClick={() => { const text = announceInput; setAnnounceInput(""); void sendMessage(text, "announcement"); }}>Dire au patient</button>
                            </div>
                          </>
                        )}
                        {full && <p className="announce-done">Annonce terminée. Tu peux répondre à l’examinateur puis terminer.</p>}
                      </fieldset>
                    );
                  })()}
                  {synthesisStep === 3 && (
                  <fieldset className="ecos-follow-ups synthesis-step">
                    <legend>Questions de l’examinateur</legend>
                    <p>Comme le jour de l’examen, l’examinateur te relance. Tes réponses ne changent pas la note : au bilan, tu les compares aux éléments attendus.</p>
                    {FOLLOW_UP_QUESTIONS.map(({ id, question }) => (
                      <div className="ecos-follow-up" key={id}>
                        <label htmlFor={`follow-up-${id}`}>{question}</label>
                        <textarea id={`follow-up-${id}`} maxLength={MAX_FOLLOW_UP_LENGTH} rows={3} value={followUps[id] ?? ""} onChange={(event) => { const value = event.target.value; setFollowUps((current) => ({ ...current, [id]: value })); }} />
                        <div className="dictation-row">
                          <button type="button" className={`mic-button${dictatingField === id ? " recording" : ""}`} disabled={transcribingField !== null} onClick={() => toggleFieldDictation(id)} aria-pressed={dictatingField === id} aria-label={dictatingField === id ? "Arrêter la dictée de ta réponse" : "Dicter ta réponse"}>
                            {dictatingField === id ? <Square aria-hidden="true" size={16} /> : <Mic aria-hidden="true" size={19} />}
                          </button>
                          <span>{dictatingField === id ? "Je t’écoute… Clique pour terminer." : transcribingField === id ? "Transcription en cours…" : "Réponds à l’écrit ou à voix haute."}</span>
                        </div>
                      </div>
                    ))}
                  </fieldset>
                  )}
                  <div className="ecos-phase-actions synthesis-actions">
                    <p>{!diagnosis ? "Choisis un diagnostic pour continuer." : synthesisStep < SYNTHESIS_STEPS.length - 1 ? "Les étapes suivantes sont évaluées au vrai ECOS : prends-les au sérieux." : "Tu peux terminer la station."}</p>
                    <div>
                      {synthesisStep > 0 && <button type="button" className="button quiet small" onClick={() => setSynthesisStep((step) => step - 1)}>Précédent</button>}
                      {synthesisStep < SYNTHESIS_STEPS.length - 1 && <button type="button" className="button primary" aria-disabled={!diagnosis || undefined} onClick={() => { if (diagnosis) setSynthesisStep((step) => step + 1); }}>Suivant</button>}
                      <button type="submit" className={synthesisStep === SYNTHESIS_STEPS.length - 1 ? "button primary" : "button quiet small"} aria-disabled={busy || !diagnosis || undefined}>{circuit ? "Terminer la station" : "Terminer et voir le bilan"}</button>
                    </div>
                  </div>
                </form>
              )}

              </div>

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
                      disabled={loading || transcribing}
                      onClick={startListening}
                      aria-pressed={listening}
                      aria-label={listening ? "Envoyer la question dictée" : "Dicter une question au patient"}
                      title={listening ? "Je t’écoute — la question part après un silence, ou clique pour l’envoyer" : "Dicter ta question"}
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
                  <p className="composer-hint">{phase === "examen" ? "Gestes et examens se choisissent dans le panneau d’examen." : "Une question à la fois fonctionne le mieux. Le micro dicte ta question ; la conversation vocale te laisse parler sans les mains."}</p>
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {screen === "report" && circuit && (() => {
        const last = circuit.step + 1 >= circuit.plan.length;
        const played = sessionId ? [...circuit.sessions, sessionId] : circuit.sessions;
        const nextHref = last
          ? `/examen-blanc/bilan?sessions=${played.join(",")}`
          : `/examen-blanc/station?plan=${circuit.plan.join(",")}&step=${circuit.step + 1}&sessions=${played.join(",")}`;
        return (
          <div className="circuit-break">
            <p className="briefing-meta">Examen blanc · station {circuit.step + 1} sur {circuit.plan.length} terminée</p>
            <h1>{saving ? "Enregistrement de la station…" : last ? "Dernière station terminée." : "Station terminée. Changement de salle."}</h1>
            <p className="lead">{last ? "Ton bilan d’examen blanc t’attend : score par type de station, points forts et réflexes." : "Comme à la rotation du vrai ECOS : respire, puis entre dans la salle suivante quand tu es prêt·e. Les bilans détaillés t’attendent à la fin."}</p>
            <ol className="circuit-progress" aria-label="Progression du circuit">
              {circuit.plan.map((code, index) => <li key={code} className={index <= circuit.step ? "is-done" : ""}>{index + 1}</li>)}
            </ol>
            {stationError ? <p role="alert">{stationError} <button type="button" className="text-link" onClick={() => void finishStation()}>Réessayer</button></p> : null}
            {result && sessionId && !saving && <Link className="button primary" href={nextHref}>{last ? "Voir mon bilan d’examen blanc" : "Station suivante"}</Link>}
            <Link className="text-link" href="/examen-blanc">Quitter l’examen blanc</Link>
          </div>
        );
      })()}

      {screen === "report" && !circuit && (
        <div className="report">
          {savedReport ? <Link className="text-link station-back" href="/historique">Mes bilans</Link> : <button className="text-link station-back" onClick={backToCatalog} type="button">Toutes les stations</button>}
          <section className="report-hero">
            <div>
              <p className="briefing-meta">{result ? "Bilan enregistré" : "Station terminée"}, {mode === "exam" ? "mode examen" : "entraînement"}{result?.patientVariant ? `, patient : ${result.patientVariant.toLocaleLowerCase("fr")}` : ""}</p>
              <h1>{!result ? (saving ? "Correction en cours…" : "Bilan en attente.") : percent >= 85 ? "Une station maîtrisée." : percent >= 70 ? "Des repères bien couverts." : percent >= 50 ? "Une bonne base à consolider." : "Une station à retravailler."}</h1>
              <p className="lead">{saving ? "Relecture de ta grille en cours…" : result?.debrief ? <>Le cas : <strong>{result.debrief.diagnosis}</strong>. Retrouve ta grille, ton entretien annoté et le débriefing ci-dessous.</> : "Ce bilan repère les thèmes abordés dans ton entretien, tes gestes et ta synthèse."}</p>
            </div>
            <div className={`score-card${result ? " is-ready" : ""}`}>
              <p className="score"><strong>{result ? shownScore : "…"}</strong><span>sur {maxScore} points</span></p>
              <div className="score-cells" aria-hidden="true">
                {Array.from({ length: maxScore }, (_, index) => <i className={result && index < filledPoints ? "is-on" : result && halfPoint && index === filledPoints ? "is-half" : ""} key={index} style={{ "--cell": index } as React.CSSProperties} />)}
              </div>
              {result && <p className="score-foot"><span>{percent} %</span><span className="xp-total">+{shownXp} XP</span></p>}
              {result?.xpLines && result.xpLines.length > 0 && (
                <ul className="xp-lines" aria-label="Détail de l’XP gagnée">
                  {result.xpLines.map((line) => <li key={line.label}><span>{line.label}</span>{line.xp > 0 && <strong>+{line.xp}</strong>}</li>)}
                </ul>
              )}
            </div>
          </section>

          {result && (
            <section className="report-takeaways" aria-label="À retenir">
              {result.synthesis && (() => {
                // Le serveur accepte l'entité clinique : la ligne « diagnostic » de la grille fait foi.
                const right = criteria.some((criterion) => criterion.id === "diagnosis" && criterion.earned === criterion.points);
                return (
                  <div className={`takeaway ${right ? "good" : "improve"}`}>
                    <span>{right ? "Bon diagnostic" : "Diagnostic attendu"}</span>
                    <p>{result.synthesis.correct}<small>{result.synthesis.chosen ? `Ton choix : ${result.synthesis.chosen}` : "Aucun diagnostic proposé"}</small></p>
                  </div>
                );
              })()}
              <div className="takeaway good"><span>Ton point fort</span><p>{coveredCriterion?.label ?? "Aucun thème complètement repéré."}</p></div>
              <div className="takeaway improve"><span>À travailler en priorité</span><p>{missedCriterion ? <>{missedCriterion.label}<small>{missedCriterion.hint}</small></> : "Poursuis cette approche structurée."}</p></div>
              <div className="takeaway-actions">
                <button className="button primary full" disabled={saving || Boolean(stationError)} onClick={replay} type="button">Rejouer la station</button>
                <button className="button secondary full" onClick={backToCatalog} type="button">Choisir une autre station</button>
              </div>
            </section>
          )}

          {result && (
            <div className="report-tabs">
              <div className="report-tablist" role="tablist" aria-label="Détails du bilan">
                {REPORT_TABS.map((tab) => (
                  <button key={tab.id} id={`report-tab-${tab.id}`} role="tab" type="button" aria-selected={reportTab === tab.id} aria-controls={`report-panel-${tab.id}`} tabIndex={reportTab === tab.id ? 0 : -1} onClick={() => setReportTab(tab.id)} onKeyDown={(event) => {
                    const index = REPORT_TABS.findIndex((item) => item.id === reportTab);
                    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : null;
                    if (next === null) return;
                    event.preventDefault();
                    const target = REPORT_TABS[(next + REPORT_TABS.length) % REPORT_TABS.length];
                    setReportTab(target.id);
                    document.getElementById(`report-tab-${target.id}`)?.focus();
                  }}>{tab.label}</button>
                ))}
              </div>

              <div className="report-panel" role="tabpanel" id={`report-panel-${reportTab}`} aria-labelledby={`report-tab-${reportTab}`} key={reportTab}>
                {reportTab === "grid" && (
                  <div className="rubric-card">
                    <div className="section-heading"><h2>Ta grille</h2><strong>{score}/{maxScore}</strong></div>
                    {criteria.map((criterion) => (
                      <div className="rubric-row" key={criterion.id}>
                        <span className={criterion.earned === criterion.points ? "criterion-icon success" : criterion.earned > 0 ? "criterion-icon partial" : "criterion-icon"}>{criterion.earned === criterion.points ? "✓" : criterion.earned > 0 ? "~" : "!"}<span className="sr-only">{criterion.earned === criterion.points ? " couvert" : criterion.earned > 0 ? " en partie" : " manqué"}</span></span>
                        <div><strong>{criterion.label}</strong><p>{criterion.earned === criterion.points ? "Objectif couvert." : criterion.hint}</p>{criterion.reviewed ? <span className="review-badge">+{criterion.reviewed} à la relecture</span> : null}</div>
                        <b>{criterion.earned}/{criterion.points}</b>
                      </div>
                    ))}
                    {result.review?.done && (
                      <p className="review-note">
                        {result.review.added > 0
                          ? `Grille relue par l’IA : ${result.review.added} point${result.review.added > 1 ? "s" : ""} ajouté${result.review.added > 1 ? "s" : ""} pour des questions posées avec d’autres mots.`
                          : "Grille relue par l’IA : rien à ajouter aux mots-clés."}
                      </p>
                    )}
                  </div>
                )}

                {reportTab === "interview" && (
                  <section className="ecos-debrief ecos-annotated" aria-labelledby="annotated-title">
                    <h2 id="annotated-title">Ton entretien annoté</h2>
                    <p className="communication-note">Chaque phrase qui t’a rapporté un point porte la ligne de grille correspondante.</p>
                    {result.interview && result.interview.length > 0 ? (
                      <ol className="annotated-lines">
                        {result.interview.map((line, index) => (
                          <li className={`annotated-${line.role}${line.criteria.length ? " is-credited" : ""}`} key={`${index}-${line.text.slice(0, 20)}`}>
                            <span className="annotated-who">{ANNOTATED_ROLE[line.role]}</span>
                            <p>{line.text}</p>
                            {line.criteria.length > 0 && <ul className="annotated-criteria">{line.criteria.map((label) => <li key={label}>✓ {label}</li>)}</ul>}
                          </li>
                        ))}
                      </ol>
                    ) : <p>Aucun échange enregistré.</p>}
                    {(() => {
                      const missed = criteria.filter((item) => item.earned === 0 && !["exam", "analysis", "diagnosis"].includes(item.id));
                      return missed.length > 0 && <p className="annotated-missed"><strong>Jamais abordé : </strong>{missed.map((item) => item.label).join(" · ")}</p>;
                    })()}
                  </section>
                )}

                {reportTab === "communication" && (
                  <>
                    {result.communication && <CommunicationReport report={result.communication} />}
                    {result.announcement && (
                      <section className="ecos-debrief" aria-labelledby="announce-title">
                        <h2 id="announce-title">Ton annonce au patient</h2>
                        {result.announcement.done ? (
                          <ul className="behaviour-list">
                            {[["nextSteps", "Explique la suite (examens, traitement, orientation)"], ["empathy", "Accueille l’inquiétude du patient"], ["understanding", "Vérifie la compréhension"]].map(([key, label]) => {
                              const ok = Boolean(result.announcement?.[key as "nextSteps" | "empathy" | "understanding"]);
                              return <li className={ok ? "is-done" : ""} key={key}><span aria-hidden="true">{ok ? "✓" : "·"}</span>{label}<span className="sr-only">{ok ? " : repéré" : " : non repéré"}</span></li>;
                            })}
                            <li className={result.announcement.jargon.length ? "" : "is-done"}><span aria-hidden="true">{result.announcement.jargon.length ? "·" : "✓"}</span>Parle sans jargon</li>
                          </ul>
                        ) : null}
                        <DebriefList title="Pour la prochaine fois" items={result.announcement.tips} />
                        <p className="communication-note">Repérage automatique, sans effet sur la note.</p>
                      </section>
                    )}
                  </>
                )}

                {reportTab === "exam" && (
                  <section className="ecos-debrief ecos-procedure-feedback" aria-labelledby="procedures-title">
                    <h2 id="procedures-title">Ton examen clinique</h2>
                    {result.procedures && (result.procedures.missed.length > 0 || result.procedures.unhelpful.length > 0) ? (
                      <div className="ecos-debrief-grid">
                        <DebriefList title="Gestes attendus non réalisés" items={result.procedures.missed} />
                        <DebriefList title="Gestes peu utiles dans cette situation" items={result.procedures.unhelpful} />
                      </div>
                    ) : <p className="lead">Tous les gestes attendus ont été réalisés, sans examen inutile.</p>}
                  </section>
                )}

                {reportTab === "debrief" && (
                  <>
                    {result.debrief ? (
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
                    ) : <p className="learning-notice">Le débriefing (diagnostic, points clés et sources) s’affiche une fois le bilan enregistré.</p>}
                    {result.differentials && result.differentials.expected.length > 0 && (
                      <section className="ecos-debrief" aria-labelledby="differentials-title">
                        <h2 id="differentials-title">Tes diagnostics différentiels</h2>
                        <ul className="behaviour-list">
                          {result.differentials.expected.map((item) => (
                            <li className={item.found ? "is-done" : ""} key={item.label}><span aria-hidden="true">{item.found ? "✓" : "·"}</span>{item.label}<span className="sr-only">{item.found ? " : évoqué" : " : non évoqué"}</span></li>
                          ))}
                        </ul>
                        {result.differentials.chosen.some((item) => !item.expected) && (
                          <p className="communication-note">Aussi évoqués, non attendus dans ce cas : {result.differentials.chosen.filter((item) => !item.expected).map((item) => item.label).join(" · ")}.</p>
                        )}
                        {result.differentials.chosen.length === 0 && <p className="communication-note">Tu n’as pas proposé de diagnostic différentiel.</p>}
                        <p className="communication-note">Repérage automatique, sans effet sur la note.</p>
                      </section>
                    )}
                    {result.followUps && result.followUps.length > 0 && (
                      <section className="ecos-debrief ecos-follow-up-report" aria-labelledby="follow-ups-title">
                        <h2 id="follow-ups-title">Les questions de l’examinateur</h2>
                        {result.followUps.map((item) => (
                          <div className="ecos-debrief-block" key={item.id}>
                            <h3>{item.question}</h3>
                            <p className="follow-up-answer"><strong>Ta réponse : </strong>{item.answer || "pas de réponse."}</p>
                            <p className="follow-up-expected">Ce qui était attendu :</p>
                            <ul>{item.expected.map((line) => <li key={line}>{line}</li>)}</ul>
                          </div>
                        ))}
                        <p className="communication-note">Compare toi-même : ces réponses ne comptent pas dans la note.</p>
                      </section>
                    )}
                  </>
                )}
              </div>
            </div>
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
