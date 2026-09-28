import type { Metadata } from "next";
import { Activity, ArrowRight, BadgeCheck, BookOpenCheck, LayoutDashboard, Newspaper, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { BRAND_NAME, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Nouveautés"),
  description: `Suivez les dernières évolutions du catalogue, de l’expérience d’apprentissage et de la qualité éditoriale ${BRAND_NAME}.`,
};
export const dynamic = "force-dynamic";

const releases = [
  { date: "21 août 2026", tag: "Cursus B3", title: "Le catalogue suit désormais les cinq modules du Bachelor 3", text: "Vingt-six fiches issues du vault renforcent l'abdomen, l'immunologie-inflammation et la pédiatrie. Le catalogue atteint 156 fiches, toutes intégrées au parcours de révision et soumises au workflow de validation.", icon: Search, href: "/catalogue", link: "Explorer les modules B3" },
  { date: "12 août 2026", tag: "Tutoriels", title: "Deux nouvelles méthodes interactives : ECG et radio thorax", text: "Chaque tutoriel propose une progression pas à pas, une check-list active et trois questions d'auto-évaluation, à partir des notes du vault MED - Last Dance.", icon: Activity, href: "/tutoriels", link: "Ouvrir les tutoriels" },
  { date: "12 août 2026", tag: "Catalogue", title: "130 fiches dans quinze spécialités alimentées", text: "Quarante notes du vault rejoignent le catalogue en urgences, radiologie, néphrologie, hématologie, oncologie, pédiatrie, psychiatrie, rhumatologie et dermatologie. Elles sont toutes marquées à réviser.", icon: Search, href: "/catalogue", link: "Explorer le catalogue" },
  { date: "12 août 2026", tag: "Qualité éditoriale", title: "Les fiches affichent désormais leur état de révision", text: "Toutes les fiches passent par un statut explicite. Une validation est datée et signée ; une modification ultérieure la replace automatiquement à réviser.", icon: BadgeCheck, href: "/qualite", link: "Comprendre la validation" },
  { date: "11 août 2026", tag: "Entraînement", title: "Quiz par spécialité et suivi des erreurs", text: "Les sessions de questions peuvent cibler une spécialité, enregistrer les réponses et faire revenir les notions fragiles dans la progression.", icon: BookOpenCheck, href: "/methode#qcm", link: "Voir la méthode QCM" },
  { date: "10 août 2026", tag: "Progression", title: "Un tableau de bord pour guider la prochaine activité", text: "XP, niveau, série quotidienne et activités terminées sont réunis pour rendre la régularité visible sans alourdir les révisions.", icon: LayoutDashboard, href: "/methode#progression", link: "Découvrir la progression" },
];

export default async function NewsPage() {
  return (
    <>
      <main>
        <section className="mx-auto w-[calc(100%-2rem)] max-w-[950px] py-20 text-center sm:py-28"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--mint)] text-[var(--mint-dark)]"><Newspaper aria-hidden="true" size={26} /></span><p className="eyebrow mt-7">NOUVEAUTÉS</p><h1 className="mb-0 mt-3 text-balance">{BRAND_NAME} évolue, <span>le journal reste lisible.</span></h1><p className="mx-auto mb-0 mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Nouveau contenu, changements de méthode et améliorations du produit : voici ce qui a réellement changé.</p></section>

        <section className="mx-auto w-[calc(100%-2rem)] max-w-[900px] pb-20 sm:pb-28"><div className="relative grid gap-5 before:absolute before:bottom-8 before:left-[25px] before:top-8 before:w-px before:bg-[var(--line)] sm:before:left-[31px]">{releases.map((release, index) => { const Icon = release.icon; return <article className="relative grid grid-cols-[52px_1fr] gap-4 sm:grid-cols-[64px_1fr] sm:gap-6" key={`${release.date}-${release.title}`}><span className={`relative z-10 grid size-[52px] place-items-center rounded-2xl border sm:size-16 ${index === 0 ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--line)] bg-[var(--surface)] text-[var(--primary)]"}`}><Icon aria-hidden="true" size={index === 0 ? 23 : 21} /></span><div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8"><div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.11em]"><span className="text-[var(--primary)]">{release.tag}</span><span className="text-[var(--muted-light)]">·</span><time className="text-[var(--muted)]">{release.date}</time></div><h2 className="mb-0 mt-4 text-balance text-2xl sm:text-3xl">{release.title}</h2><p className="mb-0 mt-4 leading-7 text-[var(--muted)]">{release.text}</p><Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] no-underline" href={release.href}>{release.link} <ArrowRight aria-hidden="true" size={16} /></Link></div></article>; })}</div></section>

        <section className="border-t border-[var(--line)] bg-[var(--surface-dark)] px-4 py-20 text-center"><Sparkles aria-hidden="true" className="mx-auto text-teal-300" size={28} /><p className="mt-6 text-xs font-extrabold tracking-[.14em] text-teal-300">LA SUITE SE CONSTRUIT</p><h2 className="mx-auto mb-0 mt-3 max-w-3xl text-balance text-3xl !text-white sm:text-4xl">Une amélioration utile commence souvent par un retour précis.</h2><p className="mx-auto mb-0 mt-4 max-w-xl leading-7 text-slate-300">Dites-nous la spécialité, le format ou la fonctionnalité qui vous manque le plus.</p><Link className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-950 no-underline" href="/contact">Proposer une amélioration <ArrowRight aria-hidden="true" size={17} /></Link></section>
      </main>
    </>
  );
}
