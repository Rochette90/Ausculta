/**
 * Garde-fous de coût des stations ECOS.
 *
 * Les limites par minute (dans chaque route) freinent une rafale ; celles-ci
 * plafonnent ce qu'un compte peut consommer par jour en appels de modèle et
 * en synthèse vocale. Chaque valeur se règle par variable d'environnement,
 * sans redéploiement de code.
 */
export type EcosQuotas = {
  /** Stations démarrées par compte et par jour. */
  dailySessions: number;
  /** Questions envoyées au patient par compte et par jour. */
  dailyMessages: number;
  /** Répliques dites par la voix réaliste par compte et par jour ; au-delà, la voix du navigateur prend le relais. */
  dailyVoiceReplies: number;
  /** Messages enregistrés dans une même station (questions, réponses, gestes). */
  sessionMessages: number;
};

export const DEFAULT_ECOS_QUOTAS: EcosQuotas = {
  dailySessions: 20,
  dailyMessages: 600,
  dailyVoiceReplies: 300,
  sessionMessages: 200,
};

export const DAY_SECONDS = 86_400;

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value?.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function ecosQuotas(env: Record<string, string | undefined> = process.env): EcosQuotas {
  return {
    dailySessions: positiveInteger(env.ECOS_DAILY_SESSIONS, DEFAULT_ECOS_QUOTAS.dailySessions),
    dailyMessages: positiveInteger(env.ECOS_DAILY_MESSAGES, DEFAULT_ECOS_QUOTAS.dailyMessages),
    dailyVoiceReplies: positiveInteger(env.ECOS_DAILY_VOICE_REPLIES, DEFAULT_ECOS_QUOTAS.dailyVoiceReplies),
    sessionMessages: positiveInteger(env.ECOS_SESSION_MESSAGES, DEFAULT_ECOS_QUOTAS.sessionMessages),
  };
}

/** Une station est pleine quand le dernier message enregistré atteint le plafond. */
export function sessionIsFull(lastSequence: number | null | undefined, quotas: EcosQuotas): boolean {
  return typeof lastSequence === "number" && lastSequence + 1 >= quotas.sessionMessages;
}
