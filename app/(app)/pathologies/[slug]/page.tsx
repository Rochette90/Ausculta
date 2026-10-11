import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BookOpenText,
  ClipboardPlus,
  Clock3,
  Eye,
  FileWarning,
  FlaskConical,
  HeartPulse,
  Layers,
  Link2,
  Microscope,
  Pill,
  Quote,
  RotateCcw,
  Route,
  Siren,
  Sparkles,
  Split,
  Stethoscope,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { STATION_FICHE_SLUGS } from "@/lib/ecos/stations/index";
import { FicheAnchor } from "../../../../components/content/FicheAnchor";
import { FicheReader, type TocGroup } from "../../../../components/content/FicheReader";
import { FicheSectionCard } from "../../../../components/content/FicheSectionCard";
import { MarkAsReadButton } from "../../../../components/content/MarkAsReadButton";
import { ReportableText } from "../../../../components/content/ReportableText";
import catalog from "../../../../content/pathologies/index.json";
import { requireUser } from "../../../../lib/auth/require-user";
import { buildFicheDocument } from "../../../../lib/content/fiche-document";
import { classifyFicheSection, type FicheIconKey } from "../../../../lib/content/fiche-taxonomy";
import { MarkdownBlocks, parseFrontmatter, parseMarkdown } from "../../../markdown";
import { getPathologyBySlug } from "../../../../lib/content/queries";
import { pageTitle } from "@/lib/brand";
import { anatomyModules } from "@/lib/anatomy/catalog";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

/** Les chapitres portent une clé d'icône ; la dépendance à lucide reste ici. */
const chapterIcons: Record<FicheIconKey, LucideIcon> = {
  book: BookOpenText,
  layers: Layers,
  users: Users,
  activity: Activity,
  stethoscope: Stethoscope,
  eye: Eye,
  clipboard: ClipboardPlus,
  flask: FlaskConical,
  split: Split,
  siren: Siren,
  route: Route,
  pill: Pill,
  alert: AlertTriangle,
  heart: HeartPulse,
  link: Link2,
  quote: Quote,
};

function iconForSection(title: string): LucideIcon {
  const chapter = classifyFicheSection(title);
  return chapter ? chapterIcons[chapter.icon] : Microscope;
}

const HIDDEN_TAGS = new Set(["import-vault", "a-reviser", "bachelor-3-lausanne"]);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const readable = FEATURES.fiches || STATION_FICHE_SLUGS.has(slug);
  const pathology = readable ? await getPathologyBySlug(slug) : null;
  return pathology
    ? { title: pageTitle(pathology.title), description: pathology.summary ?? undefined }
    : { title: pageTitle("Fiche introuvable") };
}

