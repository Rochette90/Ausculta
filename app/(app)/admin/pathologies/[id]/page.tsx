import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PathologyEditor } from "../../../../../components/admin/PathologyEditor";
import { getAdminPathology } from "../../../../../lib/admin/queries";
import { requireAdminUser } from "../../../../../lib/auth/admin";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }> };

export default async function AdminPathologyPage({ params }: PageProps) {
  // La garde précède toute lecture : un compte non-admin n'exécute
  // aucune requête et son payload ne contient aucune donnée d'administration.
  await requireAdminUser("/admin/pathologies");
  const pathology = await getAdminPathology((await params).id);
  if (!pathology) notFound();
  return <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8"><Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/admin/pathologies"><ArrowLeft size={17} /> Toutes les fiches</Link><header className="mb-6"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{pathology.specialtyName}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Version {pathology.version}</span></div><h1 className="mb-1 mt-4 !text-4xl">{pathology.title}</h1><p className="m-0 text-sm text-slate-500">Dernière modification : {new Date(pathology.updatedAt).toLocaleString("fr-CH")}</p></header><PathologyEditor pathology={pathology} /></main>;
}
