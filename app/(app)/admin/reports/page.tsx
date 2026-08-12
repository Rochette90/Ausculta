import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminReports } from "../../../../components/admin/AdminReports";
import { getAdminPathologyReports } from "../../../../lib/admin/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Signalements des fiches — MedTrain" };

export default async function AdminReportsPage() {
  const reports = await getAdminPathologyReports();
  return <main className="page-enter mx-auto w-full max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:px-8"><Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/admin/pathologies"><ArrowLeft size={17} /> Administration des fiches</Link><header><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Qualité du contenu</p><h1 className="m-0 !text-4xl">Signalements utilisateurs</h1><p className="mt-3 max-w-2xl text-slate-600">Chaque signalement conserve le passage exact sélectionné, son contexte et le commentaire de l’utilisateur.</p></header><AdminReports reports={reports} /></main>;
}
