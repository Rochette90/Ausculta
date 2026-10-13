import type { EcosScenario } from "./types.ts";

/**
 * Tempérament du patient pour une séance : rejouer une station ne redonne
 * pas exactement le même entretien. Seul le comportement change, jamais les
 * faits (symptômes, antécédents, résultats) : la grille et le débriefing
 * restent valables. La variante découle de l'identifiant de session, donc
 * stable pendant toute la séance, sans rien stocker.
 */
export const PATIENT_VARIANTS = [
  { id: "standard", label: "Tel que décrit dans la station", trait: "" },
  { id: "inquiet", label: "Plus inquiet", trait: "La personne qui répond est plus inquiète que d’habitude : elle demande une fois si c’est grave et se détend nettement quand on la rassure." },
  { id: "laconique", label: "Laconique", trait: "La personne qui répond est réservée : réponses encore plus brèves ; elle en dit davantage seulement quand la question est précise ou qu’on la met en confiance." },
  { id: "minimise", label: "Minimise ses symptômes", trait: "La personne qui répond minimise (« ce n’est sûrement rien ») ; elle reste vraie quand la question est précise, sans rien exagérer ni cacher." },
  { id: "presse", label: "Pressé", trait: "La personne qui répond est pressée : elle demande une fois combien de temps ça va prendre, et reste coopérante." },
  { id: "mefiant", label: "Un peu méfiant", trait: "La personne qui répond se méfie un peu : à la première question personnelle, elle demande pourquoi on la pose, puis répond normalement si on lui explique." },
] as const;

export type PatientVariant = (typeof PATIENT_VARIANTS)[number];

export function patientVariant(sessionId: string): PatientVariant {
  let hash = 2166136261;
  for (const char of sessionId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return PATIENT_VARIANTS[hash % PATIENT_VARIANTS.length];
}

/** Station jouée avec le tempérament de la séance : seul `persona` change. */
export function withPatientVariant(scenario: EcosScenario, sessionId: string): EcosScenario {
  const { trait } = patientVariant(sessionId);
  return trait ? { ...scenario, persona: `${scenario.persona} Pour cette séance : ${trait} Les faits restent exactement ceux de la station.` } : scenario;
}
