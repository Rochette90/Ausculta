import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ClipboardPlus,
  FlaskConical,
  HeartPulse,
  Microscope,
  Flag,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkAsReadButton } from "../../../../components/content/MarkAsReadButton";
import { ReportableText } from "../../../../components/content/ReportableText";
import { requireUser } from "../../../../lib/auth/require-user";
import { MarkdownBlocks, parseMarkdown } from "../../../markdown";
import { getPathologyBySlug } from "../../../../lib/content/queries";
import { createClient } from "../../../../lib/supabase/server";
import type { PathologySectionKey } from "../../../../types/medtrain";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

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

  const sections: Array<{ key: PathologySectionKey; title: string; content: string; icon: typeof Activity }> = [
    { key: "pathophysiology", title: "Physiopathologie", content: pathology.pathophysiology ?? "", icon: Activity },
    { key: "symptoms", title: "Signes et symptômes", content: pathology.symptoms ?? "", icon: Stethoscope },
    { key: "risk_factors", title: "Facteurs de risque", content: pathology.risk_factors ?? "", icon: ShieldAlert },
    { key: "complementary_exams", title: "Examens complémentaires", content: pathology.complementary_exams ?? "", icon: FlaskConical },
    { key: "differential_diagnosis", title: "Diagnostics différentiels", content: pathology.differential_diagnosis ?? "", icon: Microscope },
    { key: "treatments", title: "Traitements", content: pathology.treatments ?? "", icon: ClipboardPlus },
    { key: "complications", title: "Complications", content: pathology.complications ?? "", icon: AlertTriangle },
    { key: "monitoring", title: "Surveillance", content: pathology.monitoring ?? "", icon: HeartPulse },
  ].filter((section): section is { key: PathologySectionKey; title: string; content: string; icon: typeof Activity } => Boolean(section.content));
  const useMarkdownFallback = sections.length < 2 && pathology.content;

  return (
    <main className="page-enter mx-auto w-full max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/specialties">
        <ArrowLeft size={17} /> Toutes les spécialités
      </Link>

      <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
          <span className="rounded-full bg-teal-50 px-3 py-1.5 text-teal-800">{pathology.specialty?.name ?? "Médecine"}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">Niveau {pathology.difficulty}</span>
          {pathology.criticality === "urgent" && <span className="rounded-full bg-rose-100 px-3 py-1.5 text-rose-800">Urgence</span>}
        </div>
        <h1 className="mb-4 mt-5 text-[clamp(2.25rem,6vw,4.5rem)]">{pathology.title}</h1>
        <ReportableText className="m-0 max-w-3xl text-lg leading-8 text-slate-600" pathologyId={pathology.id} sectionKey="definition" text={pathology.definition ?? pathology.summary ?? ""} />
        <div className="mt-7 border-t border-slate-100 pt-6"><MarkAsReadButton initiallyCompleted={progress?.is_completed === true} pathologyId={pathology.id} /></div>
      </header>

      {sections.length > 0 && (
        <>
          <p className="mx-2 mb-0 mt-6 flex items-center gap-2 text-sm text-slate-500"><Flag aria-hidden="true" size={15} /> Sélectionnez un passage pour signaler une erreur à l’équipe.</p>
          <section className="mt-4 grid gap-4 md:grid-cols-2" aria-label="Contenu de la fiche">
          {sections.map(({ key, title, content, icon: Icon }) => (
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" key={title}>
              <span className="mb-4 grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon aria-hidden="true" size={20} /></span>
              <h2 className="mb-3 mt-0 text-xl">{title}</h2>
              <ReportableText pathologyId={pathology.id} sectionKey={key} text={content} />
            </article>
          ))}
          </section>
        </>
      )}

      {useMarkdownFallback && (
        <article className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:border-t [&_h2]:border-slate-100 [&_h2]:pt-8 [&_h3]:mt-7 [&_li]:my-2 [&_ol]:pl-6 [&_p]:leading-7 [&_p]:text-slate-600 [&_table]:w-full [&_td]:border-b [&_td]:border-slate-100 [&_td]:p-3 [&_th]:bg-slate-50 [&_th]:p-3 [&_ul]:pl-6">
          <MarkdownBlocks blocks={parseMarkdown(pathology.content ?? "")} />
        </article>
      )}
    </main>
  );
}
