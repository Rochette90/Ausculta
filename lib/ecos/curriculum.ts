import { ecosPublicCode } from "./stations/index.ts";

/**
 * Parcours de l'ECOS de 3ᵉ année (UNIL) : 8 stations fixes, chacune avec sa
 * grille d'entraînement en binôme. Les stations avec patient simulé y sont
 * rangées par type, comme le jour de l'examen où l'on connaît le type de
 * station mais pas le patient. Les slugs internes (qui nomment le
 * diagnostic) restent sur le serveur : seuls les codes publics en sortent.
 */
const ECOS3_TYPES = [
  { id: "cardio-pulmonaire", label: "Cardio-pulmonaire", grid: "cardio-pulmonaire", slugs: ["douleur-thoracique-aigue", "fibrillation-auriculaire", "pneumonie-communautaire", "pneumothorax-spontane", "embolie-pulmonaire-post-voyage", "crise-asthme", "insuffisance-cardiaque-decompensee"] },
  { id: "neurologique", label: "Neurologique", grid: "neurologique", slugs: ["avc-ischemique-sylvien-gauche", "hemorragie-sous-arachnoidienne"] },
  { id: "abdominal", label: "Abdominal", grid: "abdominal", slugs: ["appendicite-aigue", "pancreatite-aigue", "cholecystite-aigue", "colique-nephretique", "acidocetose-diabetique"] },
  { id: "fievre", label: "Fièvre", grid: "fievre", slugs: ["meningite-aigue", "endocardite-infectieuse", "pyelonephrite-aigue"] },
  { id: "psychosocial", label: "Psychosocial", grid: "psychosocial", slugs: ["humeur-depressive-idees-suicidaires"] },
  { id: "pediatrie", label: "Pédiatrie", grid: "pediatrie", slugs: ["convulsion-febrile"] },
  { id: "bls", label: "BLS", grid: "bls", slugs: [] },
  { id: "dermatologie", label: "Dermatologie", grid: "dermatologie", slugs: ["erysipele-jambe"] },
] as const;

export type Ecos3Type = { id: string; label: string; grid: string; codes: string[] };

/** Les 8 types de l'ECOS de 3ᵉ année, avec les codes publics de leurs stations jouables. */
export function ecos3Parcours(): Ecos3Type[] {
  return ECOS3_TYPES.map(({ id, label, grid, slugs }) => ({
    id,
    label,
    grid,
    codes: slugs.flatMap((slug) => ecosPublicCode(slug) ?? []),
  }));
}

/** Type de l'ECOS de 3ᵉ année d'une station (slug interne), `null` hors parcours. Serveur seulement. */
export function ecos3TypeOf(slug: string): string | null {
  return ECOS3_TYPES.find((type) => (type.slugs as readonly string[]).includes(slug))?.id ?? null;
}

/** Types de 3ᵉ année jouables avec un patient simulé (le BLS se travaille en binôme). */
export const ECOS3_PLAYABLE_TYPES = ECOS3_TYPES.filter((type) => type.slugs.length > 0).length;

/** Slugs rangés dans le parcours (pour les tests de cohérence). */
export const ECOS3_SLUGS: readonly string[] = ECOS3_TYPES.flatMap((type) => type.slugs);
