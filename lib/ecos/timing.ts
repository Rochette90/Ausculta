/** Wall-clock timing remains correct when a browser throttles a background tab. */
export function remainingSeconds(deadline: number, now: number) {
  return Math.max(0, Math.ceil((deadline - now) / 1_000));
}
export const SUPPORTED_ECOS_SLUG = "douleur-thoracique-aigue";
export const ECOS_DURATION_SECONDS = 8 * 60;
