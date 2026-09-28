export const DEFAULT_AFTER_LOGIN_PATH = "/dashboard";

const PROBE_ORIGIN = "https://redirect-probe.invalid";

/**
 * Returns a same-origin path (pathname + search + hash) or the fallback.
 *
 * Prefix checks alone are not enough: URL parsers drop tabs/newlines and treat
 * `\` like `/`, so `"/\t/evil.com"` or `"/\\evil.com"` become protocol-relative
 * URLs once resolved. The value is therefore resolved against a probe origin and
 * must still belong to it.
 */
export function safeRedirectPath(value: unknown, fallback: string = DEFAULT_AFTER_LOGIN_PATH): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2_048) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // eslint-disable-next-line no-control-regex -- rejecting control characters is the point
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;
  let parsed: URL;
  try {
    parsed = new URL(value, PROBE_ORIGIN);
  } catch {
    return fallback;
  }
  if (parsed.origin !== PROBE_ORIGIN) return fallback;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
