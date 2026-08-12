import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminQuestionForm } from "../../../../../components/admin/AdminQuestionForm";
import { AdminSectionNav } from "../../../../../components/admin/AdminSectionNav";
import { getAdminQuestion, getAdminQuestionFormOptions } from "../../../../../lib/admin/questions";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }> };

export default async function AdminQuestionPage({ params }: PageProps) {
  const id = (await params).id;
  const [question, metadata] = await Promise.all([getAdminQuestion(id), getAdminQuestionFormOptions()]);
  if (!question) notFound();
  return <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8"><AdminSectionNav /><Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/admin/questions"><ArrowLeft size={17} /> Toutes les questions</Link><header className="mb-6"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">Version {question.version}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{question.reviewStatus}</span></div><h1 className="mb-1 mt-4 !text-4xl">Modifier le QCM</h1><p className="m-0 line-clamp-2 text-slate-600">{question.text}</p></header><AdminQuestionForm metadata={metadata} question={question} /></main>;
}
