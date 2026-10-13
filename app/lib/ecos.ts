// La grille ECOS est désormais propre à chaque station : voir lib/ecos/scoring.ts
// et lib/ecos/stations. Ce module ne conserve que les récompenses d'activité.
export type { EcosMessage } from "@/lib/ecos/types.ts";

export function calculateActivityReward(activityType: string, score: number) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  switch (activityType) {
    case "fiche":
      return { score: 100, xp: 10 };
    case "quiz":
      return { score: safeScore, xp: 10 + Math.round(safeScore / 25) * 15 };
    case "diagnostic-flash":
      return { score: safeScore, xp: safeScore >= 100 ? 25 : 15 };
    case "rci":
      return { score: safeScore, xp: safeScore >= 100 ? 45 : 20 };
    case "tutorial":
      return { score: safeScore, xp: safeScore >= 80 ? 20 : 12 };
    default:
      return null;
  }
}
