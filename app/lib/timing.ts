import { BRAND_NAME } from "@/lib/brand";

const ENABLED = process.env.NODE_ENV === "development";

/**
 * Chronomètre d'une requête, pour repérer l'étape lente d'un échange vocal.
 * N'écrit dans le journal qu'en développement : rien n'est mesuré ni journalisé
 * en production.
 */
export function stopwatch(scope: string) {
  const start = performance.now();
  let last = start;
  const marks: string[] = [];
  return {
    /** Temps écoulé depuis la marque précédente. */
    mark(label: string) {
      if (!ENABLED) return;
      const now = performance.now();
      marks.push(`${label}=${Math.round(now - last)}ms`);
      last = now;
    },
    done(extra = "") {
      if (!ENABLED) return;
      console.info(`${BRAND_NAME} timing ${scope}: ${marks.join(" ")} total=${Math.round(performance.now() - start)}ms${extra ? ` ${extra}` : ""}`);
    },
  };
}
