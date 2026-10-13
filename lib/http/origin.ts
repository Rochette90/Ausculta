/**
 * Origine de confiance pour les requêtes mutantes.
 *
 * Derrière un reverse proxy (hébergement Node.js Infomaniak, Caddy, nginx),
 * l'URL vue par Next peut différer de l'origine publique : Next reconstruit
 * le protocole à partir de `x-forwarded-proto`, mais un proxy qui ne le
 * transmet pas laisse `request.url` en `http://`. L'origine publique
 * configurée (`NEXT_PUBLIC_APP_URL`) est donc acceptée en plus de celle de la
 * requête, à condition d'être en `https:` (ou `localhost` en développement).
 */
export function publicOrigin(configuredAppUrl: string | undefined): string | null {
  if (!configuredAppUrl) return null;
  try {
    const url = new URL(configuredAppUrl);
    if (url.protocol === "https:" || url.hostname === "localhost") return url.origin;
  } catch {
    // Valeur mal formée : ignorée, la requête fait foi.
  }
  return null;
}

export function isTrustedOrigin(
  origin: string,
  requestUrl: string,
  configuredAppUrl: string | undefined,
): boolean {
  let candidate: string;
  try {
    candidate = new URL(origin).origin;
  } catch {
    return false;
  }
  if (candidate === "null") return false;
  if (candidate === new URL(requestUrl).origin) return true;
  return candidate === publicOrigin(configuredAppUrl);
}
