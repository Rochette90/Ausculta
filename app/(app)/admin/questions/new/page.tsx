import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminQuestionForm } from "../../../../../components/admin/AdminQuestionForm";
import { AdminSectionNav } from "../../../../../components/admin/AdminSectionNav";
import { getAdminQuestionFormOptions } from "../../../../../lib/admin/questions";
import { pageTitle } from "@/lib/brand";
import { requireAdminUser } from "../../../../../lib/auth/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Nouvelle question") };

export default async function NewAdminQuestionPage() {
  // La garde précède toute lecture : un compte non-admin n'exécute
  // aucune requête et son payload ne contient aucune donnée d'administration.
  await requireAdminUser("/admin/questions/new");
  const metadata = await getAdminQuestionFormOptions();
  return <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8"><AdminSectionNav /><Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/admin/questions"><ArrowLeft size={17} /> Toutes les questions</Link><header className="mb-6"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Banque pédagogique</p><h1 className="m-0 !text-4xl">Créer un QCM</h1><p className="mb-0 mt-3 text-slate-600">La publication exige une explication, une source et le statut approuvé.</p></header><AdminQuestionForm metadata={metadata} /></main>;
}
