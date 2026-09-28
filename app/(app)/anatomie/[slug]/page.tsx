import { notFound } from "next/navigation";
import { AnatomyLesson } from "@/components/anatomy/AnatomyLesson";
import { getAnatomyModule } from "@/lib/anatomy/catalog";
import { publicAnatomyModule } from "@/lib/anatomy/assessment";
import { getAnatomyProgress } from "@/lib/anatomy/progress";
import { getSpecialtyCatalog } from "@/lib/content/queries";
import { requireUser } from "@/lib/auth/require-user";
import { pageTitle } from "@/lib/brand";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ mode?: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: pageTitle(getAnatomyModule(slug)?.title ?? "Module introuvable") };
}
export default async function AnatomyModulePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const lesson = getAnatomyModule(slug);
  if (!lesson) notFound();
  const user = await requireUser(`/anatomie/${slug}`);
  const [progress, catalog, search] = await Promise.all([getAnatomyProgress(user.id), getSpecialtyCatalog(), searchParams]);
  const related = catalog.flatMap((specialty) => specialty.pathologies).filter((pathology) => lesson.pathologySlugs.includes(pathology.slug)).map(({ slug, title }) => ({ slug, title }));
  return <AnatomyLesson key={slug} module={publicAnatomyModule(lesson)} related={related} attempts={progress.attempts.filter((attempt) => attempt.module_slug === slug)} initialMode={search.mode === "clinical" ? "clinical" : "learn"} />;
}
