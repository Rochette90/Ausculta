import { BookOpenText } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { pageTitle } from "@/lib/brand";
import { getTheoryFiches } from "@/lib/theory/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Théorie") };

export default async function TheoryPage() {
  await requireUser("/theorie");
  const fiches = await getTheoryFiches();
  return (
    <main className="learning-page">
      <header className="learning-page-head">
        <h1>Théorie</h1>
        <p className="dash-greeting voice">La méthode avant le patient.</p>
        <p>Les trames à connaître par cœur pour mener un entretien complet, quel que soit le motif.</p>
      </header>
      <div className="learning-tile-grid">
        {fiches.map((fiche) => (
          <Link className="learning-tile" href={`/theorie/${fiche.slug}`} key={fiche.slug}>
            <BookOpenText aria-hidden="true" size={20} />
            <h3>{fiche.title}</h3>
            <p>{fiche.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
