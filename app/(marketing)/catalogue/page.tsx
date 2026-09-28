import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck, LibraryBig, Search, Stethoscope } from "lucide-react";
import Link from "next/link";
import { CatalogueExplorer } from "@/components/marketing/CatalogueExplorer";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getPublicCatalog } from "@/lib/marketing/catalog";
import { b3Modules, type B3ModuleId } from "@/lib/curriculum/b3";
import { BRAND_NAME, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Catalogue médical"),
  description: `Explorez les cinq modules du Bachelor 3 de Lausanne, 15 spécialités et 156 fiches médicales sur ${BRAND_NAME}.`,
};
export const dynamic = "force-dynamic";

export default async function CataloguePage({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  const { module: requestedModule } = await searchParams;
  const initialModule = b3Modules.some((module) => module.id === requestedModule) ? requestedModule as B3ModuleId : "all";
  const [user, groups] = await Promise.all([getCurrentUser(), Promise.resolve(getPublicCatalog())]);
  const total = groups.reduce((sum, group) => sum + group.pathologies.length, 0);
  const urgentCount = groups.flatMap((group) => group.pathologies).filter((pathology) => pathology.criticality === "urgent").length;

  return (
    <>
      <main>
        <section className="mx-auto grid w-[calc(100%-2rem)] max-w-[1180px] gap-10 py-20 sm:py-28 lg:grid-cols-[1fr_.82fr] lg:items-center">
          <div><p className="eyebrow">CATALOGUE MÉDICAL</p><h1 className="mb-0 mt-3 text-balance">Tout ce que vous pouvez <span>déjà réviser.</span></h1><p className="mb-0 mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Commencez par votre module B3 de Lausanne, puis affinez par spécialité ou recherchez directement une pathologie.</p><div className="mt-8 flex flex-wrap gap-3"><a className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white no-underline" href="#explorer"><Search aria-hidden="true" size={17} /> Explorer les fiches</a><Link className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-3 font-bold text-[var(--ink)] no-underline hover:border-[var(--primary)]" href="/qualite">Comment sont-elles validées ? <ArrowRight aria-hidden="true" size={16} /></Link></div></div>
          <div className="grid grid-cols-2 gap-3"><article className="col-span-2 rounded-[28px] bg-[var(--surface-dark)] p-7 text-white shadow-[var(--shadow-lg)]"><LibraryBig aria-hidden="true" className="text-teal-300" size={28} /><strong className="mt-8 block font-serif text-5xl">{total}</strong><span className="mt-1 block text-sm text-slate-300">fiches médicales structurées</span></article><article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><Stethoscope aria-hidden="true" className="text-[var(--primary)]" size={22} /><strong className="mt-6 block font-serif text-3xl">{groups.length}</strong><span className="text-xs text-[var(--muted)]">spécialités alimentées</span></article><article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><BookOpenCheck aria-hidden="true" className="text-[var(--primary)]" size={22} /><strong className="mt-6 block font-serif text-3xl">{urgentCount}</strong><span className="text-xs text-[var(--muted)]">fiches urgentes</span></article></div>
        </section>

        <section className="border-y border-[var(--line)] bg-[var(--surface-subtle)] py-20 sm:py-24" id="explorer"><div className="mx-auto w-[calc(100%-2rem)] max-w-[1180px]"><CatalogueExplorer groups={groups} initialModule={initialModule} signedIn={Boolean(user)} /></div></section>

        <section className="mx-auto w-[calc(100%-2rem)] max-w-[1120px] py-20 text-center sm:py-24"><p className="eyebrow">PRÊT À COMMENCER ?</p><h2 className="mx-auto mb-0 mt-2 max-w-3xl text-balance text-3xl sm:text-5xl">Choisissez une fiche et transformez-la en vraie session d’apprentissage.</h2><Link className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white no-underline" href={user ? "/specialties" : "/signup?next=%2Fspecialties"}>{user ? "Ouvrir le catalogue connecté" : "Créer mon espace gratuit"} <ArrowRight aria-hidden="true" size={17} /></Link></section>
      </main>
    </>
  );
}
