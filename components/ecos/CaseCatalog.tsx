"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import type { ClinicalCaseSummary } from "@/lib/ecos/cases";
import { normalizeSearch } from "@/lib/text";

type ReasoningCase = { slug: string; title: string; region: string; moduleTitle: string };

const DIFFICULTY = { easy: "Facile", medium: "Intermédiaire", hard: "Avancé" } as const;

export function CaseCatalog({ cases, reasoning, completed = [], best = {} }: { cases: ClinicalCaseSummary[]; reasoning: ReasoningCase[]; completed?: string[]; best?: Record<string, number> }) {
  const done = new Set(completed);
  const [mode, setMode] = useState("Tous");
  const [query, setQuery] = useState("");
  const [readyOnly, setReadyOnly] = useState(true);
  const match = (value: string) => normalizeSearch(value).includes(normalizeSearch(query));
  const stations = mode === "Raisonnement" ? [] : cases.filter((item) => (!readyOnly || item.published) && match(item.candidateTitle));
  const exercises = mode === "ECOS" ? [] : reasoning.filter((item) => match(`${item.title} ${item.region} ${item.moduleTitle}`));
  const count = stations.length + exercises.length;
  return (
    <section className="learning-section" aria-label="Catalogue">
      <div className="learning-catalog-toolbar">
        <label className="learning-search">
          <Search aria-hidden="true" size={18} />
          <span className="sr-only">Rechercher une station</span>
          <input type="search" placeholder={reasoning.length > 0 ? "Un motif, une région…" : "Un motif : douleur au ventre, fièvre…"} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="learning-check"><input type="checkbox" checked={readyOnly} onChange={(e) => setReadyOnly(e.target.checked)} /> Disponibles seulement</label>
      </div>
      {reasoning.length > 0 && (
        <div className="learning-filters mt-5" aria-label="Type d’entraînement">
          {["Tous", "ECOS", "Raisonnement"].map((item) => <button key={item} onClick={() => setMode(item)} aria-pressed={mode === item}>{item}</button>)}
        </div>
      )}
      <p role="status" className="learning-note mt-5 mb-3">
        {reasoning.length > 0 ? `${count} entraînement${count > 1 ? "s" : ""}` : `${stations.length} station${stations.length > 1 ? "s" : ""}`}
      </p>

      {stations.length > 0 && (
        <ul className="station-list">
          {stations.map((item, index) => (
            <li className="station-row" key={item.code ?? `draft-${index}`}>
              <span className="station-row-code">{item.code ? item.code.replace(/^station-/, "") : "–"}</span>
              <div>
                {/* Feuille de porte seule : la spécialité orienterait vers le diagnostic. */}
                <h3>{item.candidateTitle}</h3>
                <ul className="station-row-meta">
                  <li>{DIFFICULTY[item.difficulty]}</li>
                  {item.code && done.has(item.code) && <li>Déjà réalisée{best[item.code] !== undefined ? ` · record ${best[item.code]} %` : ""}</li>}
                </ul>
              </div>
              <span className="station-row-time">{item.duration}</span>
              {item.published && item.code
                ? <Link className="button secondary small" href={`/cas/${item.code}`}>{item.code && done.has(item.code) ? "Rejouer" : "Commencer"}</Link>
                : <span className="station-row-draft">En préparation</span>}
            </li>
          ))}
        </ul>
      )}

      {exercises.length > 0 && (
        <div className="learning-tile-grid mt-6">
          {exercises.map((item) => <Link className="learning-tile" href={`/anatomie/${item.slug}?mode=clinical`} key={item.slug}><div className="learning-card-top"><span>Raisonnement, {item.region}</span><ArrowUpRight aria-hidden="true" size={18} /></div><h3>{item.title}</h3><p>{item.moduleTitle}</p><div className="learning-card-bottom"><span>3 à 5 min, 2 questions corrigées</span></div></Link>)}
        </div>
      )}

      {!stations.length && !exercises.length && (
        <div className="learning-empty">
          <h2>Aucune station pour ces critères</h2>
          <p>Essaie un autre mot, ou affiche aussi les stations en préparation.</p>
          <button className="button secondary" onClick={() => { setQuery(""); setMode("Tous"); setReadyOnly(false); }}>Tout afficher</button>
        </div>
      )}
    </section>
  );
}
