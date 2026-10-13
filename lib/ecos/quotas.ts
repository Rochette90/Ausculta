/**
 * Garde-fous de coût des stations ECOS.
 *
 * Les limites par minute (dans chaque route) freinent une rafale ; celles-ci
 * plafonnent ce qu'un compte peut consommer par jour en appels de modèle et
 * en synthèse vocale, selon son offre (Découverte ou Premium). Les plafonds
 * globaux bornent la facture quel que soit le nombre de comptes : atteints,
 * le moteur local et la voix du navigateur prennent le relais sans bloquer
 * l'étudiant. Chaque valeur se règle par variable d'environnement, sans
 * redéploiement de code. La page des tarifs affiche ces mêmes valeurs.
 */
export type EcosPlan = "free" | "pro";

export type EcosQuotas = {
  /** Stations démarrées par compte et par jour. */
  dailySessions: number;
  /** Questions envoyées au patient par compte et par jour. */
  dailyMessages: number;
  /** Répliques dites par la voix réaliste par compte et par jour ; au-delà, la voix du navigateur prend le relais. */
  dailyVoiceReplies: number;
  /** Messages enregistrés dans une même station (questions, réponses, gestes). */
  sessionMessages: number;
  /** Appels de modèle par jour, tous comptes confondus ; au-delà, le moteur local répond. */
  globalDailyMessages: number;
  /** Répliques dites par la voix réaliste par jour, tous comptes confondus ; au-delà, voix du navigateur. */
  globalDailyVoiceReplies: number;
};

/** Plafonds communs aux deux offres. */
const SHARED_DEFAULTS = {
  sessionMessages: 200,
  globalDailyMessages: 3000,
  globalDailyVoiceReplies: 200,
};

export const DEFAULT_ECOS_QUOTAS: Readonly<Record<EcosPlan, EcosQuotas>> = {
  // Découverte : de quoi s'entraîner chaque jour, avec un aperçu de la voix réaliste.
  free: { dailySessions: 3, dailyMessages: 120, dailyVoiceReplies: 10, ...SHARED_DEFAULTS },
  // Premium : usage intensif, mais fini (ElevenLabs facture au caractère).
  pro: { dailySessions: 10, dailyMessages: 600, dailyVoiceReplies: 150, ...SHARED_DEFAULTS },
};

export const DAY_SECONDS = 86_400;

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value?.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Offre d'un profil : toute valeur autre que `pro` vaut Découverte. */
export function ecosPlan(plan: unknown): EcosPlan {
  return plan === "pro" ? "pro" : "free";
}

export function ecosQuotas(env: Record<string, string | undefined> = process.env, plan: EcosPlan = "free"): EcosQuotas {
  const defaults = DEFAULT_ECOS_QUOTAS[plan];
  const prefix = plan === "pro" ? "ECOS_PRO_DAILY" : "ECOS_DAILY";
  return {
    dailySessions: positiveInteger(env[`${prefix}_SESSIONS`], defaults.dailySessions),
    dailyMessages: positiveInteger(env[`${prefix}_MESSAGES`], defaults.dailyMessages),
    dailyVoiceReplies: positiveInteger(env[`${prefix}_VOICE_REPLIES`], defaults.dailyVoiceReplies),
    sessionMessages: positiveInteger(env.ECOS_SESSION_MESSAGES, defaults.sessionMessages),
    globalDailyMessages: positiveInteger(env.ECOS_GLOBAL_DAILY_MESSAGES, defaults.globalDailyMessages),
    globalDailyVoiceReplies: positiveInteger(env.ECOS_GLOBAL_DAILY_VOICE_REPLIES, defaults.globalDailyVoiceReplies),
  };
}

/** Une station est pleine quand le dernier message enregistré atteint le plafond. */
export function sessionIsFull(lastSequence: number | null | undefined, quotas: EcosQuotas): boolean {
  return typeof lastSequence === "number" && lastSequence + 1 >= quotas.sessionMessages;
}
