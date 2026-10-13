/**
 * Politique de sécurité du contenu (CSP), construite à deux endroits :
 * - `next.config.ts` : version sans nonce, filet de sécurité pour toute
 *   réponse qui ne passe pas par le proxy (fichiers statiques, erreurs) ;
 * - `proxy.ts` : version avec nonce par requête, posée sur les pages HTML.
 *   Next.js lit le nonce dans l'en-tête `Content-Security-Policy` de la
 *   requête et le reporte sur ses propres balises <script>.
 * Module pur : importé par la configuration Next (Node) et par le proxy (Edge).
 */
export type ContentSecurityPolicyOptions = {
  nonce?: string;
  isDevelopment?: boolean;
};

export function buildContentSecurityPolicy({ nonce, isDevelopment = false }: ContentSecurityPolicyOptions = {}): string {
  // Avec un nonce, `'strict-dynamic'` étend la confiance aux scripts chargés
  // par les scripts nonce-és (chunks Next.js) et neutralise `'unsafe-inline'`
  // pour les navigateurs modernes. `'unsafe-inline'` reste en secours pour les
  // navigateurs anciens, où il est ignoré dès qu'un nonce est présent.
  const scriptSources = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`
    : "'self' 'unsafe-inline'";
  return [
    "default-src 'self'",
    `script-src ${scriptSources}${isDevelopment ? " 'unsafe-eval'" : ""}`,
    // Les styles inline restent autorisés : React et Next.js en émettent
    // (attributs `style`, polices auto-hébergées) et leur injection seule
    // n'exécute pas de code.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/** Nonce aléatoire (128 bits), encodé en base64 comme l'attend l'attribut HTML. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export const NONCE_HEADER = "x-nonce";
