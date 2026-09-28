"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="learning-page"><div className="learning-empty"><p className="learning-eyebrow">CONNEXION INTERROMPUE</p><h1>Le contenu n’a pas pu être chargé.</h1><p>Réessaie dans un instant. Tes activités déjà enregistrées sont conservées.</p><div className="flex flex-wrap justify-center gap-3"><button className="button primary" onClick={reset}>Réessayer</button><Link className="button secondary" href="/dashboard">Retour à l’accueil</Link></div></div></main>;
}
