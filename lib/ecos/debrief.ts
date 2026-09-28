import "server-only";

import pathologyCatalog from "@/content/pathologies/index.json";
import type { EcosDebrief } from "./types.ts";

const titles = new Map((pathologyCatalog as Array<{ slug: string; title: string }>).map((item) => [item.slug, item.title]));

export type EcosDebriefView = Omit<EcosDebrief, "pathologySlugs"> & { fiches: Array<{ slug: string; title: string }> };

/** Debrief sent after grading, with the titles of the fiches to revise. */
export function debriefView(debrief: EcosDebrief): EcosDebriefView {
  const { pathologySlugs, ...rest } = debrief;
  return {
    ...rest,
    fiches: pathologySlugs.flatMap((slug) => {
      const title = titles.get(slug);
      return title ? [{ slug, title }] : [];
    }),
  };
}
