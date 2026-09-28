"use client";

import { AlertTriangle, ArrowRight, BookOpenCheck, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { b3Modules, getB3ModuleCount, pathologyBelongsToB3Module, type B3ModuleId } from "@/lib/curriculum/b3";
import type { PublicPathology } from "@/lib/marketing/catalog";

type CatalogGroup = { name: string; pathologies: PublicPathology[] };

const criticalityLabels = {
  standard: "Standard",
  frequent: "Fréquent",
  important: "Important",
  urgent: "Urgence",
};

export function CatalogueExplorer({ groups, signedIn, initialModule = "all" }: { groups: CatalogGroup[]; signedIn: boolean; initialModule?: B3ModuleId | "all" }) {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("Toutes");
  const [moduleId, setModuleId] = useState<B3ModuleId | "all">(initialModule);
  const allPathologies = useMemo(() => groups.flatMap((group) => group.pathologies), [groups]);

  const pathologies = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr-CH");
    const activeModule = b3Modules.find((module) => module.id === moduleId);
    return groups
      .filter((group) => specialty === "Toutes" || group.name === specialty)
      .flatMap((group) => group.pathologies)
      .filter((pathology) => !activeModule || pathologyBelongsToB3Module(pathology, activeModule))
      .filter((pathology) => !normalizedQuery || `${pathology.title} ${pathology.summary}`.toLocaleLowerCase("fr-CH").includes(normalizedQuery));
  }, [groups, moduleId, query, specialty]);

  return (
    <div>
      <div className="mb-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow m-0">CURSUS BACHELOR 3 · LAUSANNE</p><h2 className="mb-0 mt-1 text-2xl sm:text-3xl">Choisir un module</h2></div>
          {moduleId !== "all" && <button className="text-sm font-bold text-[var(--primary)]" onClick={() => { setModuleId("all"); setSpecialty("Toutes"); }} type="button">Voir tout le catalogue</button>}
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-5">
          {b3Modules.map((module) => {
            const selected = moduleId === module.id;
            return <button aria-pressed={selected} className={`min-h-36 w-[76vw] shrink-0 rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] sm:w-auto ${selected ? "border-[var(--primary)] bg-[var(--primary-subtle)] ring-2 ring-[var(--primary-glow)]" : "border-[var(--line)] bg-[var(--surface)]"}`} key={module.id} onClick={() => { setModuleId(module.id); setSpecialty("Toutes"); }} type="button"><span className={`inline-flex rounded-full bg-gradient-to-r ${module.tone} px-2.5 py-1 text-[10px] font-extrabold tracking-[.12em] text-white`}>{module.code}</span><strong className="mt-4 block text-sm leading-5 text-[var(--ink)]">{module.shortTitle}</strong><span className="mt-2 block text-xs leading-5 text-[var(--muted)]">{getB3ModuleCount(allPathologies, module)} fiches</span></button>;
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-subtle)] px-4 focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[var(--primary-glow)]">
          <Search aria-hidden="true" className="shrink-0 text-[var(--primary)]" size={19} />
          <span className="sr-only">Rechercher une pathologie</span>
          <input className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[var(--ink)] outline-none placeholder:text-[var(--muted-light)]" onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une pathologie, un symptôme…" type="search" value={query} />
          {query && <button aria-label="Effacer la recherche" className="grid size-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--ink)]" onClick={() => setQuery("")} type="button"><X aria-hidden="true" size={16} /></button>}
        </label>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Affiner par spécialité">
          {["Toutes", ...groups.map((group) => group.name)].map((name) => <button className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${specialty === name ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"}`} key={name} onClick={() => setSpecialty(name)} type="button">{name}</button>)}
        </div>
      </div>

      <div className="mb-5 mt-8 flex items-end justify-between gap-4">
        <div><p className="eyebrow m-0">RÉSULTATS</p><h2 className="mb-0 mt-1 text-2xl sm:text-3xl">{pathologies.length} fiche{pathologies.length > 1 ? "s" : ""}</h2></div>
        {!signedIn && <span className="hidden text-right text-xs leading-5 text-[var(--muted)] sm:block">Aperçu public<br />compte requis pour lire</span>}
      </div>

      {pathologies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pathologies.map((pathology) => {
            const destination = `/pathologies/${pathology.slug}`;
            const href = signedIn ? destination : `/signup?next=${encodeURIComponent(destination)}`;
            return (
              <article className="group flex min-h-72 flex-col rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--primary)_45%,var(--line))] hover:shadow-[var(--shadow-md)]" key={pathology.slug}>
                <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-[var(--primary-subtle)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] text-[var(--primary)]">{pathology.specialty}</span><span className={`inline-flex items-center gap-1 text-[10px] font-bold ${pathology.criticality === "urgent" ? "text-rose-600" : "text-[var(--muted)]"}`}>{pathology.criticality === "urgent" && <AlertTriangle aria-hidden="true" size={12} />}{criticalityLabels[pathology.criticality]}</span></div>
                <h3 className="mb-0 mt-6 text-balance text-xl">{pathology.title}</h3>
                <p className="mb-0 mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{pathology.summary}</p>
                <Link className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-[var(--primary)] no-underline" href={href}><BookOpenCheck aria-hidden="true" size={17} /> {signedIn ? "Ouvrir la fiche" : "Lire avec un compte"} <ArrowRight aria-hidden="true" className="ml-auto transition group-hover:translate-x-1" size={16} /></Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-[var(--line)] bg-[var(--surface-subtle)] px-6 py-16 text-center"><Search aria-hidden="true" className="mx-auto text-[var(--muted-light)]" size={30} /><h3 className="mb-2 mt-5 text-xl">Aucune fiche trouvée</h3><p className="m-0 text-[var(--muted)]">Essayez un autre terme ou élargissez les filtres.</p><button className="mt-5 font-bold text-[var(--primary)]" onClick={() => { setQuery(""); setSpecialty("Toutes"); setModuleId("all"); }} type="button">Réinitialiser les filtres</button></div>
      )}
    </div>
  );
}
