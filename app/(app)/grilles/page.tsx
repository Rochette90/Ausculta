import { ListChecks } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { pageTitle } from "@/lib/brand";
import { getPracticeGrids } from "@/lib/grids/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Grilles d'entraînement") };

export default async function GridsPage() {
  await requireUser("/grilles");
  const grids = await getPracticeGrids();
  return (
    <main className="learning-page">
      <header className="learning-page-head">
        <h1>Grilles d&apos;entraînement</h1>
        <p className="dash-greeting voice">À trois, comme le jour J.</p>
        <p>Les huit stations de l&apos;ECOS de 3<sup>e</sup> année de l&apos;UNIL. Un patient, un candidat, un évaluateur : la grille donne le chrono de 13 minutes, la liste à cocher et le score de la station.</p>
      </header>
      <div className="learning-tile-grid">
        {grids.map((grid) => (
          <Link className="learning-tile" href={`/grilles/${grid.slug}`} key={grid.slug}>
            <ListChecks aria-hidden="true" size={20} />
            <h3>{grid.title}</h3>
            <p>{grid.themes}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
