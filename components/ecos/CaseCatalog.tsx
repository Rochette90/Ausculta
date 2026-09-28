"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Search } from "lucide-react";
import type { ClinicalCaseSummary } from "@/lib/ecos/cases";
import { normalizeSearch } from "@/lib/anatomy/assessment";

type ReasoningCase = { slug: string; title: string; region: string; moduleTitle: string };
export function CaseCatalog({ cases, reasoning }: { cases: ClinicalCaseSummary[]; reasoning: ReasoningCase[] }) {
  const [mode, setMode] = useState("Tous");
  const [query, setQuery] = useState("");
  const [readyOnly, setReadyOnly] = useState(true);
  const match = (value: string) => normalizeSearch(value).includes(normalizeSearch(query));
  const stations = mode === "Raisonnement" ? [] : cases.filter((item) => (!readyOnly || item.published) && match(`${item.candidateTitle} ${item.specialty ?? ""}`));
  const exercises = mode === "ECOS" ? [] : reasoning.filter((item) => match(`${item.title} ${item.region} ${item.moduleTitle}`));
  return <section className="learning-section"><div className="learning-catalog-toolbar"><label className="learning-search"><Search size={18} /><span className="sr-only">Rechercher un cas clinique</span><input type="search" placeholder="Un motif, une région, une spécialité…" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label className="learning-check"><input type="checkbox" checked={readyOnly} onChange={(e) => setReadyOnly(e.target.checked)} /> Disponibles seulement</label></div><div className="learning-filters mt-5" aria-label="Type d’entraînement">{["Tous", "ECOS", "Raisonnement"].map((item) => <button key={item} onClick={() => setMode(item)} aria-pressed={mode === item}>{item}</button>)}</div><p role="status" className="learning-note">{stations.length + exercises.length} entraînement(s)</p>
    <div className="anatomy-module-grid">{stations.map((item, index) => <article className="anatomy-module-card" key={item.code ?? `draft-${index}`}><div className="learning-card-top"><span>ECOS · {item.specialty ?? "Transversal"}</span><Clock3 size={16} /></div><h3>{item.candidateTitle}</h3><p>{item.patientLabel} · {({ easy: "Facile", medium: "Intermédiaire", hard: "Avancé" })[item.difficulty]}</p><div className="learning-card-bottom"><span>{item.duration} · Patient simulé</span>{item.published && item.code ? <Link className="learning-inline-link" href={`/cas/${item.code}`}>Commencer <ArrowUpRight size={16} /></Link> : <span>En préparation</span>}</div></article>)}
    {exercises.map((item) => <Link className="anatomy-module-card" href={`/anatomie/${item.slug}?mode=clinical`} key={item.slug}><div className="learning-card-top"><span>RAISONNEMENT · {item.region}</span><ArrowUpRight size={18} /></div><h3>{item.title}</h3><p>{item.moduleTitle}</p><div className="learning-card-bottom"><span>3–5 min · 2 questions corrigées</span></div></Link>)}</div>
    {!stations.length && !exercises.length && <div className="learning-empty"><h2>Aucun cas pour ces critères</h2><button className="button secondary" onClick={() => { setQuery(""); setMode("Tous"); setReadyOnly(false); }}>Réinitialiser</button></div>}
  </section>;
}
