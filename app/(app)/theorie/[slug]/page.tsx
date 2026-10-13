import { ArrowLeft, BookOpenText, Clock3, FileWarning, Layers, Quote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FicheAnchor } from "@/components/content/FicheAnchor";
import { FicheReader, type TocGroup } from "@/components/content/FicheReader";
import { FicheSectionCard } from "@/components/content/FicheSectionCard";
import { MarkdownBlocks, parseMarkdown } from "@/app/markdown";
import { requireUser } from "@/lib/auth/require-user";
import { pageTitle } from "@/lib/brand";
import { buildFicheDocument } from "@/lib/content/fiche-document";
import { getTheoryFiche } from "@/lib/theory/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const fiche = await getTheoryFiche((await params).slug);
  return fiche
    ? { title: pageTitle(fiche.title), description: fiche.summary }
    : { title: pageTitle("Fiche introuvable") };
}

export default async function TheoryFichePage({ params }: PageProps) {
  const { slug } = await params;
  await requireUser(`/theorie/${slug}`);
  const fiche = await getTheoryFiche(slug);
  if (!fiche) notFound();

  // Une trame se lit dans l'ordre où elle se mène : pas de squelette de pathologie.
  const document = buildFicheDocument(parseMarkdown(fiche.content), { keepOrder: true });

  const toc: TocGroup[] = [
    {
      key: "synthese",
      label: "Trame de l’entretien",
      entries: document.sections.map((section) => ({ id: section.id, title: section.title, subsections: section.subsections })),
    },
    ...(document.appendix.length > 0
      ? [{
          key: "annexes",
          label: "Annexes",
          entries: document.appendix.map((section) => ({ id: section.id, title: section.title, subsections: [] })),
        }]
      : []),
  ];

  return (
    <main className="fiche page-enter">
      <Link className="fiche-back" href="/theorie">
        <ArrowLeft size={16} /> Toute la théorie
      </Link>

      <header className="fiche-head">
        <div className="fiche-chips">
          <span className="fiche-chip is-specialty">Théorie</span>
          <span className="fiche-chip is-draft">À réviser</span>
        </div>
        <h1>{fiche.title}</h1>
        <p className="fiche-lead">{fiche.summary}</p>
        <div className="fiche-meta">
          <span><Clock3 size={14} /> {document.minutes} min de lecture</span>
          <span><Layers size={14} /> {document.sections.length} sections</span>
          <span className="is-draft"><FileWarning size={14} /> En attente de validation médicale signée</span>
        </div>
      </header>

      <FicheReader
        collapsibleIds={document.sections.map((section) => section.id)}
        groups={toc}
        meta={`${document.minutes} min · ${document.sections.length} sections`}
      >
        {document.preamble.length > 0 && (
          <div className="fiche-document fiche-preamble">
            <MarkdownBlocks blocks={document.preamble} />
          </div>
        )}

        {document.sections.map((section, index) => (
          <FicheSectionCard
            group="synthese"
            icon={<BookOpenText size={17} />}
            id={section.id}
            index={index + 1}
            key={section.id}
            title={section.title}
          >
            <div className="fiche-document">
              <MarkdownBlocks blocks={section.blocks} />
            </div>
          </FicheSectionCard>
        ))}

        {document.appendix.length > 0 && (
          <div className="fiche-appendix">
            {document.appendix.map((section) => (
              <FicheAnchor id={section.id} key={section.id}>
                <h2><Quote size={15} /> {section.title}</h2>
                <div className="fiche-document">
                  <MarkdownBlocks blocks={section.blocks} />
                </div>
              </FicheAnchor>
            ))}
          </div>
        )}
      </FicheReader>
    </main>
  );
}
