import type { Metadata } from "next";
import { ArrowRight, Activity, BookOpenCheck, Clock3, ScanLine, Sparkles } from "lucide-react";
import Link from "next/link";
import { pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Tutoriels médicaux"),
  description: "Apprenez une méthode reproductible pour lire un ECG et une radiographie du thorax.",
};
export const dynamic = "force-dynamic";

const tutorials = [
  { href: "/tutoriels/ecg", eyebrow: "CARDIOLOGIE · 25 MIN", title: "Lire un ECG en 6 étapes", text: "Du contrôle technique à la synthèse RICK : rythme, fréquence, axe, intervalles, morphologie et repolarisation.", icon: Activity, color: "from-teal-500 to-cyan-800", meta: ["6 étapes", "23 contrôles", "3 questions"] },
  { href: "/tutoriels/radiographie-thorax", eyebrow: "RADIOLOGIE · 30 MIN", title: "Lire une radiographie du thorax", text: "Qualité DRS + RIPE, cinq compartiments, grands syndromes et formulation d'une conclusion utile.", icon: ScanLine, color: "from-sky-500 to-indigo-900", meta: ["6 étapes", "24 contrôles", "3 questions"] },
];

export default async function TutorialsPage() {
  return <><main>
    <section className="mx-auto w-[calc(100%-2rem)] max-w-[1120px] py-20 text-center sm:py-28"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--mint-light)] text-[var(--primary)]"><Sparkles size={25} /></span><p className="eyebrow mt-7">APPRENDRE UN GESTE INTELLECTUEL</p><h1 className="mx-auto mb-0 mt-3 max-w-4xl text-balance">Des tutoriels pour lire <span>dans le bon ordre.</span></h1><p className="mx-auto mb-0 mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Une méthode courte, active et reproductible. Cochez chaque contrôle, avancez à votre rythme puis vérifiez vos acquis.</p></section>
    <section className="border-y border-[var(--line)] bg-[var(--surface-subtle)] py-20 sm:py-24"><div className="mx-auto grid w-[calc(100%-2rem)] max-w-[1120px] gap-6 md:grid-cols-2">{tutorials.map((tutorial) => { const Icon = tutorial.icon; return <Link className="group overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] no-underline shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]" href={tutorial.href} key={tutorial.href}><div className={`bg-gradient-to-br ${tutorial.color} p-7 text-white sm:p-9`}><Icon size={34} /><p className="mb-0 mt-10 text-xs font-extrabold tracking-[.13em] text-white/70">{tutorial.eyebrow}</p><h2 className="mb-0 mt-3 text-3xl !text-white sm:text-4xl md:min-h-[96px]">{tutorial.title}</h2></div><div className="p-7 sm:p-9"><p className="mb-0 leading-7 text-[var(--muted)]">{tutorial.text}</p><div className="mt-6 flex flex-wrap gap-2">{tutorial.meta.map((item) => <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]" key={item}>{item}</span>)}</div><b className="mt-7 flex items-center gap-2 text-sm text-[var(--primary)]">Commencer le tutoriel <ArrowRight className="transition group-hover:translate-x-1" size={16} /></b></div></Link>; })}</div></section>
    <section className="mx-auto grid w-[calc(100%-2rem)] max-w-[1050px] gap-5 py-20 sm:grid-cols-3 sm:py-24"><article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"><BookOpenCheck className="text-[var(--primary)]" size={22} /><h3 className="mb-0 mt-5 text-lg">Basés sur votre vault</h3><p className="mb-0 mt-3 text-sm leading-6 text-[var(--muted)]">Les méthodes reprennent et structurent les cours ECG et imagerie thoracique de MED - Last Dance.</p></article><article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"><Clock3 className="text-[var(--primary)]" size={22} /><h3 className="mb-0 mt-5 text-lg">Faits pour une session</h3><p className="mb-0 mt-3 text-sm leading-6 text-[var(--muted)]">Chaque parcours se termine en moins de 30 minutes et reste consultable étape par étape.</p></article><article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"><Sparkles className="text-[var(--primary)]" size={22} /><h3 className="mb-0 mt-5 text-lg">Actifs, pas décoratifs</h3><p className="mb-0 mt-3 text-sm leading-6 text-[var(--muted)]">Check-lists et questions transforment la lecture passive en routine reproductible.</p></article></section>
  </main></>;
}
