/**
 * Niveaux progressifs : chaque niveau demande 100 XP de plus que le
 * précédent (100, 300, 600, 1 000 XP…), soit une station de plus environ.
 * Calculés depuis l'XP totale ; la colonne `profiles.level` (100 XP par
 * niveau, tenue par `add_xp`) n'est plus affichée.
 */
export function levelThreshold(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelFromXp(xp: number) {
  const total = Math.max(0, Math.floor(xp));
  let level = 1;
  while (levelThreshold(level + 1) <= total) level += 1;
  const floor = levelThreshold(level);
  const next = levelThreshold(level + 1);
  return { level, current: total - floor, needed: next - floor, percentage: Math.round(((total - floor) / (next - floor)) * 100) };
}
