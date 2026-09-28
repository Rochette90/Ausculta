"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, type ReactNode } from "react";
import { useFicheReader } from "./FicheReader";

/**
 * Une section du squelette : numéro stable, intitulé rédigé et — quand la fiche
 * emploie un autre mot — le chapitre canonique correspondant. Le lecteur
 * retrouve ainsi « Diagnostics différentiels » qu'elle s'appelle « DD » ici et
 * « Différentiels » ailleurs. Repliable et adressable, pour balayer avant de lire.
 */
export function FicheSectionCard({
  id,
  index,
  title,
  chapterLabel,
  group,
  icon,
  children,
}: {
  id: string;
  index: number;
  title: string;
  /** Intitulé canonique, affiché seulement s'il diffère du titre rédigé. */
  chapterLabel?: string;
  group: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const reader = useFicheReader();
  const collapsed = reader?.isCollapsed(id) ?? false;
  const active = reader?.activeId === id;
  const register = reader?.registerSection;
  const ref = useCallback((element: HTMLElement | null) => register?.(id, element), [register, id]);

  const bodyId = `${id}-corps`;
  const alias = chapterLabel && chapterLabel.toLowerCase() !== title.toLowerCase() ? chapterLabel : null;

  return (
    <section
      className={`fiche-section${active ? " is-active" : ""}${collapsed ? " is-collapsed" : ""}`}
      data-group={group}
      id={id}
      ref={ref}
    >
      <header>
        <span className="fiche-section-index">{String(index).padStart(2, "0")}</span>
        <span className="fiche-section-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          {alias && <small>{alias}</small>}
        </div>
        <button
          aria-controls={bodyId}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Déplier ${title}` : `Replier ${title}`}
          className="fiche-section-toggle"
          onClick={() => reader?.toggleSection(id)}
          type="button"
        >
          <ChevronDown size={18} />
        </button>
      </header>
      <div className="fiche-section-body" hidden={collapsed} id={bodyId}>
        {children}
      </div>
    </section>
  );
}
