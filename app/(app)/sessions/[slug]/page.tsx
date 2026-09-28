import type { Metadata } from "next";
import { pageTitle } from "@/lib/brand";
import { notFound } from "next/navigation";
import { StudySessionPlayer } from "@/components/study-sessions/StudySessionPlayer";
import { getCurrentUser, requireUser } from "@/lib/auth/require-user";
import { getStudySession } from "@/lib/study-sessions/catalog";
import { studySessionMastery, studySessionTitle } from "@/lib/study-sessions/mastery";
import { getStudySessionProgress } from "@/lib/study-sessions/progress";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const session = getStudySession((await params).slug);
  if (!session) return { title: pageTitle("Séance introuvable") };
  const user = await getCurrentUser();
  const progress = user ? await getStudySessionProgress(user.id, session.slug) : [];
  const mastery = studySessionMastery(progress.length, session.steps.length);
  return { title: pageTitle(studySessionTitle(session.subject, mastery)) };
}

export default async function StudySessionPage({ params }: PageProps) {
  const { slug } = await params;
  const session = getStudySession(slug);
  if (!session) notFound();
  const user = await requireUser(`/sessions/${encodeURIComponent(slug)}`);
  const progress = await getStudySessionProgress(user.id, slug);
  return <StudySessionPlayer initialCompletedStepIds={progress.map((item) => item.stepId)} session={session} />;
}
