import { ArrowLeft, FilePlus2 } from "lucide-react";
import Link from "next/link";
import { NewPathologyForm } from "../../../../../components/admin/NewPathologyForm";
import { getAdminSpecialties } from "../../../../../lib/admin/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nouvelle fiche — MedTrain" };

export default async function NewAdminPathologyPage() {
  const specialties = await getAdminSpecialties();
  return (
    <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/admin/pathologies"><ArrowLeft size={17} /> Toutes les fiches</Link>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Administration médicale</p><h1 className="m-0 !text-4xl">Créer une fiche</h1><p className="mb-0 mt-3 text-slate-600">Choisissez sa spécialité, rédigez son contenu et gardez-la en brouillon jusqu’à validation.</p></div>
        <span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><FilePlus2 size={22} /></span>
      </header>
      {specialties.length === 0 ? <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-800">Créez d’abord une spécialité avant d’ajouter une fiche.</p> : <NewPathologyForm specialties={specialties} />}
    </main>
  );
}
