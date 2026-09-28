"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, Search } from "lucide-react";
import { BodyMap } from "./BodyMap";
import { normalizeSearch } from "@/lib/anatomy/assessment";
import type { AnatomyProgress } from "@/lib/anatomy/types";

type ModuleCard = { slug: string; title: string; region: string; subtitle: string; minutes: number; structures: number };
export function AnatomyExplorer({ modules, attempts, available }: { modules: ModuleCard[]; attempts: AnatomyProgress[]; available: boolean }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("Toutes");
  const regions = ["Toutes", ...new Set(modules.map((module) => module.region))];
  const visible = modules.filter((module) => (region === "Toutes" || module.region === region) && normalizeSearch(`${module.title} ${module.region} ${module.subtitle}`).includes(normalizeSearch(query)));
  const completed = modules.filter((module) => attempts.some((attempt) => attempt.module_slug === module.slug && attempt.mode === "recall" && attempt.score === attempt.total)).length;
  return <>
    <div className="anatomy-overview">
      <BodyMap />
      <section className="anatomy-intro">
        <p className="learning-eyebrow">LE CORPS COMME POINT DE DÉPART</p>
        <h2>Un repère.<br />Un lien clinique.<br /><em>Un réflexe de plus.</em></h2>
        <p>Choisis une région, reconstruis ses rapports, puis teste-toi sans les légendes. Termine par un cas pour passer de la structure au symptôme.</p>
        <div className="anatomy-metrics"><div><strong>{modules.length}</strong><span>modules</span></div><div><strong>{modules.reduce((n, m) => n + m.structures, 0)}</strong><span>repères</span></div><div><strong>{available ? `${completed}/${modules.length}` : "—"}</strong><span>rappels réussis</span></div></div>
        <Link className="button primary" href="#modules-anatomie">Choisir une région <ArrowUpRight size={17} /></Link>
        <p className="learning-note">Contenu pédagogique sourcé · validation médicale signée en attente.</p>
      </section>
    </div>
    <section id="modules-anatomie" className="learning-section">
      <div className="learning-section-head"><div><p className="learning-eyebrow">EXPLORER PAR RÉGION</p><h2>Ton atlas de révision</h2></div><label className="learning-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Rechercher une région ou un module</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cœur, nerfs, abdomen…" type="search" /></label></div>
      <div className="learning-filters" aria-label="Filtrer par région">{regions.map((item) => <button type="button" aria-pressed={region === item} onClick={() => setRegion(item)} key={item}>{item}</button>)}</div>
      <p role="status" className="learning-note">{visible.length} module{visible.length > 1 ? "s" : ""} affiché{visible.length > 1 ? "s" : ""}</p>
      <div className="anatomy-module-grid">{visible.map((module) => {
        const latest = attempts.find((attempt) => attempt.module_slug === module.slug && attempt.mode === "recall");
        return <Link className="anatomy-module-card" href={`/anatomie/${module.slug}`} key={module.slug}><div className="learning-card-top"><span>{module.region}</span><ArrowUpRight size={19} /></div><h3>{module.title}</h3><p>{module.subtitle}</p><div className="learning-card-bottom"><span><Clock3 size={14} /> {module.minutes} min · {module.structures} repères</span>{latest && <span><CheckCircle2 size={14} /> {latest.score}/{latest.total}</span>}</div></Link>;
      })}</div>
      {!visible.length && <div className="learning-empty"><h3>Aucun module pour cette recherche</h3><p>Essaie une autre région ou efface les filtres.</p><button className="button secondary" onClick={() => { setQuery(""); setRegion("Toutes"); }}>Réinitialiser</button></div>}
      {!available && <p className="learning-notice">Ton historique est momentanément indisponible. Les fiches et les exercices restent accessibles.</p>}
    </section>
  </>;
}
