/**
 * Le verbe d'action d'une séance est dérivé du niveau de maîtrise, jamais écrit
 * en dur : on ne « consolide » pas une spécialité jamais travaillée.
 *
 * 0–29 % → Découvrir · 30–69 % → Renforcer · 70–100 % → Consolider
 */
export const STUDY_SESSION_VERBS = ["Découvrir", "Renforcer", "Consolider"] as const;

export type StudySessionVerb = (typeof STUDY_SESSION_VERBS)[number];

/** Ramène une valeur quelconque dans l'intervalle [0, 100], arrondie à l'entier. */
function clampMastery(masteryPercentage: number): number {
  if (!Number.isFinite(masteryPercentage)) return 0;
  return Math.min(100, Math.max(0, Math.round(masteryPercentage)));
}

export function studySessionVerb(masteryPercentage: number): StudySessionVerb {
  const mastery = clampMastery(masteryPercentage);
  if (mastery < 30) return "Découvrir";
  if (mastery < 70) return "Renforcer";
  return "Consolider";
}

/**
 * Titre affiché d'une séance : le verbe dérivé de la maîtrise suivi du sujet
 * clinique du catalogue (« la cardiologie », « l'abdomen aigu »…).
 */
export function studySessionTitle(subject: string, masteryPercentage: number): string {
  return `${studySessionVerb(masteryPercentage)} ${subject}`;
}

/** Maîtrise d'une séance = part des activités terminées. */
export function studySessionMastery(completedSteps: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return clampMastery((completedSteps / totalSteps) * 100);
}
