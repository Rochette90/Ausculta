/** Shift an ISO calendar date (YYYY-MM-DD) by a number of days. */
export function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * `profiles.streak` only changes when the learner earns XP, so a streak broken
 * several days ago is still stored. It stays alive until the end of the day
 * after the last activity (Europe/Zurich calendar dates).
 */
export function activeStreak(streak: number | null | undefined, lastActivityDate: string | null | undefined, today: string): number {
  if (!streak || streak < 0 || !lastActivityDate) return 0;
  return lastActivityDate >= shiftIsoDate(today, -1) ? streak : 0;
}
