"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import pathologyCatalog from "../content/pathologies/index.json";
import clinicalCaseCatalog from "../content/cases/index.json";
import questionCatalog from "../content/questions/index.json";
import { MarkdownBlocks, parseMarkdown } from "./markdown";

type SharedProps = { onBack: () => void };

const stations = clinicalCaseCatalog.map((item) => ({ ...item, active: item.interactive }));

type PathologyCatalogItem = (typeof pathologyCatalog)[number];
const sheets: PathologyCatalogItem[] = pathologyCatalog;

const flashCases = [
  { clue: "Triade de Beck : hypotension, turgescence jugulaire et bruits du cœur assourdis.", extra: "Pouls paradoxal, tachycardie et dyspnée.", answer: "tamponnade", label: "Tamponnade cardiaque", explanation: "La compression du cœur par l’épanchement compromet le remplissage : une décompression urgente peut être nécessaire." },
  { clue: "Fièvre, douleur de l’hypochondre droit et ictère.", extra: "Dilatation des voies biliaires avec obstacle du cholédoque.", answer: "angiocholite", label: "Angiocholite", explanation: "La triade de Charcot évoque une infection biliaire sur obstacle, nécessitant antibiothérapie et drainage." },
  { clue: "HTA, bradycardie et respiration irrégulière.", extra: "Céphalées, vomissements en jet et baisse de vigilance.", answer: "hypertension intracrânienne", label: "Hypertension intracrânienne", explanation: "La triade de Cushing traduit une hypertension intracrânienne sévère avec risque d’engagement." },
];

type QuizQuestion = { slug: string; specialty: string; question: string; options: string[]; answer: number; explanation: string };
const quizBank: QuizQuestion[] = questionCatalog;

