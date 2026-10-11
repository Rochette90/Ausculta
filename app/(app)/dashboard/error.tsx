"use client";

import { useEffect } from "react";
import { BRAND_NAME } from "@/lib/brand";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(`${BRAND_NAME} dashboard rendering error`, error);
  }, [error]);

  return (
    <main className="learning-page">
      <div className="learning-empty">
        <h1>Impossible de charger ta progression</h1>
        <p>La connexion a été interrompue. Tes données sont conservées : relance simplement le chargement du tableau de bord.</p>
        <button className="button primary" onClick={reset} type="button">Réessayer</button>
      </div>
    </main>
  );
}
