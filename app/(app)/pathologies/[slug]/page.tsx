import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BookOpenText,
  ClipboardPlus,
  FlaskConical,
  HeartPulse,
  ListTree,
  Microscope,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkAsReadButton } from "../../../../components/content/MarkAsReadButton";
import { ReportableText } from "../../../../components/content/ReportableText";
import { requireUser } from "../../../../lib/auth/require-user";
import { MarkdownBlocks, parseMarkdown, type Block } from "../../../markdown";
import { getPathologyBySlug } from "../../../../lib/content/queries";
import { createClient } from "../../../../lib/supabase/server";
import type { PathologySectionKey } from "../../../../types/medtrain";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };
type DocumentSection = { heading: Extract<Block, { kind: "h2" }>; blocks: Block[] };

const sectionIcons: Array<[RegExp, LucideIcon]> = [
  [/définition|épidémiologie/i, BookOpenText],
  [/physiopathologie/i, Activity],
  [/symptôme|signe|examen clinique/i, Stethoscope],
  [/facteur|risque/i, ShieldAlert],
  [/examen complémentaire|imagerie|diagnostic/i, FlaskConical],
  [/prise en charge|traitement/i, ClipboardPlus],
  [/complication|pronostic|urgence/i, AlertTriangle],
  [/surveillance|suivi/i, HeartPulse],
];

function iconForSection(title: string) {
  return sectionIcons.find(([pattern]) => pattern.test(title))?.[1] ?? Microscope;
}

function splitDocument(blocks: Block[]) {
  const preamble: Block[] = [];
  const sections: DocumentSection[] = [];
  let current: DocumentSection | null = null;
  for (const block of blocks) {
    if (block.kind === "h2") {
      current = { heading: block, blocks: [] };
      sections.push(current);
    } else if (current) current.blocks.push(block);
    else preamble.push(block);
  }
  return { preamble, sections };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pathology = await getPathologyBySlug(slug);
  return pathology
    ? { title: `${pathology.title} — MedTrain`, description: pathology.definition ?? pathology.summary }
    : { title: "Fiche introuvable — MedTrain" };
}

export default async function PathologyPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await requireUser(`/pathologies/${slug}`);
  const pathology = await getPathologyBySlug(slug);
  if (!pathology) notFound();
  const supabase = await createClient();
  const { data: progress } = await supabase
    .from("user_progress")
    .select("is_completed")
    .eq("user_id", user.id)
    .eq("pathology_id", pathology.id)
    .maybeSingle();

  const legacySections = ([
    { key: "pathophysiology", title: "Physiopathologie", content: pathology.pathophysiology ?? "", icon: Activity },
    { key: "symptoms", title: "Signes et symptômes", content: pathology.symptoms ?? "", icon: Stethoscope },
    { key: "risk_factors", title: "Facteurs de risque", content: pathology.risk_factors ?? "", icon: ShieldAlert },
    { key: "complementary_exams", title: "Examens complémentaires", content: pathology.complementary_exams ?? "", icon: FlaskConical },
    { key: "differential_diagnosis", title: "Diagnostics différentiels", content: pathology.differential_diagnosis ?? "", icon: Microscope },
    { key: "treatments", title: "Traitements", content: pathology.treatments ?? "", icon: ClipboardPlus },
    { key: "complications", title: "Complications", content: pathology.complications ?? "", icon: AlertTriangle },
    { key: "monitoring", title: "Surveillance", content: pathology.monitoring ?? "", icon: HeartPulse },
  ] satisfies Array<{ key: PathologySectionKey; title: string; content: string; icon: LucideIcon }>).filter((section) => Boolean(section.content));
  const richContent = pathology.content?.trim() ?? "";
  const contentBlocks = richContent ? parseMarkdown(richContent) : [];
  const { preamble, sections } = splitDocument(contentBlocks);
  const isReviewed = pathology.review_status === "reviewed" && pathology.reviewer_name && pathology.reviewed_at;
  const summary = pathology.definition ?? pathology.summary ?? "";

  return (
    <main className="pathology-page page-enter mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/specialties">
        <ArrowLeft size={17} /> Toutes les spécialités
      </Link>

      <header className="pathology-hero">
        <div className="pathology-hero-main">
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em]">
            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-teal-800">{pathology.specialty?.name ?? "Médecine"}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">Niveau {pathology.difficulty}</span>
            {pathology.criticality === "urgent" && <span className="rounded-full bg-rose-100 px-3 py-1.5 text-rose-800">Urgence</span>}
          </div>
          <h1>{pathology.title}</h1>
          <ReportableText className="pathology-lead" pathologyId={pathology.id} sectionKey="definition" text={summary} />
          <div className="mt-7"><MarkAsReadButton initiallyCompleted={progress?.is_completed === true} pathologyId={pathology.id} /></div>
        </div>

        <aside className={`pathology-review-card ${isReviewed ? "is-reviewed" : "needs-review"}`} aria-label="État de révision">
          <span className="pathology-review-icon">{isReviewed ? <BadgeCheck size={25} /> : <RotateCcw size={23} />}</span>
          <div>
            <p>{isReviewed ? "Fiche révisée" : "À réviser"}</p>
            {isReviewed ? (
              <span>Validée et signée par <strong>{pathology.reviewer_name}</strong><br />le {new Date(pathology.reviewed_at!).toLocaleDateString("fr-CH")}</span>
            ) : (
              <span>Cette fiche reste accessible, mais son contenu attend encore une validation médicale signée.</span>
            )}
          </div>
        </aside>
      </header>

      {sections.length > 0 && (
        <details className="pathology-mobile-toc lg:hidden">
          <summary><ListTree size={17} /> Sommaire de la fiche</summary>
          <nav>{sections.map(({ heading }, index) => <a href={`#${heading.id}`} key={`${heading.id}-mobile`}><span>{String(index + 1).padStart(2, "0")}</span>{heading.text}</a>)}</nav>
        </details>
      )}

      {richContent && (
        <div className="pathology-layout">
          <aside className="pathology-toc" aria-label="Sommaire de la fiche">
            <p><ListTree size={17} /> Sommaire</p>
            <nav>
              {sections.map(({ heading }, index) => <a href={`#${heading.id}`} key={heading.id}><span>{String(index + 1).padStart(2, "0")}</span>{heading.text}</a>)}
            </nav>
            <small>{sections.length} section{sections.length > 1 ? "s" : ""} · lecture structurée</small>
          </aside>

          <div className="min-w-0">
            {preamble.length > 0 && <article className="pathology-document pathology-preamble"><MarkdownBlocks blocks={preamble} /></article>}
            <div className="pathology-sections">
              {sections.map(({ heading, blocks }, index) => {
                const Icon = iconForSection(heading.text);
                return (
                  <section className="pathology-document pathology-section" key={heading.id}>
                    <header>
                      <span><Icon size={20} /></span>
                      <div><small>Section {String(index + 1).padStart(2, "0")}</small><h2 id={heading.id}>{heading.text}</h2></div>
                    </header>
                    <div className="pathology-section-body"><MarkdownBlocks blocks={blocks} /></div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!richContent && legacySections.length > 0 && (
        <section className="pathology-sections mx-auto mt-7 max-w-4xl" aria-label="Contenu de la fiche">
          {legacySections.map(({ key, title, content, icon: Icon }, index) => (
            <article className="pathology-document pathology-section" key={title}>
              <header><span><Icon size={20} /></span><div><small>Section {String(index + 1).padStart(2, "0")}</small><h2>{title}</h2></div></header>
              <div className="pathology-section-body"><ReportableText pathologyId={pathology.id} sectionKey={key} text={content} /></div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
