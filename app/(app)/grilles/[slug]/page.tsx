import { ArrowLeft, BookOpenText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GridTrainer } from "@/components/grids/GridTrainer";
import { requireUser } from "@/lib/auth/require-user";
import { pageTitle } from "@/lib/brand";
import { FEATURES } from "@/lib/features";
import { getPracticeGrid } from "@/lib/grids/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const grid = await getPracticeGrid((await params).slug);
  return { title: pageTitle(grid ? `Grille ${grid.title}` : "Grille introuvable") };
}

export default async function GridPage({ params }: PageProps) {
  const { slug } = await params;
  await requireUser(`/grilles/${slug}`);
  const grid = await getPracticeGrid(slug);
  if (!grid) notFound();

  return (
    <main className="learning-page">
      <Link className="learning-back" href="/grilles"><ArrowLeft aria-hidden="true" size={16} /> Toutes les grilles</Link>
      <header className="learning-page-head grid-page-head">
        <div>
          <h1>{grid.title}</h1>
          <p>{grid.themes}</p>
        </div>
        {FEATURES.theorie && (
          <Link className="text-link grid-theory-link" href="/theorie/anamnese-classique">
            <BookOpenText aria-hidden="true" size={16} /> Revoir la trame d&apos;anamnèse
          </Link>
        )}
      </header>
      <GridTrainer grid={grid} />
    </main>
  );
}
