/**
 * Source unique de l'identité de marque.
 *
 * Renommer le produit = changer les valeurs ci-dessous. Aucune autre chaîne de
 * caractères de l'interface, des métadonnées ou des e-mails ne doit contenir le
 * nom en dur.
 */
export const BRAND_NAME = "MedTrain";
export const BRAND_NAME_UPPER = "MEDTRAIN";
export const BRAND_DOMAIN = "medtrain.ch";
export const BRAND_EMAIL_FROM = `contact@${BRAND_DOMAIN}`;

/** Asset officiel du mot-symbole, avec ses dimensions intrinsèques. */
export const BRAND_LOGO_SRC = "/medtrain-logo.png";
export const BRAND_LOGO_WIDTH = 242;
export const BRAND_LOGO_HEIGHT = 52;

/** Nom de l'offre payante, affiché dans les tarifs, le profil et la facturation. */
export const BRAND_PRO_PLAN = `${BRAND_NAME} Pro`;

/** Suffixe commun des balises <title>. */
export function pageTitle(title: string) {
  return `${title} — ${BRAND_NAME}`;
}

/**
 * Identifiant technique historique. Il n'est PAS un élément de marque : il
 * nomme des clés persistées (stockage navigateur, métadonnées Supabase),
 * un en-tête HTTP interne et un événement DOM. Le changer invaliderait le thème
 * et l'onboarding déjà enregistrés chez les utilisateurs existants, donc il
 * reste stable quand la marque change.
 */
const TECHNICAL_NAMESPACE = "medtrain";

export const THEME_STORAGE_KEY = `${TECHNICAL_NAMESPACE}-theme`;
export const PROGRESS_EVENT_NAME = `${TECHNICAL_NAMESPACE}:progress`;
export const PATHNAME_HEADER = `x-${TECHNICAL_NAMESPACE}-pathname`;
export const ONBOARDING_METADATA_KEY = `${TECHNICAL_NAMESPACE}_onboarding`;
