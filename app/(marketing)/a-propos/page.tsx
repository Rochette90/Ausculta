import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck, BrainCircuit, HeartHandshake, MapPin, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/require-user";
import { BRAND_NAME, BRAND_NAME_UPPER, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("À propos"),
  description: `Découvrez la mission de ${BRAND_NAME} : rendre l’entraînement aux ECOS accessible, exigeant et régulier.`,
};
export const dynamic = "force-dynamic";

const values = [
  { title: "Clarté", text: "Un déroulé lisible : on sait à chaque instant où l’on en est dans la station.", icon: BookOpenCheck },
  { title: "Raisonnement", text: "Entraîner la décision clinique, pas seulement la mémorisation isolée.", icon: BrainCircuit },
  { title: "Transparence", text: "Citer les sources de chaque station et dire ce qui reste à valider.", icon: HeartHandshake },
];

export default async function AboutPage() {
  const user = await getCurrentUser();
  const startHref = user ? "/dashboard" : "/signup?next=%2Fcas";
  return (
    <>
      <main>
        <section className="mx-auto w-[calc(100%-2rem)] max-w-[1050px] py-20 text-center sm:py-28"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--mint)] text-[var(--mint-dark)]"><Sparkles aria-hidden="true" size={26} /></span><p className="eyebrow mt-7">À PROPOS DE {BRAND_NAME_UPPER}</p><h1 className="mx-auto mb-0 mt-3 max-w-5xl text-balance">Construire le pont entre ce que l’on apprend et <span>ce que l’on doit décider.</span></h1><p className="mx-auto mb-0 mt-7 max-w-3xl text-lg leading-8 text-[var(--muted)]">{BRAND_NAME} est un projet d’entraînement clinique pensé en Suisse : des stations ECOS avec patient simulé, pour s’exercer à écouter, examiner et conclure avant le jour de l’examen.</p></section>

        <section className="mx-auto grid w-[calc(100%-2rem)] max-w-[1120px] overflow-hidden rounded-[32px] bg-[var(--surface-dark)] shadow-[var(--shadow-lg)] lg:grid-cols-[.9fr_1.1fr]"><div className="p-8 sm:p-12"><MapPin aria-hidden="true" className="text-teal-300" size={28} /><p className="mb-0 mt-8 text-xs font-extrabold tracking-[.14em] text-teal-300">LE POINT DE DÉPART</p><h2 className="mb-0 mt-3 text-3xl !text-white sm:text-4xl">Les connaissances sont là. L’entraînement à la consultation manque.</h2></div><div className="bg-white/[.055] p-8 sm:p-12"><p className="m-0 text-lg leading-8 text-slate-300">On révise beaucoup la théorie, mais on s’entraîne rarement à mener une consultation de bout en bout, faute de patient et d’examinateur disponibles. {BRAND_NAME} rend cet entraînement possible à tout moment, avec une grille et un débriefing.</p><Link className="mt-7 inline-flex items-center gap-2 font-bold text-teal-300 no-underline" href="/methode">Découvrir cette boucle <ArrowRight aria-hidden="true" size={17} /></Link></div></section>

        <section className="mx-auto w-[calc(100%-2rem)] max-w-[1120px] py-20 sm:py-28"><div className="mb-12 max-w-2xl"><p className="eyebrow">NOS PRINCIPES</p><h2 className="mb-0 mt-2 text-balance text-3xl sm:text-5xl">Un produit utile doit rester lisible, exigeant et honnête</h2></div><div className="grid gap-4 md:grid-cols-3">{values.map((value) => { const Icon = value.icon; return <article className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow-sm)]" key={value.title}><span className="grid size-12 place-items-center rounded-2xl bg-[var(--mint)] text-[var(--mint-dark)]"><Icon aria-hidden="true" size={22} /></span><h3 className="mb-2 mt-8 text-2xl">{value.title}</h3><p className="m-0 leading-7 text-[var(--muted)]">{value.text}</p></article>; })}</div></section>

        <section className="border-y border-[var(--line)] bg-[var(--surface-subtle)] py-20"><div className="mx-auto grid w-[calc(100%-2rem)] max-w-[1000px] gap-8 lg:grid-cols-[auto_1fr] lg:items-center"><span className="grid size-20 place-items-center rounded-[24px] bg-[var(--primary)] text-white"><Target aria-hidden="true" size={34} /></span><div><p className="eyebrow">LA DIRECTION</p><h2 className="mb-0 mt-2 text-3xl sm:text-4xl">Devenir un partenaire d’entraînement quotidien, pas une bibliothèque de plus.</h2><p className="mb-0 mt-4 max-w-3xl leading-7 text-[var(--muted)]">Chaque évolution doit aider à choisir la prochaine activité, comprendre une erreur ou consolider une compétence clinique.</p></div></div></section>

        <section className="px-4 py-20 text-center sm:py-24"><p className="eyebrow">PARTICIPEZ AU PROJET</p><h2 className="mx-auto mb-0 mt-2 max-w-3xl text-balance text-3xl sm:text-5xl">Testez {BRAND_NAME} et dites-nous ce qui vous ferait vraiment progresser.</h2><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white no-underline" href={startHref}>Commencer gratuitement <ArrowRight aria-hidden="true" size={17} /></Link><Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-3 font-bold text-[var(--ink)] no-underline hover:border-[var(--primary)]" href="/contact">Échanger avec nous</Link></div></section>
      </main>
    </>
  );
}
