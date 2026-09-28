import { FilePenLine, FilePlus2, MessageSquareWarning } from "lucide-react";
import Link from "next/link";
import { AdminPathologyList } from "../../../../components/admin/AdminPathologyList";
import { AdminSectionNav } from "../../../../components/admin/AdminSectionNav";
import { buttonVariants } from "../../../../components/ui/button";
import { getAdminPathologies, getAdminPathologyReports } from "../../../../lib/admin/queries";
import { BRAND_NAME, pageTitle } from "@/lib/brand";
import { requireAdminUser } from "../../../../lib/auth/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Administration des fiches") };

export default async function AdminPathologiesPage() {
  // La garde précède toute lecture : un compte non-admin n'exécute
  // aucune requête et son payload ne contient aucune donnée d'administration.
  await requireAdminUser("/admin/pathologies");
  const [pathologies, reports] = await Promise.all([getAdminPathologies(), getAdminPathologyReports()]);
  const openReports = reports.filter((report) => report.status === "open" || report.status === "reviewing").length;
  return <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8"><AdminSectionNav /><header className="rounded-[28px] bg-slate-950 p-7 text-white sm:p-10"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Administration médicale</p><div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="m-0 !text-4xl !text-white">Gérer les fiches</h1><p className="mb-0 mt-3 text-slate-300">Crée, modifie, prévisualise et publie le contenu médical sans quitter {BRAND_NAME}.</p></div><div className="flex flex-wrap gap-2"><Link className={buttonVariants()} href="/admin/pathologies/new"><FilePlus2 size={17} /> Nouvelle fiche</Link><Link className={buttonVariants({ variant: "outline" })} href="/admin/reports"><MessageSquareWarning size={17} /> {openReports} signalement{openReports > 1 ? "s" : ""}</Link></div></div></header><section className="mt-7"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><FilePenLine size={19} /></span><div><h2 className="m-0 !text-2xl">Catalogue</h2><p className="m-0 text-sm text-slate-500">{pathologies.length} fiches au total</p></div></div><AdminPathologyList pathologies={pathologies} /></section></main>;
}
