/**
 * Source unique de l'identité de marque.
 *
 * Renommer le produit = changer les valeurs ci-dessous. Aucune autre chaîne de
 * caractères de l'interface, des métadonnées ou des e-mails ne doit contenir le
 * nom en dur.
 */
export const BRAND_NAME = "Ausculta";
export const BRAND_NAME_UPPER = "AUSCULTA";
export const BRAND_DOMAIN = "ausculta.ch";
export const BRAND_EMAIL_FROM = `contact@${BRAND_DOMAIN}`;

/** Signature de marque : le geste d'écoute avant l'instrument. */
export const BRAND_TAGLINE = "Écouter. Comprendre. Soigner.";

/** Asset officiel du mot-symbole, avec ses dimensions intrinsèques. */
export const BRAND_LOGO_SRC = "/ausculta-logo.svg";
export const BRAND_LOGO_WIDTH = 243;
export const BRAND_LOGO_HEIGHT = 52;

/**
 * Offre payante, affichée dans les tarifs, le profil et la facturation.
 * « Premium » et non « Pro » : ce dernier nom est réservé à un futur produit
 * destiné aux soignants. L'identifiant technique du plan reste `pro`.
 */
export const BRAND_PLAN_LABEL = "Premium";
export const BRAND_PRO_PLAN = `${BRAND_NAME} ${BRAND_PLAN_LABEL}`;

/** Suffixe commun des balises <title>. */
export function pageTitle(title: string) {
  return `${title} — ${BRAND_NAME}`;
}

/**
 * Identifiant technique. Il n'est PAS un élément de marque : il nomme des clés
 * persistées (stockage navigateur, métadonnées Supabase), un en-tête HTTP
 * interne et un événement DOM. Il est écrit en dur, et non dérivé du nom de
 * marque, pour ne pas changer par accident : le modifier réinitialise le thème
 * enregistré dans le navigateur et impose un repli de lecture pour l'onboarding
 * (voir `LEGACY_ONBOARDING_METADATA_KEY`).
 */
const TECHNICAL_NAMESPACE = "ausculta";

export const THEME_STORAGE_KEY = `${TECHNICAL_NAMESPACE}-theme`;
export const PROGRESS_EVENT_NAME = `${TECHNICAL_NAMESPACE}:progress`;
export const PATHNAME_HEADER = `x-${TECHNICAL_NAMESPACE}-pathname`;
export const ONBOARDING_METADATA_KEY = `${TECHNICAL_NAMESPACE}_onboarding`;

/**
 * Clé d'onboarding écrite sous l'ancien nom du produit. Elle n'est plus jamais
 * écrite, seulement relue en repli : les comptes créés avant le renommage
 * gardent ainsi leurs réponses et ne repassent pas par l'onboarding.
 */
export const LEGACY_ONBOARDING_METADATA_KEY = "medtrain_onboarding";
