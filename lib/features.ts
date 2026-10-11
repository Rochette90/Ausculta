/**
 * Périmètre du produit.
 *
 * Le lancement se concentre sur les stations ECOS avec patient simulé. Les
 * autres modules restent dans le code, mais ils sont masqués : ils sortent de
 * la navigation, du tableau de bord et de l'onboarding, et leurs adresses
 * redirigent (voir `disabledRouteFallback`, appliqué dans `proxy.ts`).
 *
 * Réactiver un module = passer sa valeur à `true`. Les textes des pages
 * publiques (accueil, méthode, FAQ, tarifs) sont rédigés pour le périmètre
 * actuel et sont à compléter au moment de la réactivation.
 */
export type FeatureKey = "ecos" | "fiches" | "quiz" | "anatomy" | "sessions" | "tutorials";

export const FEATURES: Readonly<Record<FeatureKey, boolean>> = {
  /** Stations ECOS avec patient simulé : le cœur du produit. */
  ecos: true,
  /**
   * Catalogue de fiches (`/specialties`, `/fiches`, `/catalogue`, `/qualite`).
   * Désactivé, seules les fiches citées par le débriefing d'une station
   * restent lisibles, depuis ce débriefing.
   */
  fiches: false,
  /** QCM par spécialité et quiz du jour (`/quiz`). */
  quiz: false,
  /** Anatomie clinique et mini-cas de raisonnement (`/anatomie`). */
  anatomy: false,
  /** Séances guidées fiche → QCM → cas (`/sessions`). */
  sessions: false,
  /** Tutoriels interactifs ECG et radio du thorax (`/tutoriels`). */
  tutorials: false,
};

export function isFeatureEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature];
}

/** Modules annoncés « prochainement » sur les pages publiques. */
export const UPCOMING_FEATURE_LABELS: ReadonlyArray<{ feature: FeatureKey; label: string }> = [
  { feature: "fiches", label: "Fiches de révision" },
  { feature: "quiz", label: "QCM expliqués" },
];

/** Page d'arrivée d'un compte connecté quand le module demandé est masqué. */
const APP_FALLBACK = "/cas";
/** Page d'arrivée d'un visiteur quand la page publique demandée est masquée. */
const PUBLIC_FALLBACK = "/";

const ROUTE_FEATURES: ReadonlyArray<{ prefix: string; feature: FeatureKey; fallback: string }> = [
  { prefix: "/specialties", feature: "fiches", fallback: APP_FALLBACK },
  { prefix: "/fiches", feature: "fiches", fallback: APP_FALLBACK },
  { prefix: "/catalogue", feature: "fiches", fallback: PUBLIC_FALLBACK },
  { prefix: "/qualite", feature: "fiches", fallback: PUBLIC_FALLBACK },
  { prefix: "/quiz", feature: "quiz", fallback: APP_FALLBACK },
  { prefix: "/anatomie", feature: "anatomy", fallback: APP_FALLBACK },
  { prefix: "/sessions", feature: "sessions", fallback: APP_FALLBACK },
  { prefix: "/tutoriels", feature: "tutorials", fallback: PUBLIC_FALLBACK },
];

/**
 * Adresse de repli si `pathname` appartient à un module masqué, sinon `null`.
 * Les fiches individuelles (`/pathologies/…`) ne passent pas par ici : leur
 * page décide elle-même, selon que la fiche est liée ou non à une station.
 */
export function disabledRouteFallback(pathname: string): string | null {
  const route = ROUTE_FEATURES.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return route && !FEATURES[route.feature] ? route.fallback : null;
}

/** Priorités d'apprentissage proposées à l'onboarding, avec leur module. */
export const LEARNING_PRIORITY_FEATURES = {
  fiches: "fiches",
  qcm: "quiz",
  cas_cliniques: "ecos",
  seances: "sessions",
} as const satisfies Record<string, FeatureKey>;

export type LearningPriority = keyof typeof LEARNING_PRIORITY_FEATURES;

/**
 * Les spécialités prioritaires ne servent qu'à ordonner les fiches et les QCM :
 * l'onboarding ne les demande que si l'un de ces modules est actif.
 */
export const ONBOARDING_ASKS_SPECIALTIES: boolean = FEATURES.fiches || FEATURES.quiz;

export function isLearningPriorityAvailable(priority: LearningPriority): boolean {
  return FEATURES[LEARNING_PRIORITY_FEATURES[priority]];
}
