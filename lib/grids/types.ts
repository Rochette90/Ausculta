/**
 * Grilles d'entraînement en binôme : un étudiant joue le patient, l'autre
 * passe la station, un troisième coche. Contrairement aux stations simulées,
 * la grille est faite pour être lue : rien ici n'est confidentiel.
 */

/** Oui = 2 points, ± = 1, non = 0. */
export type GridMark = "yes" | "partial" | "no";

/** Barème qualitatif : bien = oui, suffisant = ±, insuffisant = non. */
export type GridRubric = "quality" | ReadonlyArray<string>;

export type ChecklistSection = {
  id: string;
  title: string;
  kind: "checklist";
  items: ReadonlyArray<string>;
  /** Nombre d'items cochés pour obtenir « oui », puis « ± ». */
  rule: { yes: number; partial: number };
};

export type JudgementSection = {
  id: string;
  title: string;
  kind: "judgement";
  rubric?: GridRubric;
};

export type GridSection = ChecklistSection | JudgementSection;

export type GridTab = {
  label: string;
  /** Piège à ne pas manquer ; `**gras**` autorisé. */
  alert?: string;
  sections: ReadonlyArray<GridSection>;
};

export type DifferentialCard = {
  name: string;
  level: "urgent" | "high" | "mid" | "low";
  levelLabel: string;
  description: string;
  tags: ReadonlyArray<string>;
};

export type PracticeGrid = {
  slug: string;
  title: string;
  themes: string;
  history: GridTab;
  exam: GridTab;
  synthesis: {
    label: string;
    criteria: ReadonlyArray<{ id: string; title: string; rubric?: GridRubric }>;
    /** Les cartes ne rapportent pas de points : elles servent de pense-bête. */
    cardsLabel: string;
    cards: ReadonlyArray<DifferentialCard>;
  };
};

/** Ce que l'administration édite : la grille sans son identité (slug, titre, thèmes). */
export type GridContent = Pick<PracticeGrid, "history" | "exam" | "synthesis">;
