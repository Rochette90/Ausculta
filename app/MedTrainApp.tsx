"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpenCheck, CheckCircle2, ClipboardCheck, Flame, Stethoscope, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../components/ui/header-2";
import type { MarketingStats } from "../lib/marketing/stats";
import { KnowledgeLibrary, QuizExperience, StationsCatalog, TrainingLab } from "./FeatureScreens";
import { calculateEcosCriteria, type EcosMessage } from "./lib/ecos";

export type Screen = "home" | "stations" | "briefing" | "station" | "report" | "fiches" | "quiz" | "lab";
type Progress = { totalXp: number; level: number; streak: number; completedActivities: number; averageScore: number };

const TOTAL_SECONDS = 8 * 60;

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

function Logo() {
  return (
    <div className="logo" aria-label="MedTrain">
      <span className="logo-mark">M</span>
      <span>MedTrain</span>
    </div>
  );
}

export function LandingPage({ onEnter, signedIn, stats }: { onEnter: () => void; signedIn: boolean; stats: MarketingStats }) {
  const primaryLabel = signedIn ? "Ouvrir mon tableau de bord" : "Commencer gratuitement";
  const hasPublishedContent = stats.pathologyCount > 0 || stats.questionCount > 0 || stats.caseCount > 0;

  return (
    <div className="landing-page page-enter">
      <Header signedIn={signedIn} />

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-kicker"><span>●</span> Plateforme suisse d’apprentissage médical</div>
            <h1>Révisez la médecine.<br /><span className="landing-hero-emphasis">Gagnez des réflexes cliniques.</span></h1>
            <p>Fiches structurées, QCM ciblés et cas cliniques pour progresser chaque jour — jusqu’à l’examen fédéral.</p>
            <div className="landing-actions">
              <button className="button primary" onClick={onEnter}>{primaryLabel} <ArrowRight size={17} /></button>
              <Link className="button secondary" href="/pricing">Voir les tarifs</Link>
            </div>
            <ul className="landing-trust-list"><li><CheckCircle2 size={16} /> Progression sauvegardée</li><li><CheckCircle2 size={16} /> Corrections expliquées</li><li><CheckCircle2 size={16} /> Pensé pour le cursus suisse</li></ul>
          </div>
        </section>

        <section className="landing-method" id="methode">
          <div className="landing-section-head"><p className="eyebrow">LE CŒUR DE MEDTRAIN</p><h2>Tout ce qu’il faut pour s’entraîner vraiment</h2><p>Des formats complémentaires pour passer de la connaissance à la décision clinique.</p></div>
          <p className="landing-catalog-proof">{hasPublishedContent ? "Fiches · QCM · Cas cliniques · Progression" : "Contenu en préparation"}</p>
          <div className="pillar-grid four-pillars">
            <article className="pillar-card"><span className="pillar-number">01</span><div className="pillar-icon"><BookOpenCheck size={23} /></div><h3>Fiches structurées</h3><p>Pathologies claires et structurées&nbsp;: définition, symptômes, examens, traitements.</p></article>
            <article className="pillar-card pillar-card-accent" id="qcm"><span className="pillar-number">02</span><div className="pillar-icon"><ClipboardCheck size={23} /></div><h3>QCM avec correction</h3><p>Questions avec correction détaillée. Entraînez-vous par spécialité ou en mode examen.</p></article>
            <article className="pillar-card" id="cas-cliniques"><span className="pillar-number">03</span><div className="pillar-icon"><Stethoscope size={23} /></div><h3>Cas cliniques</h3><p>Scénarios réalistes pour travailler le raisonnement diagnostique et thérapeutique.</p></article>
            <article className="pillar-card"><span className="pillar-number">04</span><div className="pillar-icon"><Target size={23} /></div><h3>Progression visible</h3><p>XP, niveaux, série quotidienne et suivi de vos points forts et de vos lacunes.</p></article>
          </div>
        </section>

        <section className="landing-product-preview" aria-labelledby="product-preview-title">
          <div className="landing-section-head landing-section-head-centered"><p className="eyebrow">APERÇU PRODUIT</p><h2 id="product-preview-title">Un entraînement qui donne des résultats visibles</h2><p>Chaque réponse compte. Chaque série renforce vos automatismes.</p></div>
          <div className="landing-product-shell">
            <div className="landing-demo" aria-label="Aperçu d’un quiz MedTrain">
              <div className="demo-window">
                <div className="demo-top"><span><i /> Quiz cardiologie</span><strong>3 / 10</strong></div>
                <div className="demo-question"><div className="demo-question-meta"><span>Décision clinique</span><small>Difficulté moyenne</small></div><h3>Quel examen doit être obtenu en priorité devant une douleur thoracique suspecte&nbsp;?</h3><div className="demo-options"><div><span>A</span>Radiographie thoracique</div><div className="selected"><CheckCircle2 size={18} />ECG 12 dérivations</div><div><span>C</span>Échocardiographie</div></div></div>
                <div className="demo-feedback"><CheckCircle2 size={19} /><div><strong>Bonne réponse</strong><small>L’ECG doit être réalisé sans délai afin d’identifier notamment un STEMI.</small></div><b>+10 XP</b></div>
                <div className="demo-score"><span>Progression de la série</span><strong>30%</strong><i><b style={{ width: "30%" }} /></i></div>
              </div>
              <div className="floating-card xp-card"><span><Trophy size={18} /></span><div><strong>Niveau 4</strong><small>Progression visible</small></div></div>
              <div className="floating-card streak-card"><span><Flame size={18} /></span><div><strong>7 jours</strong><small>Série actuelle</small></div></div>
            </div>
          </div>
        </section>

        <section className="landing-audience">
          <div><p className="eyebrow">PENSÉ POUR VOTRE CURSUS</p><h2>Conçu pour les étudiants en médecine en Suisse</h2><p>Un outil de révision exigeant, utilisable au quotidien et centré sur les situations que vous devez maîtriser.</p></div>
          <ul>
            <li><CheckCircle2 aria-hidden="true" size={20} /><span>Aligné sur les besoins du cursus et de l’examen fédéral</span></li>
            <li><CheckCircle2 aria-hidden="true" size={20} /><span>Utilisable sur mobile entre deux cours ou en session de révision</span></li>
            <li><CheckCircle2 aria-hidden="true" size={20} /><span>Idéal pour installer une routine régulière sans se disperser</span></li>
          </ul>
        </section>

        <section className="landing-cta">
          <p className="eyebrow">COMMENCEZ À VOTRE RYTHME</p>
          <h2>Passez des révisions passives à un vrai entraînement</h2>
          <div className="landing-cta-prices"><span><b>Découverte</b> CHF 0</span><span><b>MedTrain Pro</b> CHF 14.90/mois ou CHF 119/an</span></div>
          <div className="landing-cta-actions"><button className="button primary" onClick={onEnter}>{signedIn ? "Ouvrir mon espace" : "Créer mon compte gratuit"} <ArrowRight size={17} /></button><Link className="button secondary" href="/pricing">Voir MedTrain Pro</Link></div>
        </section>
      </main>

      <footer className="landing-footer"><Logo /><p>Plateforme suisse d’apprentissage médical</p><small>© 2026 MedTrain · Contenu pédagogique, ne remplace pas un avis médical.</small></footer>
    </div>
  );
}

