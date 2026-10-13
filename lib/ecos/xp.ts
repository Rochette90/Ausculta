/**
 * XP d'une station : elle récompense ce qui fait progresser pour l'ECOS,
 * pas la simple présence. Calculée sur le serveur à la fin de la station et
 * créditée une fois par séance (`complete_ecos_session`, 0 à 300 XP).
 */

/** En dessous, l'entretien n'a pas vraiment eu lieu : la station ne rapporte rien. */
export const MIN_INTERVIEW_QUESTIONS = 3;

export const STATION_XP = {
  /** Par point de grille obtenu (22 points au plus). */
  perPoint: 2,
  /** Première fois que la station est menée à terme. */
  newPatient: 10,
  /** Meilleur score personnel battu sur une station déjà terminée. */
  record: 15,
  /** Par réflexe d'entretien acquis dans la station (11 au plus). */
  perReflex: 1,
  /** Station terminée en conditions d'examen (13 minutes). */
  examMode: 10,
} as const;

export type StationXpInput = {
  score: number;
  /** Questions posées au patient pendant l'entretien. */
  questions: number;
  /** Meilleur score des séances précédentes sur cette station, `null` si jamais terminée. */
  previousBest: number | null;
  reflexes: number;
  mode: "training" | "exam";
};

export type StationXp = { total: number; lines: Array<{ label: string; xp: number }> };

export function stationXp(input: StationXpInput): StationXp {
  if (input.questions < MIN_INTERVIEW_QUESTIONS) {
    return { total: 0, lines: [{ label: "Entretien trop court : pose au moins trois questions au patient pour gagner de l’XP", xp: 0 }] };
  }
  const lines: StationXp["lines"] = [{ label: `Score : ${input.score} point${input.score > 1 ? "s" : ""}`, xp: input.score * STATION_XP.perPoint }];
  if (input.previousBest === null) lines.push({ label: "Nouveau patient", xp: STATION_XP.newPatient });
  else if (input.score > input.previousBest) lines.push({ label: `Record battu (${input.previousBest} → ${input.score})`, xp: STATION_XP.record });
  if (input.reflexes > 0) lines.push({ label: `Réflexes d’entretien : ${input.reflexes}`, xp: input.reflexes * STATION_XP.perReflex });
  if (input.mode === "exam") lines.push({ label: "Conditions d’examen", xp: STATION_XP.examMode });
  const kept = lines.filter((line) => line.xp > 0);
  return { total: Math.min(300, kept.reduce((sum, line) => sum + line.xp, 0)), lines: kept };
}
