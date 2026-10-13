import type { EcosMode } from "./types.ts";

/** Wall-clock timing remains correct when a browser throttles a background tab. */
export function remainingSeconds(deadline: number, now: number) {
  return Math.max(0, Math.ceil((deadline - now) / 1_000));
}

/** Exam mode: 13 minutes for the whole station (history, exam and synthesis). */
export const EXAM_DURATION_SECONDS = 13 * 60;
/** Training has no clock; an abandoned session still closes after 3 hours. */
export const TRAINING_MAX_SECONDS = 3 * 60 * 60;
/** Network latency allowance before the server refuses a late action. */
const SUBMISSION_GRACE_SECONDS = 30;

export function parseEcosMode(value: unknown): EcosMode {
  return value === "exam" ? "exam" : "training";
}

/** Last instant (ms) at which the server accepts actions for a session. */
export function sessionDeadline(mode: unknown, startedAt: string | number | Date): number {
  const start = new Date(startedAt).getTime();
  const seconds = parseEcosMode(mode) === "exam" ? EXAM_DURATION_SECONDS : TRAINING_MAX_SECONDS;
  return start + (seconds + SUBMISSION_GRACE_SECONDS) * 1_000;
}

/** Mode examen : signal « il reste 2 minutes », comme le jour de l'ECOS. */
export const EXAM_WARNING_SECONDS = 2 * 60;

/** Signal à donner quand le chronomètre passe de `previous` à `current` secondes restantes. */
export function examSignal(previous: number, current: number): "warning" | "end" | null {
  if (previous > 0 && current === 0) return "end";
  if (previous > EXAM_WARNING_SECONDS && current <= EXAM_WARNING_SECONDS && current > 0) return "warning";
  return null;
}
