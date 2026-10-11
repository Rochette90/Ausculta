import Link from "next/link";

// Rendu avec un statut HTTP 403. Aucune donnée d'administration n'est exposée.
export default function AdminForbidden() {
  return (
    <main className="learning-page">
      <div className="learning-empty">
        <h1>Accès refusé</h1>
        <p>Cette section est réservée aux comptes administrateurs.</p>
        <Link className="button primary" href="/dashboard">Revenir à l&apos;accueil</Link>
      </div>
    </main>
  );
}
