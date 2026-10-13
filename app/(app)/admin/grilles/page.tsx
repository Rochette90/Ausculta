import { AdminSectionNav } from "@/components/admin/AdminSectionNav";
import { AdminTrainingList } from "@/components/admin/AdminTrainingList";
import { NewTrainingForm } from "@/components/admin/NewTrainingForm";
import { getAdminPracticeGrids } from "@/lib/admin/training-content";
import { requireAdminUser } from "@/lib/auth/admin";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Administration · Grilles") };

export default async function Page() {
  // La garde précède toute lecture, comme pour les autres pages d'administration.
  await requireAdminUser("/admin/grilles");
  const items = await getAdminPracticeGrids();
  const nextPosition = items.reduce((max, item) => Math.max(max, item.position), 0) + 1;
  return (
    <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <AdminSectionNav />
      <header className="rounded-[28px] bg-slate-950 p-7 text-white sm:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Administration</p>
        <h1 className="m-0 !text-4xl !text-white">Grilles ECOS</h1>
        <p className="mb-0 mt-3 text-slate-300">Sections, items, barèmes et cartes des grilles d&apos;entraînement en binôme.</p>
      </header>
      <section className="mt-7">
        <h2 className="m-0 !text-2xl">Nouvelle grille</h2>
        <NewTrainingForm kind="grid" nextPosition={nextPosition} />
      </section>
      <section className="mt-9">
        <h2 className="m-0 !text-2xl">Catalogue</h2>
        <p className="m-0 text-sm text-slate-500">{items.length} au total · triées par position</p>
        <AdminTrainingList basePath="/admin/grilles" empty="Aucune grille pour l'instant." items={items} />
      </section>
    </main>
  );
}
