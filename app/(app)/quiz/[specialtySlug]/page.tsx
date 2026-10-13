import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpecialtyQuizSession } from "@/components/quiz/SpecialtyQuizSession";
import { requireUser } from "@/lib/auth/require-user";
import { getSpecialtyQuiz } from "@/lib/quiz/specialty";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ specialtySlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { specialtySlug } = await params;
  return { title: pageTitle(`Quiz ${specialtySlug.replaceAll("-", " ")}`) };
}

export default async function SpecialtyQuizPage({ params }: PageProps) {
  const { specialtySlug } = await params;
  const user = await requireUser(`/quiz/${specialtySlug}`);
  const quiz = await getSpecialtyQuiz(user.id, specialtySlug);
  if (!quiz) notFound();
  return <SpecialtyQuizSession quiz={quiz} />;
}