export function MedTrainApp({ firstName = null, initialScreen = "home" }: { firstName?: string | null; initialScreen?: Screen }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [messages, setMessages] = useState<EcosMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [stationId, setStationId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({ totalXp: 0, level: 1, streak: 0, completedActivities: 0, averageScore: 0 });
  const transcriptRef = useRef<HTMLDivElement>(null);

  const criteria = useMemo(() => calculateEcosCriteria(messages), [messages]);
  const score = criteria.reduce((total, criterion) => total + criterion.earned, 0);
  const maxScore = criteria.reduce((total, criterion) => total + criterion.points, 0);
  const percent = Math.round((score / maxScore) * 100);

  useEffect(() => {
    if (screen !== "station") return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setScreen("report");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    async function refreshProgress() {
      try {
        const response = await fetch("/api/progress");
        if (response.ok) setProgress(await response.json() as Progress);
      } catch {
        // L'application reste utilisable hors ligne.
      }
    }
    void refreshProgress();
    window.addEventListener("medtrain:progress", refreshProgress);
    return () => window.removeEventListener("medtrain:progress", refreshProgress);
  }, []);

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
    setSecondsLeft(TOTAL_SECONDS);
    const firstMessage: EcosMessage = {
      role: "patient",
      content: "Bonjour docteur… j’ai une forte douleur dans la poitrine depuis ce matin et ça m’inquiète beaucoup.",
    };
    setMessages([firstMessage]);
    setScreen("station");
    setTimeout(() => speak(firstMessage.content), 250);
    try {
      const response = await fetch("/api/ecos/session", { method: "POST" });
      if (response.ok) {
        const data = (await response.json()) as { sessionId: string };
        setStationId(data.sessionId);
      }
    } catch {
      setStationId(null);
    }
  }

  async function sendMessage(content: string) {
    const clean = content.trim();
    if (!clean || loading) return;
    const studentMessage: EcosMessage = { role: "student", content: clean };
    const nextMessages = [...messages, studentMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ecos/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: clean, sessionId: stationId }),
      });
      if (!response.ok) throw new Error("Patient indisponible");
      const data = (await response.json()) as { reply: string };
      const patientMessage: EcosMessage = { role: "patient", content: data.reply };
      setMessages((current) => [...current, patientMessage]);
      speak(data.reply);
    } catch {
      const reply = "Excusez-moi, je suis un peu anxieux… pouvez-vous répéter votre question ?";
      setMessages((current) => [...current, { role: "patient", content: reply }]);
      speak(reply);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function startListening() {
    const BrowserRecognition = (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition; SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!BrowserRecognition) {
      setMessages((current) => [...current, { role: "system", content: "La dictée vocale n’est pas disponible dans ce navigateur. Vous pouvez écrire votre question." }]);
      return;
    }
    const recognition = new BrowserRecognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput(transcript);
      if (transcript) void sendMessage(transcript);
    };
    recognition.start();
  }

  async function finishStation() {
    setScreen("report");
    window.speechSynthesis?.cancel();
    if (!stationId) return;
    try {
      await fetch(`/api/ecos/session/${stationId}`, {
        method: "POST",
      });
      window.dispatchEvent(new Event("medtrain:progress"));
    } catch {
      // Le rapport local reste disponible même sans persistance.
    }
  }

  function reset() {
    setScreen("home");
    setMessages([]);
    setStationId(null);
    setSecondsLeft(TOTAL_SECONDS);
    router.push("/dashboard");
  }

  return (
    <main className="app-shell">
      {screen === "home" && (
        <div className="home-page page-enter">
          <section className="welcome-grid">
            <div>
              <p className="eyebrow">{new Date().toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</p>
              <h1>Bonjour{firstName ? ` ${firstName}` : ""}.<br /><span>Prêt·e pour une garde ?</span></h1>
              <p className="lead">Travaillez votre raisonnement clinique avec un patient simulé, comme le jour de l’ECOS.</p>
              <div className="hero-actions">
                <button className="button primary" onClick={() => setScreen("briefing")}>Commencer la station</button>
                <span className="daily-goal"><b>12 min</b><small>objectif du jour</small></span>
              </div>
            </div>
            <div className="progress-orbit" aria-label={`Score moyen ${progress.averageScore} pour cent`}>
              <div className="orbit-ring" style={{ "--orbit": `${progress.completedActivities > 0 ? progress.averageScore : 0}%` } as React.CSSProperties}><div><strong>{progress.completedActivities > 0 ? `${progress.averageScore}%` : "—"}</strong><span>score moyen</span></div></div>
              <span className="orbit-note">{progress.totalXp > 0 ? `${progress.totalXp.toLocaleString("fr-CH")} XP · niveau ${progress.level}` : "Lancez votre première activité"}</span>
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div><p className="eyebrow">RECOMMANDÉ POUR VOUS</p><h2>Votre prochaine station</h2></div>
              <span className="level-tag">Intermédiaire</span>
            </div>
            <article className="station-card featured-card">
              <div className="case-visual" aria-hidden="true">
                <span className="pulse-line">⌁</span><b>58</b><small>ans</small>
              </div>
              <div className="case-content">
                <div className="case-meta"><span>Cardiologie</span><span>8 min</span><span>18 points</span></div>
                <h3>Douleur thoracique aiguë</h3>
                <p>Vous êtes médecin aux urgences. Monsieur Martin consulte pour une douleur thoracique apparue ce matin.</p>
                <div className="skill-row"><span>Anamnèse</span><span>Urgence</span><span>Communication</span></div>
              </div>
              <button className="round-button" onClick={() => setScreen("briefing")} aria-label="Ouvrir la station">→</button>
            </article>
          </section>

          <section className="stats-grid">
            <article><span className="stat-icon mint">✓</span><div><strong>{progress.completedActivities}</strong><span>activités terminées</span></div><small>Progression enregistrée</small></article>
            <article><span className="stat-icon amber">★</span><div><strong>{progress.totalXp.toLocaleString("fr-CH")}</strong><span>XP au total</span></div><small>Niveau {progress.level}</small></article>
            <article><span className="stat-icon blue">↗</span><div><strong>{progress.averageScore}%</strong><span>score moyen</span></div><small>{progress.streak > 0 ? `Série de ${progress.streak} jour${progress.streak > 1 ? "s" : ""}` : "Commencez votre série"}</small></article>
          </section>

          <section className="section-block">
            <div className="section-heading"><div><p className="eyebrow">CONTINUER À PROGRESSER</p><h2>Parcours rapides</h2></div></div>
            <div className="mini-card-grid">
              <button className="mini-card" onClick={() => router.push("/quiz")}><span>01</span><h3>Quiz du jour</h3><p>4 questions · Cardio & urgences</p><div className="mini-progress"><i style={{ width: "40%" }} /></div></button>
              <button className="mini-card" onClick={() => router.push("/specialties")}><span>02</span><h3>Réviser une fiche</h3><p>Syndrome coronarien aigu</p><div className="mini-progress"><i style={{ width: "72%" }} /></div></button>
              <button className="mini-card" onClick={() => router.push("/cas?mode=lab")}><span>03</span><h3>Diagnostic Flash</h3><p>Triades et signes cliniques</p><div className="mini-progress"><i style={{ width: "28%" }} /></div></button>
            </div>
          </section>
        </div>
      )}

      {screen === "stations" && <StationsCatalog onBack={() => router.push("/dashboard")} onOpen={() => setScreen("briefing")} />}
      {screen === "fiches" && <KnowledgeLibrary onBack={() => router.push("/dashboard")} />}
      {screen === "quiz" && <QuizExperience onBack={() => router.push("/dashboard")} />}
      {screen === "lab" && <TrainingLab onBack={() => router.push("/dashboard")} />}

      {screen === "briefing" && (
        <div className="briefing-page page-enter">
          <button className="back-link" onClick={reset}>← Retour au tableau de bord</button>
          <div className="briefing-grid">
            <section>
              <p className="eyebrow">STATION ECOS · CARDIOLOGIE</p>
              <h1>Douleur thoracique aiguë</h1>
              <p className="lead">Station d’anamnèse et de prise en charge initiale aux urgences.</p>
              <div className="instruction-card">
                <div className="paper-label">CONSIGNE AU CANDIDAT</div>
                <p>Vous êtes médecin assistant·e au service des urgences du CHUV.</p>
                <p><strong>Monsieur Martin, 58 ans, consulte pour une douleur thoracique apparue ce matin.</strong></p>
                <p>Vous devez réaliser une anamnèse ciblée, identifier les éléments de gravité et proposer votre prise en charge initiale.</p>
                <p className="muted">Vous ne devez pas réaliser d’examen physique réel. Décrivez les gestes que vous souhaitez effectuer.</p>
              </div>
              <div className="mode-row">
                <span className="selected-radio">●</span>
                <div><strong>Mode entraînement</strong><p>Correction détaillée à la fin de la station.</p></div>
              </div>
            </section>
            <aside className="brief-aside">
              <div className="patient-portrait"><span>MM</span><i /></div>
              <h2>Monsieur Martin</h2>
              <p>58 ans · Patient simulé par IA</p>
              <div className="station-facts"><div><strong>08:00</strong><span>Temps disponible</span></div><div><strong>18</strong><span>Points possibles</span></div></div>
              <ul>
                <li>Microphone recommandé</li>
                <li>Réponses vocales en français</li>
                <li>Conversation confidentielle</li>
              </ul>
              <button className="button primary full" onClick={startStation}>Démarrer la station <span>→</span></button>
              <small>Le chronomètre démarre après votre clic.</small>
            </aside>
          </div>
        </div>
      )}

      {screen === "station" && (
        <div className="station-page page-enter">
          <section className="station-header">
            <div><p className="eyebrow">STATION EN COURS</p><h1>Douleur thoracique aiguë</h1></div>
            <div className={`timer ${secondsLeft < 90 ? "timer-alert" : ""}`}><span>Temps restant</span><strong>{formatTime(secondsLeft)}</strong></div>
            <button className="button danger-ghost" onClick={finishStation}>Terminer</button>
          </section>

          <div className="consultation-grid">
            <aside className="patient-panel">
              <div className="patient-portrait large"><span>MM</span><i className={loading ? "speaking" : ""} /></div>
              <h2>Monsieur Martin</h2><p>58 ans</p>
              <div className="patient-status"><span className={loading ? "status-dot active" : "status-dot"} />{loading ? "Réfléchit…" : listening ? "Vous écoute…" : "En consultation"}</div>
              <button className="voice-toggle" onClick={() => setVoiceEnabled((value) => !value)}><span>{voiceEnabled ? "◖))" : "◖×"}</span>{voiceEnabled ? "Voix activée" : "Voix désactivée"}</button>
              <div className="privacy-note">Les échanges de cette simulation sont réservés à votre entraînement.</div>
            </aside>

            <section className="conversation-panel">
              <div className="transcript" ref={transcriptRef} aria-live="polite">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
                    <span>{message.role === "patient" ? "Patient" : message.role === "student" ? "Vous" : "MedTrain"}</span>
                    <p>{message.content}</p>
                  </div>
                ))}
                {loading && <div className="message patient loading-message"><span>Patient</span><p><i /><i /><i /></p></div>}
              </div>
              <div className="quick-actions" aria-label="Actions cliniques rapides">
                {quickActions.map((action) => <button key={action.label} onClick={() => void sendMessage(action.prompt)}>+ {action.label}</button>)}
              </div>
              <form className="composer" onSubmit={submit}>
                <button type="button" className={`mic-button ${listening ? "recording" : ""}`} onClick={startListening} aria-label="Dicter une question">{listening ? "■" : "●"}</button>
                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={listening ? "Je vous écoute…" : "Posez votre question au patient…"} aria-label="Question au patient" />
                <button type="submit" className="send-button" disabled={!input.trim() || loading} aria-label="Envoyer">↑</button>
              </form>
              <p className="composer-hint">Appuyez sur le micro pour parler, ou écrivez votre question.</p>
            </section>

            <aside className="objectives-panel">
              <p className="eyebrow">VOTRE PROGRESSION</p>
              <h2>Objectifs observés</h2>
              <div className="live-score"><strong>{score}</strong><span>/ {maxScore} points repérés</span></div>
              <div className="criteria-mini-list">
                {criteria.slice(0, 5).map((criterion) => <div key={criterion.id}><span className={criterion.earned > 0 ? "checked" : ""}>{criterion.earned > 0 ? "✓" : "·"}</span><p>{criterion.label}</p></div>)}
              </div>
              <p className="objectives-note">En mode examen, cette progression est masquée.</p>
            </aside>
          </div>
        </div>
      )}

      {screen === "report" && (
        <div className="report-page page-enter">
          <button className="back-link" onClick={reset}>← Tableau de bord</button>
          <section className="report-hero">
            <div className="score-ring" style={{ "--score": `${percent * 3.6}deg` } as React.CSSProperties}><div><strong>{percent}%</strong><span>{score}/{maxScore} points</span></div></div>
            <div><p className="eyebrow">STATION TERMINÉE</p><h1>{percent >= 70 ? "Belle prise en charge." : "Une bonne base à consolider."}</h1><p className="lead">Vous avez correctement orienté l’entretien. Votre prochain levier est de systématiser les éléments encore manquants.</p><div className="report-tags"><span>+{Math.max(20, score * 3)} XP</span><span>🔥 Série maintenue</span></div></div>
          </section>
          <section className="report-grid">
            <div className="rubric-card">
              <div className="section-heading"><div><p className="eyebrow">GRILLE ECOS</p><h2>Analyse par compétence</h2></div><strong>{score}/{maxScore}</strong></div>
              {criteria.map((criterion) => (
                <div className="rubric-row" key={criterion.id}>
                  <span className={criterion.earned === criterion.points ? "criterion-icon success" : criterion.earned > 0 ? "criterion-icon partial" : "criterion-icon"}>{criterion.earned === criterion.points ? "✓" : criterion.earned > 0 ? "~" : "!"}</span>
                  <div><strong>{criterion.label}</strong><p>{criterion.earned === criterion.points ? "Objectif couvert dans votre entretien." : criterion.hint}</p></div>
                  <b>{criterion.earned}/{criterion.points}</b>
                </div>
              ))}
            </div>
            <aside className="feedback-card">
              <p className="eyebrow">COACH MEDTRAIN</p><h2>À retenir</h2>
              <div className="feedback good"><span>+</span><p><strong>Point fort</strong>Vous avez gardé un entretien ciblé et professionnel.</p></div>
              <div className="feedback improve"><span>↗</span><p><strong>À améliorer</strong>{criteria.filter((criterion) => criterion.earned < criterion.points)[0]?.hint ?? "Poursuivez cette approche structurée."}</p></div>
              <button className="button primary full" onClick={() => setScreen("briefing")}>Rejouer la station</button>
              <button className="button secondary full" onClick={reset}>Continuer l’entraînement</button>
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
  }
}
