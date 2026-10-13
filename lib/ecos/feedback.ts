export type EcosFeedbackCategory = "patient" | "grille" | "debriefing" | "technique" | "autre";

/** Sur quoi porte l'avis de fin de station (même liste que la contrainte SQL). */
export const ECOS_FEEDBACK_CATEGORIES: ReadonlyArray<{ key: EcosFeedbackCategory; label: string }> = [
  { key: "patient", label: "Le patient simulé" },
  { key: "grille", label: "La correction" },
  { key: "debriefing", label: "Le débriefing" },
  { key: "technique", label: "Un problème technique" },
  { key: "autre", label: "Autre" },
];