async function recordActivity(activityType: string, activityId: string, score: number) {
  try {
    const response = await fetch("/api/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ activityType, activityId, score }) });
    if (response.ok) window.dispatchEvent(new Event("medtrain:progress"));
  } catch {
    // L'entraînement reste accessible hors ligne.
  }
}

function PageHeader({ eyebrow, title, description, onBack }: { eyebrow: string; title: string; description: string; onBack: () => void }) {
  return (
    <header className="feature-header">
      <button className="back-link" onClick={onBack}>← Tableau de bord</button>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lead">{description}</p>
    </header>
  );
}

export function StationsCatalog({ onBack, onOpen }: SharedProps & { onOpen: () => void }) {
  const [specialty, setSpecialty] = useState("Toutes");
  const [query, setQuery] = useState("");
  const specialties = ["Toutes", ...new Set(stations.map((station) => station.specialty))];
  const visible = stations.filter((station) => (specialty === "Toutes" || station.specialty === specialty) && station.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="feature-page page-enter">
      <PageHeader eyebrow="PATIENTS SIMULÉS · VOIX IA" title="Stations ECOS" description="Entraînez-vous à l’oral comme le jour J, avec une grille structurée et un débrief immédiatement exploitable." onBack={onBack} />
      <div className="catalog-toolbar">
        <label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une station…" /></label>
        <div className="filter-pills">{specialties.map((item) => <button key={item} className={specialty === item ? "active" : ""} onClick={() => setSpecialty(item)}>{item}</button>)}</div>
      </div>
      <div className="catalog-grid">
        {visible.map((station, index) => (
          <article className={`catalog-card ${station.active ? "available" : ""}`} key={station.title}>
            <div className="catalog-card-top"><span className="catalog-index">{String(index + 1).padStart(2, "0")}</span><span className="level-tag">{station.difficulty}</span></div>
            <p className="eyebrow">{station.specialty}</p><h2>{station.title}</h2><p>{station.patient}</p>
            <div className="skill-row">{station.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="catalog-card-footer"><span>{station.duration}</span>{station.active ? <button onClick={onOpen}>Commencer →</button> : <span className="soon">En préparation</span>}</div>
          </article>
        ))}
      </div>
      <section className="peer-banner"><span className="peer-icon">✓</span><div><p className="eyebrow">ENTRAÎNEMENT ENTRE PAIRS</p><h2>Grilles ECOS UNIL</h2><p>Checklists d’anamnèse et d’examen avec auto-scoring Oui / Partiel / Non.</p></div><button className="button secondary" onClick={onOpen}>Voir la grille cardio</button></section>
    </div>
  );
}

export function KnowledgeLibrary({ onBack }: SharedProps) {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("Toutes");
  const [selected, setSelected] = useState<(typeof sheets)[number] | null>(null);
  const [reading, setReading] = useState<(typeof sheets)[number] | null>(null);
  const [ficheText, setFicheText] = useState<string | null>(null);
  const [ficheError, setFicheError] = useState(false);
  const readingSlugRef = useRef<string | null>(null);
  const specialties = ["Toutes", ...new Set(sheets.map((sheet) => sheet.specialty))];
  const visible = sheets.filter((sheet) => (specialty === "Toutes" || sheet.specialty === specialty) && `${sheet.title} ${sheet.summary}`.toLowerCase().includes(query.toLowerCase()));
  const readyCount = sheets.filter((sheet) => sheet.status === "ready").length;

  async function openFiche(sheet: (typeof sheets)[number]) {
    setReading(sheet);
    setFicheText(null);
    setFicheError(false);
    readingSlugRef.current = sheet.slug;
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      const response = await fetch(`/api/pathologies/${encodeURIComponent(sheet.slug)}`);
      if (!response.ok) throw new Error("Fiche unavailable");
      const text = await response.text();
      if (readingSlugRef.current !== sheet.slug) return;
      setFicheText(text);
      void recordActivity("fiche", sheet.slug, 100);
    } catch {
      if (readingSlugRef.current === sheet.slug) setFicheError(true);
    }
  }

  function closeFiche() {
    readingSlugRef.current = null;
    setReading(null);
    setFicheText(null);
    setFicheError(false);
  }

  function openFicheBySlug(slug: string) {
    const target = sheets.find((sheet) => sheet.slug === slug);
    if (target?.status === "ready") { setSelected(target); void openFiche(target); }
  }

  if (reading) return <FicheReader sheet={reading} text={ficheText} error={ficheError} onClose={closeFiche} onOpenSlug={openFicheBySlug} />;

  return (
    <div className="feature-page page-enter">
      <PageHeader eyebrow="BIBLIOTHÈQUE MÉDICALE" title="Fiches essentielles" description="Des synthèses courtes, structurées pour le raisonnement clinique et reliées aux stations ECOS." onBack={onBack} />
      <div className="library-stats" aria-label="Avancement éditorial"><div><strong>{sheets.length}</strong><span>fiches MVP</span></div><div><strong>{readyCount}</strong><span>déjà disponibles</span></div><div><strong>{sheets.length - readyCount}</strong><span>en rédaction</span></div></div>
      <div className="catalog-toolbar"><label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pathologie, signe, traitement…" /></label><div className="filter-pills">{specialties.map((item) => <button key={item} className={specialty === item ? "active" : ""} onClick={() => setSpecialty(item)}>{item}</button>)}</div></div>
      <div className="knowledge-layout">
        <div className="sheet-list">
          {visible.map((sheet, index) => <button key={sheet.slug} className={`${selected?.slug === sheet.slug ? "sheet-row selected" : "sheet-row"} ${sheet.status === "planned" ? "planned" : ""}`} onClick={() => selected?.slug === sheet.slug && sheet.status === "ready" ? void openFiche(sheet) : setSelected(sheet)}><span className="sheet-number">{String(index + 1).padStart(2, "0")}</span><div><p className="eyebrow">{sheet.specialty} · {sheet.criticality}</p><h2>{sheet.title}</h2><p>{sheet.summary}</p></div><span className="sheet-time">{sheet.status === "ready" ? "Disponible" : "En rédaction"}<b>→</b></span></button>)}
        </div>
        <aside className="sheet-preview">
          {selected ? <><p className="eyebrow">{selected.status === "ready" ? "FICHE DE PATHOLOGIE" : "PRIORITÉ ÉDITORIALE MVP"}</p><h2>{selected.title}</h2><p className="sheet-summary">{selected.summary}</p>{selected.keyPoints.map((point, index) => <div className="learning-point" key={point}><span>{index + 1}</span><p>{point}</p></div>)}{selected.status === "ready" ? <button className="button primary full" onClick={() => void openFiche(selected)}>Lire la fiche complète <span>→</span></button> : <div className="sheet-link"><strong>Statut</strong><p>Fiche identifiée dans le corpus prioritaire UNIL et planifiée pour validation médicale.</p></div>}</> : <div className="empty-preview"><span>↗</span><h2>Sélectionnez une fiche</h2><p>Les points à retenir apparaîtront ici.</p></div>}
        </aside>
      </div>
    </div>
  );
}

function FicheReader({ sheet, text, error, onClose, onOpenSlug }: { sheet: (typeof sheets)[number]; text: string | null; error: boolean; onClose: () => void; onOpenSlug: (slug: string) => void }) {
  const blocks = useMemo(() => (text ? parseMarkdown(text) : null), [text]);
  const sections = useMemo(() => blocks?.filter((block) => block.kind === "h2") ?? [], [blocks]);

  return (
    <div className="feature-page page-enter fiche-page">
      <header className="feature-header fiche-head">
        <button className="back-link" onClick={onClose}>← Fiches essentielles</button>
        <p className="eyebrow">{sheet.specialty} · FICHE DE PATHOLOGIE</p>
        <h1>{sheet.title}</h1>
        <p className="lead">{sheet.summary}</p>
        <div className="fiche-meta"><span className={`criticality-tag ${sheet.criticality === "urgent" ? "urgent" : ""}`}>{sheet.criticality === "urgent" ? "⚠ Urgence" : "Important"}</span><span>{sections.length > 0 ? `${sections.length} sections` : "Lecture guidée"}</span></div>
      </header>

      {error && <div className="fiche-fallback"><h2>Fiche momentanément indisponible</h2><p>Le contenu n’a pas pu être chargé. Réessayez, ou révisez les points-clés ci-dessous.</p>{sheet.keyPoints.map((point, index) => <div className="learning-point" key={point}><span>{index + 1}</span><p>{point}</p></div>)}</div>}

      {!error && !blocks && <div className="fiche-loading" role="status"><span /><span /><span />Chargement de la fiche…</div>}

      {blocks && (
        <div className="fiche-reader">
          <article className="fiche-article">
            <MarkdownBlocks blocks={blocks} onNavigate={onOpenSlug} />
            <p className="medical-disclaimer">Contenu pédagogique destiné à la révision. Ne remplace pas les recommandations officielles ni un avis médical.</p>
          </article>
          <nav className="fiche-toc" aria-label="Sommaire de la fiche">
            <p className="eyebrow">SOMMAIRE</p>
            {sections.map((section) => section.kind === "h2" && <a key={section.id} href={`#${section.id}`}>{section.text}</a>)}
            <button className="toc-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Haut de page</button>
          </nav>
        </div>
      )}
    </div>
  );
}

export function QuizExperience({ onBack }: SharedProps) {
  const [mode, setMode] = useState("Quiz du jour");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [daySeed] = useState(() => Math.floor(Date.now() / 86_400_000) % quizBank.length);
  const specialties = [...new Set(quizBank.map((item) => item.specialty))];
  const questions = mode === "Quiz du jour"
    ? Array.from({ length: 4 }, (_, offset) => quizBank[(daySeed + offset * 3) % quizBank.length])
    : quizBank.filter((item) => item.specialty === mode);
  const question = questions[index];
  const answered = selected !== null;

  function choose(option: number) {
    if (answered) return;
    setSelected(option);
    if (option === question.answer) setScore((current) => current + 1);
  }
  function next() {
    if (index === questions.length - 1) {
      const finalScore = score;
      setFinished(true);
      void recordActivity("quiz", mode.toLowerCase().replaceAll(" ", "-"), Math.round((finalScore / questions.length) * 100));
      return;
    }
    setIndex((current) => current + 1); setSelected(null);
  }
  function restart() { setIndex(0); setSelected(null); setScore(0); setFinished(false); setStarted(false); }

  return (
    <div className="feature-page page-enter quiz-page">
      <PageHeader eyebrow="QUIZ UNIL · 6 SPÉCIALITÉS" title="Décisions rapides" description="Choisissez une spécialité ou maintenez votre série avec le quiz du jour." onBack={onBack} />
      {!started ? <section className="quiz-selector"><div><p className="eyebrow">PARCOURS QUOTIDIEN</p><h2>Que voulez-vous réviser ?</h2><p>Chaque série rapporte de l’XP une fois par jour et entretient votre régularité.</p></div><div className="quiz-mode-grid">{["Quiz du jour", ...specialties].map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}><span>{item === "Quiz du jour" ? "✦" : String(specialties.indexOf(item) + 1).padStart(2, "0")}</span><strong>{item}</strong><small>{item === "Quiz du jour" ? "4 questions mixtes" : "2 questions ciblées"}</small></button>)}</div><button className="button primary" onClick={() => setStarted(true)}>Commencer · {mode}</button></section> : !finished ? <section className="quiz-card">
        <div className="quiz-progress"><span>Question {index + 1} sur {questions.length} · {question.specialty}</span><strong>{score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""}</strong><i><b style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></i></div>
        <p className="eyebrow">QUESTION À CHOIX UNIQUE</p><h2>{question.question}</h2>
        <div className="answer-list">{question.options.map((option, optionIndex) => { const state = answered ? optionIndex === question.answer ? "correct" : optionIndex === selected ? "wrong" : "dimmed" : ""; return <button className={state} key={option} onClick={() => choose(optionIndex)}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}{answered && optionIndex === question.answer ? <b>✓</b> : null}</button>; })}</div>
        {answered && <div className="quiz-explanation"><span>À retenir</span><p>{question.explanation}</p></div>}
        <button className="button primary quiz-next" disabled={!answered} onClick={next}>{index === questions.length - 1 ? "Voir mon résultat" : "Question suivante →"}</button>
      </section> : <section className="quiz-result"><div className="score-ring small-ring" style={{ "--score": `${(score / questions.length) * 360}deg` } as React.CSSProperties}><div><strong>{score}/{questions.length}</strong><span>réponses justes</span></div></div><p className="eyebrow">QUIZ TERMINÉ · {mode}</p><h2>{score / questions.length >= .75 ? "Très solide." : "Encore un tour et ce sera acquis."}</h2><p>Vous gagnez +{score * 15 + 10} XP. Le résultat est ajouté à votre progression quotidienne.</p><div><button className="button primary" onClick={restart}>Choisir un autre quiz</button><button className="button secondary" onClick={onBack}>Retour au tableau de bord</button></div></section>}
    </div>
  );
}