export default async function PathologyPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await requireUser(`/pathologies/${slug}`);
  const pathology = await getPathologyBySlug(slug);
  if (!pathology) notFound();
  // Catalogue masqué : seules les fiches citées par un débriefing restent lisibles.
  if (!FEATURES.fiches && !STATION_FICHE_SLUGS.has(slug)) notFound();

  const supabase = await createClient();
  const { data: progress } = await supabase
    .from("user_progress")
    .select("is_completed")
    .eq("user_id", user.id)
    .eq("pathology_id", pathology.id)
    .maybeSingle();

  const richContent = pathology.content?.trim() ?? "";
  const frontmatter = parseFrontmatter(richContent);
  const document = buildFicheDocument(richContent ? parseMarkdown(richContent) : []);
  const keyPoints = catalog.find((entry) => entry.slug === slug)?.keyPoints ?? [];
  const tags = frontmatter.tags.filter((tag) => !HIDDEN_TAGS.has(tag));

  const isReviewed = Boolean(pathology.review_status === "reviewed" && pathology.reviewer_name && pathology.reviewed_at);
  const isUrgent = pathology.criticality === "urgent";
  const hasBody = document.sections.length > 0 || document.appendix.length > 0 || document.preamble.length > 0;

  // Numérotation continue : le même « 07 » dans le sommaire et dans le fil.
  const numbers = new Map(document.sections.map((section, index) => [section.id, index + 1]));

  const toc: TocGroup[] = [
    ...document.groups.map((group) => ({
      key: group.key,
      label: group.label,
      entries: group.sections.map((section) => ({
        id: section.id,
        title: section.title,
        subsections: section.subsections,
      })),
    })),
    ...(document.appendix.length > 0
      ? [{
          key: "annexes",
          label: "Annexes",
          entries: document.appendix.map((section) => ({ id: section.id, title: section.title, subsections: [] })),
        }]
      : []),
  ];

  // Bandeau « urgence » : renvoie vers la première section de prise en charge,
  // le réflexe attendu quand la fiche s'ouvre en garde.
  const urgentTarget = document.groups.find((group) => group.key === "traitement")?.sections[0];

  return (
    <main className="fiche page-enter">
      <Link className="fiche-back" href={FEATURES.fiches ? "/specialties" : "/cas"}>
        <ArrowLeft size={16} /> {FEATURES.fiches ? "Toutes les spécialités" : "Retour aux stations"}
      </Link>

      <header className={`fiche-head${isUrgent ? " is-urgent" : ""}`}>
        <div className="fiche-chips">
          <span className="fiche-chip is-specialty">{pathology.specialty?.name ?? "Médecine"}</span>
          <span className="fiche-chip">{({ easy: "Fondamental", facile: "Fondamental", medium: "Intermédiaire", moyen: "Intermédiaire", hard: "Avancé", difficile: "Avancé" })[pathology.difficulty]}</span>
          {isUrgent && <span className="fiche-chip is-urgent"><Siren size={13} /> Urgence</span>}
          <span className={`fiche-chip ${isReviewed ? "is-reviewed" : "is-draft"}`}>
            {isReviewed ? <BadgeCheck size={13} /> : <RotateCcw size={13} />}
            {isReviewed ? "Fiche révisée" : "À réviser"}
          </span>
        </div>

        <h1>{pathology.title}</h1>

        {frontmatter.synonymes.length > 0 && (
          <p className="fiche-synonyms">
            <span>Aussi appelé</span> {frontmatter.synonymes.join(" · ")}
          </p>
        )}

        <ReportableText
          className="fiche-lead"
          pathologyId={pathology.id}
          sectionKey="definition"
          text={pathology.summary ?? ""}
        />

        <div className="fiche-meta">
          <span><Clock3 size={14} /> {document.minutes} min de lecture</span>
          {document.sections.length > 0 && <span><Layers size={14} /> {document.sections.length} sections</span>}
          {isReviewed ? (
            <span className="is-reviewed">
              <BadgeCheck size={14} /> Validée et signée par {pathology.reviewer_name} le{" "}
              {new Date(pathology.reviewed_at!).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" })}
            </span>
          ) : (
            <span className="is-draft"><FileWarning size={14} /> En attente de validation médicale signée</span>
          )}
        </div>

        <div className="fiche-actions">
          <MarkAsReadButton initiallyCompleted={progress?.is_completed === true} pathologyId={pathology.id} />
        </div>

        {tags.length > 0 && (
          <ul className="fiche-tags">
            {tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        )}
      </header>

      {FEATURES.anatomy && anatomyModules.some((module) => module.pathologySlugs.includes(slug)) && <section className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><p className="learning-eyebrow">LES BASES ANATOMIQUES DE CETTE FICHE</p><div className="learning-related">{anatomyModules.filter((module) => module.pathologySlugs.includes(slug)).map((module) => <Link href={`/anatomie/${module.slug}`} key={module.slug}><Layers size={16} />{module.title}<Link2 size={14} /></Link>)}</div></section>}

      {isUrgent && urgentTarget && (
        <a className="fiche-alert" href={`#${urgentTarget.id}`}>
          <Siren size={17} />
          <span>
            <strong>Situation urgente</strong>
            Aller directement à « {urgentTarget.title} » pour la conduite à tenir.
          </span>
        </a>
      )}

      {keyPoints.length > 0 && (
        <section aria-labelledby="fiche-essentiel" className="fiche-essentials">
          <p id="fiche-essentiel"><Sparkles size={16} /> L’essentiel</p>
          <ol>
            {keyPoints.map((point) => <li key={point}><MarkdownBlocks blocks={parseMarkdown(point)} /></li>)}
          </ol>
        </section>
      )}

      {hasBody ? (
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

          {document.groups.map((group, groupIndex) => (
            <section aria-labelledby={`phase-${group.key}`} className="fiche-part" data-group={group.key} key={group.key}>
              <header className="fiche-part-head">
                <span className="fiche-part-index">{String(groupIndex + 1).padStart(2, "0")}</span>
                <div>
                  <h2 id={`phase-${group.key}`}>{group.label}</h2>
                  <small>{group.hint}</small>
                </div>
                <span className="fiche-part-count">
                  {group.sections.length} {group.sections.length > 1 ? "sections" : "section"}
                </span>
              </header>

              {group.sections.map((section) => {
                const Icon = section.chapter ? chapterIcons[section.chapter.icon] : Microscope;
                return (
                  <FicheSectionCard
                    chapterLabel={section.chapter?.label}
                    group={group.key}
                    icon={<Icon size={17} />}
                    id={section.id}
                    index={numbers.get(section.id) ?? 1}
                    key={section.id}
                    title={section.title}
                  >
                    <div className="fiche-document">
                      <MarkdownBlocks blocks={section.blocks} />
                    </div>
                  </FicheSectionCard>
                );
              })}
            </section>
          ))}

          {document.appendix.length > 0 && (
            <div className="fiche-appendix">
              {document.appendix.map((section) => {
                const Icon = iconForSection(section.title);
                return (
                  <FicheAnchor id={section.id} key={section.id}>
                    <h2><Icon size={15} /> {section.title}</h2>
                    <div className="fiche-document">
                      <MarkdownBlocks blocks={section.blocks} />
                    </div>
                  </FicheAnchor>
                );
              })}
            </div>
          )}
        </FicheReader>
      ) : (
        <p className="fiche-empty">
          <FileWarning size={18} />
          Le contenu détaillé de cette fiche n’a pas encore été rédigé. Le résumé ci-dessus reste
          disponible et la fiche sera complétée lors de sa révision éditoriale.
        </p>
      )}
    </main>
  );
}
