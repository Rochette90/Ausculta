import { ArrowLeft, FilePlus2 } from "lucide-react";
import Link from "next/link";
import { NewPathologyForm } from "../../../../../components/admin/NewPathologyForm";
import { getAdminSpecialties } from "../../../../../lib/admin/queries";
import { pageTitle } from "@/lib/brand";
import { requireAdminUser } from "../../../../../lib/auth/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Nouvelle fiche") };

export default async function NewAdminPathologyPage() {
  // La garde précède toute lecture : un compte non-admin n'exécute
  // aucune requête et son payload ne contient aucune donnée d'administration.
  await requireAdminUser("/admin/pathologies/new");
  const specialties = await getAdminSpecialties();
  return (
    <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/admin/pathologies"><ArrowLeft size={17} /> Toutes les fiches</Link>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Administration médicale</p><h1 className="m-0 !text-4xl">Créer une fiche</h1><p className="mb-0 mt-3 text-slate-600">Choisis sa spécialité, rédige son contenu et garde-la en brouillon jusqu’à validation.</p></div>
        <span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><FilePlus2 size={22} /></span>
      </header>
      {specialties.length === 0 ? <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-800">Crée d’abord une spécialité avant d’ajouter une fiche.</p> : <NewPathologyForm specialties={specialties} />}
    </main>
  );
}
