import Link from "next/link";
import { ShieldAlert } from "lucide-react";

// Rendu avec un statut HTTP 403. Aucune donnée d'administration n'est exposée.
export default function AdminForbidden() {
  return (
    <main className="page-enter mx-auto w-full max-w-2xl px-4 pb-28 pt-16 text-center sm:px-6">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-700">
        <ShieldAlert size={26} />
      </span>
      <h1 className="mb-0 mt-7 !text-3xl">Accès refusé</h1>
      <p className="mx-auto mb-0 mt-4 max-w-md text-[var(--muted)]">
        Cette section est réservée aux comptes administrateurs.
      </p>
      <Link
        className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-5 font-bold text-white no-underline"
        href="/dashboard"
      >
        Revenir à l&apos;accueil
      </Link>
    </main>
  );
}
