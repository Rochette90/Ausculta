import type { Instrumentation } from "next";

/**
 * Erreurs serveur (pages, routes API, actions) : copiées dans `app_errors`
 * pour la phase de test. Seulement côté Node, où vit le client service_role.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { recordAppError } = await import("./lib/monitoring/errors");
  const message = error instanceof Error ? error.message : String(error);
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  await recordAppError({
    source: "server",
    path: `${request.method} ${request.path.split("?")[0]} (${context.routeType})`,
    message,
    digest,
  });
};