export function TrainingLab({ onBack }: SharedProps) {
  const [mode, setMode] = useState<"flash" | "rci">("flash");
  return (
    <div className="feature-page page-enter">
      <PageHeader eyebrow="ENTRAÎNEMENT CLINIQUE" title="Laboratoire de raisonnement" description="Reconnaissance rapide des tableaux typiques ou raisonnement clinique complet, à vous de choisir." onBack={onBack} />
      <div className="lab-tabs"><button className={mode === "flash" ? "active" : ""} onClick={() => setMode("flash")}><span>⚡</span><div><strong>Diagnostic Flash</strong><small>Triades & signes clés</small></div></button><button className={mode === "rci" ? "active" : ""} onClick={() => setMode("rci")}><span>◎</span><div><strong>RCI Train</strong><small>Différentiels → examens → diagnostic</small></div></button></div>
      {mode === "flash" ? <DiagnosticFlash /> : <RciTrain />}
    </div>
  );
}

function normalize(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }

function DiagnosticFlash() {
  const [index, setIndex] = useState(0); const [guess, setGuess] = useState(""); const [revealed, setRevealed] = useState(false); const [result, setResult] = useState<"correct" | "wrong" | null>(null); const [score, setScore] = useState(0); const current = flashCases[index];
  function submit(event: FormEvent) { event.preventDefault(); if (!guess.trim() || result) return; const correct = normalize(guess).includes(current.answer); if (correct) { setResult("correct"); setScore((value) => value + (revealed ? 70 : 100)); void recordActivity("diagnostic-flash", current.answer, revealed ? 70 : 100); } else if (!revealed) { setRevealed(true); setGuess(""); } else setResult("wrong"); }
  function next() { setIndex((value) => (value + 1) % flashCases.length); setGuess(""); setRevealed(false); setResult(null); }
  return <section className="lab-card"><div className="lab-card-header"><div><p className="eyebrow">CAS {index + 1} · RECONNAISSANCE</p><h2>Quel est votre diagnostic ?</h2></div><span className="lab-score">⚡ {score} pts</span></div><div className="clue primary-clue"><span>01</span><p>{current.clue}</p></div>{revealed && <div className="clue secondary-clue"><span>02</span><p>{current.extra}</p></div>}{result ? <div className={`flash-result ${result}`}><strong>{result === "correct" ? "Bien vu !" : `Réponse : ${current.label}`}</strong><p>{current.explanation}</p><button className="button primary" onClick={next}>Cas suivant →</button></div> : <form className="diagnosis-form" onSubmit={submit}><input value={guess} onChange={(event) => setGuess(event.target.value)} placeholder="Votre diagnostic…" /><button className="button primary">Valider</button>{revealed && <small>Dernière tentative — utilisez le nouvel indice.</small>}</form>}</section>;
}

