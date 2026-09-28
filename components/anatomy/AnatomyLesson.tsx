"use client";
import { BRAND_NAME } from "@/lib/brand";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Eye, EyeOff, ExternalLink } from "lucide-react";
import type { PublicAnatomyModule, AnatomyProgress } from "@/lib/anatomy/types";
import { AnatomyAssessment } from "./AnatomyAssessment";

export function AnatomyLesson({ module, related, attempts, initialMode = "learn" }: { module: PublicAnatomyModule; related: { slug: string; title: string }[]; attempts: AnatomyProgress[]; initialMode?: "learn" | "clinical" }) {
  const [tab, setTab] = useState<"learn" | "recall" | "clinical">(initialMode);
  const [hidden, setHidden] = useState(false);
  const tabs = [{ id: "learn", label: "01 · Comprendre" }, { id: "recall", label: "02 · Se tester" }, { id: "clinical", label: "03 · Appliquer" }] as const;
  const latest = attempts.find((attempt) => attempt.mode === "recall");
  return <main className="learning-page page-enter"><Link className="learning-back" href="/anatomie"><ArrowLeft size={16} /> Tous les modules</Link>
    <header className="anatomy-lesson-head"><div><p className="learning-eyebrow">{module.region} · {module.minutes} MIN</p><h1>{module.title}</h1><p>{module.subtitle}</p></div>{latest && <span className="learning-score">Dernier rappel : {latest.score}/{latest.total}</span>}</header>
    <div className="learning-tabs" role="group" aria-label="Étapes du module">{tabs.map((item) => <button key={item.id} type="button" aria-pressed={tab === item.id} aria-controls={`anatomy-panel-${item.id}`} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    <section id="anatomy-panel-learn" hidden={tab !== "learn"}>
      <div className="anatomy-objectives"><p className="learning-eyebrow">À LA FIN DE CE MODULE</p><ul>{module.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></div>
      <div className="learning-section-head"><h2>Les repères essentiels</h2><button className="button secondary" aria-pressed={hidden} onClick={() => setHidden(!hidden)}>{hidden ? <Eye size={16} /> : <EyeOff size={16} />}{hidden ? "Révéler les noms" : "Masquer les noms"}</button></div>
      <div className="anatomy-structures">{module.structures.map((structure, index) => <article className="anatomy-structure" key={structure.id}><header><span>{String(index + 1).padStart(2, "0")}</span><h3>{hidden ? `Quel est ce repère ? (${index + 1})` : structure.name}</h3></header><dl><div><dt>Où ?</dt><dd>{structure.location}</dd></div><div><dt>Rôle</dt><dd>{structure.function}</dd></div><div><dt>Repère</dt><dd>{structure.landmark}</dd></div></dl><p className="anatomy-clinical-link"><strong>En clinique</strong>{structure.clinical}</p></article>)}</div>
      <button className="button primary" onClick={() => { setTab("recall"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Passer au rappel actif <ArrowRight size={16} /></button>
    </section>
    <section id="anatomy-panel-recall" hidden={tab !== "recall"} className="learning-section"><p className="learning-eyebrow">RAPPEL ACTIF</p><h2>Ce que tu as retenu</h2><p>Une seule réponse par question. La correction apparaît à la fin.</p><AnatomyAssessment slug={module.slug} questions={module.questions} mode="recall" /></section>
    <section id="anatomy-panel-clinical" hidden={tab !== "clinical"} className="learning-section"><p className="learning-eyebrow">CAS CLINIQUE · LOCALISATION</p><h2>{module.case.title}</h2><p className="anatomy-vignette">{module.case.vignette}</p><AnatomyAssessment slug={module.slug} questions={module.case.questions} mode="clinical" /></section>
    {related.length > 0 && <section className="learning-section"><p className="learning-eyebrow">POURSUIVRE DANS LES FICHES</p><div className="learning-related">{related.map((item) => <Link href={`/pathologies/${item.slug}`} key={item.slug}><BookOpen size={18} /><span>{item.title}</span><ArrowRight size={16} /></Link>)}</div></section>}
    <footer className="anatomy-sources"><h2>Sources & statut éditorial</h2><p>Synthèse pédagogique rédigée pour {BRAND_NAME} · sources consultées le 28 septembre 2026 · validation médicale signée en attente. Les mini-cas travaillent le raisonnement anatomique.</p>{module.sources.map((source) => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink size={13} /></a>)}</footer>
  </main>;
}
