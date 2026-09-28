import "server-only";

import pathologyData from "@/content/pathologies/index.json";

import type { Criticality } from "@/types/content";

export type PublicPathology = {
  slug: string;
  title: string;
  specialty: string;
  criticality: Criticality;
  summary: string;
  keyPoints: string[];
};

const specialtyOrder = [
  "Cardiologie",
  "Dermatologie",
  "Endocrinologie",
  "Gastro-entérologie",
  "Hématologie",
  "Infectiologie",
  "Néphrologie",
  "Neurologie",
  "Oncologie",
  "Pédiatrie",
  "Pneumologie",
  "Psychiatrie",
  "Radiologie",
  "Rhumatologie",
  "Urgences",
];

export function getPublicCatalog() {
  const pathologies = (pathologyData as PublicPathology[]).toSorted((first, second) =>
    first.title.localeCompare(second.title, "fr-CH"),
  );

  return specialtyOrder.map((name) => ({
    name,
    pathologies: pathologies.filter((pathology) => pathology.specialty === name),
  }));
}
