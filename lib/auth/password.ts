/**
 * Règles de mot de passe partagées par les formulaires (attributs HTML), les
 * routes API et l'instance Supabase (`minimum_password_length` dans
 * `supabase/config.toml`). Module pur, sans dépendance, pour rester testable.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Fenêtre pendant laquelle une session issue d'un lien de réinitialisation peut changer le mot de passe sans l'ancien. */
const RECOVERY_WINDOW_SECONDS = 60 * 60;

/** Message d'erreur lisible, ou `null` si le mot de passe est acceptable. */
export function passwordProblem(value: unknown): string | null {
  if (typeof value !== "string") return "Le mot de passe est obligatoire.";
  if (value.length < PASSWORD_MIN_LENGTH) return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  if (value.length > PASSWORD_MAX_LENGTH) return `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`;
  // eslint-disable-next-line no-control-regex -- rejeter les caractères de contrôle est le but
  if (/[\u0000-\u001f\u007f]/.test(value)) return "Le mot de passe contient des caractères non autorisés.";
  if (value.trim().length === 0) return "Le mot de passe ne peut pas être composé uniquement d'espaces.";
  return null;
}

export type AmrEntry = { method?: unknown; timestamp?: unknown };

/**
 * Vrai si la session courante vient d'un lien de réinitialisation récent.
 * `amr` (Authentication Methods Reference) est la liste des méthodes
 * d'authentification du JWT Supabase, la plus récente en premier.
 */
export function isRecentRecoverySession(amr: unknown, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!Array.isArray(amr) || amr.length === 0) return false;
  const latest = amr[0] as AmrEntry;
  if (latest?.method !== "recovery") return false;
  const timestamp = typeof latest.timestamp === "number" ? latest.timestamp : Number.NaN;
  if (!Number.isFinite(timestamp)) return false;
  return nowSeconds - timestamp <= RECOVERY_WINDOW_SECONDS && timestamp <= nowSeconds + 60;
}

/** Forme d'adresse e-mail minimale : un seul `@`, pas d'espace, longueur bornée. */
export function isPlausibleEmail(value: unknown): value is string {
  return typeof value === "string"
    && value.length >= 3
    && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
