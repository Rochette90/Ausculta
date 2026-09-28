"use client";

import { useCallback, type ReactNode } from "react";
import { useFicheReader } from "./FicheReader";

/**
 * Ancre suivie par le sommaire pour les blocs non repliables (liens, sources) :
 * ils restent surlignés dans la navigation comme n'importe quelle section.
 */
export function FicheAnchor({ id, children }: { id: string; children: ReactNode }) {
  const register = useFicheReader()?.registerSection;
  const ref = useCallback((element: HTMLElement | null) => register?.(id, element), [register, id]);
  return <section id={id} ref={ref}>{children}</section>;
}
