"use client";

import { ChevronsDownUp, ChevronsUpDown, ListTree } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type TocEntry = { id: string; title: string; subsections: { id: string; title: string }[] };
/** Une phase du squelette canonique : c'est l'unité de navigation du sommaire. */
export type TocGroup = { key: string; label: string; entries: TocEntry[] };

type ReaderValue = {
  activeId: string | null;
  isCollapsed: (id: string) => boolean;
  toggleSection: (id: string) => void;
  registerSection: (id: string, element: HTMLElement | null) => void;
};

const ReaderContext = createContext<ReaderValue | null>(null);

export function useFicheReader() {
  return useContext(ReaderContext);
}

/**
 * Colonne de lecture des fiches : sommaire persistant organisé par phases
 * (synthèse → clinique → diagnostic → prise en charge), suivi de position,
 * repli des sections et jauge d'avancement. Toutes les fiches se parcourent
 * ainsi de la même façon, quel que soit leur auteur.
 */
export function FicheReader({
  groups,
  collapsibleIds,
  meta,
  children,
}: {
  groups: TocGroup[];
  /** Sections repliables : les annexes sont ancrées mais restent dépliées. */
  collapsibleIds: string[];
  meta: string;
  children: ReactNode;
}) {
  const entries = useMemo(() => groups.flatMap((group) => group.entries), [groups]);
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const [progress, setProgress] = useState(0);
  const elements = useRef(new Map<string, HTMLElement>());

  const registerSection = useCallback((id: string, element: HTMLElement | null) => {
    if (element) elements.current.set(id, element);
    else elements.current.delete(id);
  }, []);

  // La section active est la dernière dont l'en-tête est passée sous la barre.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const anchor = window.innerHeight * 0.28;
      let current: string | null = null;
      for (const [id, element] of elements.current) {
        if (element.getBoundingClientRect().top <= anchor) current = id;
      }
      setActiveId(current ?? entries[0]?.id ?? null);

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [entries]);

  const toggleSection = useCallback((id: string) => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const allCollapsed = collapsibleIds.length > 0 && collapsibleIds.every((id) => collapsed.has(id));
  const toggleAll = () => setCollapsed(allCollapsed ? new Set() : new Set(collapsibleIds));

  const value = useMemo<ReaderValue>(
    () => ({ activeId, isCollapsed: (id) => collapsed.has(id), toggleSection, registerSection }),
    [activeId, collapsed, toggleSection, registerSection],
  );

  const activeGroup = groups.find((group) => group.entries.some((entry) => entry.id === activeId));

  // La numérotation court sur toute la fiche : « 07 » désigne la même section
  // dans le sommaire, dans le fil et dans une discussion entre étudiants.
  const numbers = new Map(entries.map((entry, index) => [entry.id, String(index + 1).padStart(2, "0")]));

  const groupList = (onNavigate?: () => void) =>
    groups.map((group) => (
      <li className="fiche-toc-group" data-group={group.key} key={group.key}>
        <p className="fiche-toc-group-label">
          <span aria-hidden="true" className="fiche-toc-group-dot" />
          {group.label}
        </p>
        <ul>
          {group.entries.map((entry) => (
            <li key={entry.id}>
              <a
                aria-current={activeId === entry.id ? "true" : undefined}
                className="fiche-toc-link"
                href={`#${entry.id}`}
                onClick={onNavigate}
              >
                <span className="fiche-toc-index">{numbers.get(entry.id)}</span>
                <span className="fiche-toc-label">{entry.title}</span>
              </a>
              {activeId === entry.id && entry.subsections.length > 0 && (
                <ul className="fiche-toc-sub">
                  {entry.subsections.slice(0, 8).map((sub) => (
                    <li key={sub.id}>
                      <a href={`#${sub.id}`} onClick={onNavigate}>{sub.title}</a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </li>
    ));

  return (
    <ReaderContext.Provider value={value}>
      <div aria-hidden="true" className="fiche-progress">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      {entries.length > 0 && (
        <details className="fiche-toc-mobile">
          <summary>
            <ListTree size={16} /> Sommaire
            <small>{activeGroup ? activeGroup.label : `${entries.length} sections`}</small>
          </summary>
          <ul>{groupList()}</ul>
        </details>
      )}

      <div className={entries.length > 0 ? "fiche-layout" : "fiche-layout is-bare"}>
        {entries.length > 0 && (
          <aside aria-label="Sommaire de la fiche" className="fiche-toc">
            <p className="fiche-toc-heading">
              <ListTree size={15} /> Plan de la fiche
            </p>
            <nav>
              <ul className="fiche-toc-groups">{groupList()}</ul>
            </nav>
            <footer>
              <span>{meta}</span>
              <button onClick={toggleAll} type="button">
                {allCollapsed ? <ChevronsUpDown size={13} /> : <ChevronsDownUp size={13} />}
                {allCollapsed ? "Tout déplier" : "Tout replier"}
              </button>
            </footer>
          </aside>
        )}
        <div className="fiche-stream">{children}</div>
      </div>
    </ReaderContext.Provider>
  );
}
