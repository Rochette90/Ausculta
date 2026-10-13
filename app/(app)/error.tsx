"use client";
import { useEffect } from "react";
import Link from "next/link";
import { reportClientError } from "@/app/actions/ecos-feedback";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportClientError({ path: window.location.pathname, message: error.message, digest: error.digest }).catch(() => {});
  }, [error]);
  return <main className="learning-page"><div className="learning-empty"><h1>Le contenu n’a pas pu être chargé.</h1><p>La connexion a été interrompue. Réessaie dans un instant : tes activités déjà enregistrées sont conservées.</p><div className="learning-empty-actions"><button className="button primary" onClick={reset}>Réessayer</button><Link className="button secondary" href="/dashboard">Retour à l’accueil</Link></div></div></main>;
}
