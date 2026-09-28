import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, BookOpenCheck, FileClock, Flag, RotateCcw, ShieldCheck, Signature } from "lucide-react";
import Link from "next/link";
import { BRAND_NAME, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Qualité scientifique"),
  description: `Découvrez le processus de rédaction, de révision signée et de mise à jour des fiches médicales ${BRAND_NAME}.`,
};
export const dynamic = "force-dynamic";

const workflow = [
  { number: "01", title: "Structuration", text: "La fiche suit une trame clinique commune : reconnaître, confirmer, traiter, surveiller.", icon: BookOpenCheck },
  { number: "02", title: "À réviser", text: "Toute nouvelle fiche ou modification importante est explicitement placée en attente de validation.", icon: FileClock },
  { number: "03", title: "Révision signée", text: "La personne qui valide la fiche signe à son nom et la date de révision devient visible.", icon: Signature },
  { number: "04", title: "Mise à jour continue", text: "Une modification ultérieure invalide la signature précédente et relance le cycle de révision.", icon: RotateCcw },
];

export default async function QualityPage() {
  return (
    <>
      <main>
        <section className="mx-auto grid w-[calc(100%-2rem)] max-w-[1180px] gap-12 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div><p className="eyebrow">QUALITÉ SCIENTIFIQUE</p><h1 className="mb-0 mt-3 text-balance">Savoir ce qui est validé, <span>par qui et quand.</span></h1><p className="mb-0 mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">La fiabilité ne repose pas sur un badge décoratif. {BRAND_NAME} affiche l’état éditorial de chaque fiche et rend la validation traçable.</p><Link className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white no-underline" href="/catalogue">Explorer le catalogue <ArrowRight aria-hidden="true" size={17} /></Link></div>
          <div className="rounded-[30px] bg-[var(--surface-dark)] p-7 shadow-[var(--shadow-lg)] sm:p-9"><ShieldCheck aria-hidden="true" className="text-teal-300" size={32} /><p className="mb-0 mt-8 text-xs font-extrabold tracking-[.14em] text-teal-300">ENGAGEMENT DE TRANSPARENCE</p><h2 className="mb-0 mt-3 text-3xl !text-white">Une fiche non validée reste clairement marquée « À réviser ».</h2><p className="mb-0 mt-5 leading-7 text-slate-300">Elle demeure utile pour l’apprentissage, mais son statut rappelle qu’une validation médicale signée est encore attendue.</p></div>
        </section>

        <section className="border-y border-[var(--line)] bg-[var(--surface-subtle)] py-20 sm:py-28"><div className="mx-auto w-[calc(100%-2rem)] max-w-[1120px]"><div className="mx-auto mb-12 max-w-2xl text-center"><p className="eyebrow">LE CYCLE ÉDITORIAL</p><h2 className="mb-0 mt-2 text-balance text-3xl sm:text-5xl">Chaque modification remet la qualité en mouvement</h2></div><div className="grid gap-4 md:grid-cols-2">{workflow.map((step) => { const Icon = step.icon; return <article className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow-sm)]" key={step.number}><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-[var(--mint)] text-[var(--mint-dark)]"><Icon aria-hidden="true" size={21} /></span><span className="font-serif text-sm text-[var(--muted-light)]">{step.number}</span></div><h3 className="mb-2 mt-7 text-2xl">{step.title}</h3><p className="m-0 leading-7 text-[var(--muted)]">{step.text}</p></article>; })}</div></div></section>

        <section className="mx-auto grid w-[calc(100%-2rem)] max-w-[1120px] gap-6 py-20 sm:py-28 lg:grid-cols-2"><article className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-7 text-emerald-950 sm:p-9"><BadgeCheck aria-hidden="true" size={28} /><p className="mb-0 mt-7 text-xs font-extrabold tracking-[.12em] text-emerald-700">FICHE RÉVISÉE</p><h2 className="mb-0 mt-2 text-3xl text-emerald-950">La signature et la date sont visibles.</h2><p className="mb-0 mt-4 leading-7 text-emerald-900/75">Vous pouvez identifier la personne ayant effectué la validation finale et savoir à quel moment elle a eu lieu.</p></article><article className="rounded-[28px] border border-amber-200 bg-amber-50 p-7 text-amber-950 sm:p-9"><FileClock aria-hidden="true" size={28} /><p className="mb-0 mt-7 text-xs font-extrabold tracking-[.12em] text-amber-700">À RÉVISER</p><h2 className="mb-0 mt-2 text-3xl text-amber-950">Le niveau d’incertitude n’est pas masqué.</h2><p className="mb-0 mt-4 leading-7 text-amber-900/75">Ce statut indique qu’une relecture médicale formelle est encore nécessaire ou qu’une modification a annulé la validation précédente.</p></article></section>

        <section className="border-t border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-20 text-center"><Flag aria-hidden="true" className="mx-auto text-[var(--primary)]" size={30} /><p className="eyebrow mt-6">AMÉLIORATION CONTINUE</p><h2 className="mx-auto mb-0 mt-2 max-w-3xl text-balance text-3xl sm:text-4xl">Une erreur ou une source plus récente doit pouvoir être signalée.</h2><p className="mx-auto mb-0 mt-4 max-w-2xl leading-7 text-[var(--muted)]">Les utilisateurs connectés peuvent signaler un passage précis. Pour une correction générale, la page Contact permet de transmettre la fiche concernée et la proposition.</p><Link className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-3 font-bold text-[var(--ink)] no-underline hover:border-[var(--primary)]" href="/contact">Signaler une correction <ArrowRight aria-hidden="true" size={17} /></Link></section>
      </main>
    </>
  );
}