function RciTrain() {
  const [phase, setPhase] = useState(0); const [differentials, setDifferentials] = useState<string[]>([]); const [input, setInput] = useState(""); const [final, setFinal] = useState(""); const [done, setDone] = useState(false);
  const vignette = "Homme de 62 ans, tabagique et hypertendu, présentant depuis une heure une douleur thoracique rétrosternale constrictive irradiant au bras gauche et à la mâchoire, avec sueurs et nausées.";
  function add(event: FormEvent) { event.preventDefault(); if (!input.trim() || differentials.length >= 3) return; setDifferentials((items) => [...items, input.trim()]); setInput(""); }
  return <section className="lab-card rci-card"><div className="rci-steps">{["Différentiels", "Examens", "Diagnostic"].map((step, index) => <span className={index <= phase ? "active" : ""} key={step}><b>{index + 1}</b>{step}</span>)}</div><div className="vignette"><p className="eyebrow">VIGNETTE CLINIQUE</p><p>{vignette}</p></div>{phase === 0 && <div className="rci-phase"><h2>Proposez trois diagnostics différentiels</h2><div className="differential-tags">{differentials.map((item) => <span key={item}>{item}</span>)}</div><form className="diagnosis-form" onSubmit={add}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ajouter un diagnostic…" /><button className="button secondary">Ajouter</button></form><button className="button primary" disabled={differentials.length < 3} onClick={() => setPhase(1)}>Découvrir les examens →</button></div>}{phase === 1 && <div className="rci-phase"><h2>Résultats disponibles</h2><div className="investigation-list"><div><span>ECG</span><p>Sus-décalage ST en DII, DIII, aVF avec miroir latéral.</p></div><div><span>Biologie</span><p>Troponine ultrasensible élevée et ascendante.</p></div><div><span>Radiographie</span><p>Médiastin de largeur normale, champs pulmonaires libres.</p></div></div><button className="button primary" onClick={() => setPhase(2)}>Poser le diagnostic →</button></div>}{phase === 2 && !done && <div className="rci-phase"><h2>Quel est le diagnostic final ?</h2><form className="diagnosis-form" onSubmit={(event) => { event.preventDefault(); if (final.trim()) { const correct = normalize(final).includes("coronar") || normalize(final).includes("infarct") || normalize(final).includes("stemi"); setDone(true); void recordActivity("rci", "stemi-inferieur", correct ? 100 : 40); } }}><input value={final} onChange={(event) => setFinal(event.target.value)} placeholder="Diagnostic final…" /><button className="button primary">Valider</button></form></div>}{done && <div className={`flash-result ${normalize(final).includes("coronar") || normalize(final).includes("infarct") || normalize(final).includes("stemi") ? "correct" : "wrong"}`}><strong>Syndrome coronarien aigu avec sus-décalage ST inférieur</strong><p>La douleur typique, les facteurs de risque, le sus-décalage inférieur et la troponine ascendante convergent vers un STEMI inférieur nécessitant une reperfusion urgente.</p><button className="button secondary" onClick={() => { setPhase(0); setDifferentials([]); setFinal(""); setDone(false); }}>Recommencer</button></div>}</section>;
}
