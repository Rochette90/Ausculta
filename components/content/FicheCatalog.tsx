"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import type { SpecialtyCatalogItem } from "@/lib/content/queries";
import { normalizeSearch } from "@/lib/anatomy/assessment";

export function FicheCatalog({ specialties, completedIds }: { specialties: SpecialtyCatalogItem[]; completedIds: string[] }) {
  const [query, setQuery] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const completed = new Set(completedIds);
  const visible = specialties.map((specialty) => ({ ...specialty, pathologies: specialty.pathologies.filter((item) => (!specialtyId || specialtyId === specialty.id) && (!onlyUnread || !completed.has(item.id)) && normalizeSearch(`${item.title} ${item.summary ?? ""} ${specialty.name}`).includes(normalizeSearch(query))) })).filter((specialty) => specialty.pathologies.length);
  const count = visible.reduce((n, specialty) => n + specialty.pathologies.length, 0);
  return <section className="learning-section">
    <div className="learning-catalog-toolbar"><label className="learning-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Rechercher une fiche par titre ou mot-clé</span><input type="search" placeholder="Une pathologie, un signe, une spécialité…" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label><span className="sr-only">Spécialité</span><select value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)}><option value="">Toutes les spécialités</option>{specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="learning-check"><input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} /> À lire</label></div>
    <p className="learning-note" role="status">{count} fiche{count > 1 ? "s" : ""} · {completedIds.length} déjà lue{completedIds.length > 1 ? "s" : ""}</p>
    {visible.map((specialty) => <section className="learning-specialty" id={specialty.slug} key={specialty.id}><header><h2>{specialty.name}</h2><span>{specialty.pathologies.length} fiche{specialty.pathologies.length > 1 ? "s" : ""}</span></header><div className="learning-fiche-grid">{specialty.pathologies.map((item) => <Link href={`/pathologies/${item.slug}`} key={item.id} className="learning-fiche-card"><BookOpen size={20} /><div><h3>{item.title}</h3><p>{item.summary || "Ouvrir la fiche détaillée."}</p><span>{completed.has(item.id) ? "Lue" : "À découvrir"} · {({ easy: "Fondamental", facile: "Fondamental", medium: "Intermédiaire", moyen: "Intermédiaire", hard: "Avancé", difficile: "Avancé" })[item.difficulty]}</span></div><ArrowUpRight size={18} /></Link>)}</div></section>)}
    {!count && <div className="learning-empty"><h2>Aucune fiche trouvée</h2><p>Essaie un mot-clé plus court ou élargis tes filtres.</p><button className="button secondary" onClick={() => { setQuery(""); setSpecialtyId(""); setOnlyUnread(false); }}>Réinitialiser les filtres</button></div>}
  </section>;
}
