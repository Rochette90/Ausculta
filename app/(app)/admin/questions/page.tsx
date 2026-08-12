import { FilePlus2 } from "lucide-react";
import Link from "next/link";
import { AdminQuestionList } from "../../../../components/admin/AdminQuestionList";
import { AdminSectionNav } from "../../../../components/admin/AdminSectionNav";
import { QuestionCsvImport } from "../../../../components/admin/QuestionCsvImport";
import { buttonVariants } from "../../../../components/ui/button";
import { getAdminQuestions } from "../../../../lib/admin/questions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration des QCM — MedTrain" };

export default async function AdminQuestionsPage() {
  const questions = await getAdminQuestions();
  return <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8"><AdminSectionNav /><header className="rounded-[28px] bg-slate-950 p-7 text-white sm:p-10"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Banque pédagogique</p><div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="m-0 !text-4xl !text-white">Gérer les QCM</h1><p className="mb-0 mt-3 text-slate-300">Rédaction, validation médicale, publication et import en volume.</p></div><Link className={buttonVariants()} href="/admin/questions/new"><FilePlus2 size={17} /> Nouvelle question</Link></div></header><QuestionCsvImport /><AdminQuestionList questions={questions} /></main>;
}
