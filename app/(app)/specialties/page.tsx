import { ArrowRight, BookOpenCheck } from "lucide-react";
import Link from "next/link";
import { SpecialtyIcon } from "../../../components/content/SpecialtyIcon";
import { getSpecialtyCatalog } from "../../../lib/content/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Spécialités médicales — MedTrain" };

const tones: Record<string, { badge: string; panel: string }> = {
  amber: { badge: "bg-amber-100 text-amber-800", panel: "border-amber-100 bg-amber-50/60" },
  emerald: { badge: "bg-emerald-100 text-emerald-800", panel: "border-emerald-100 bg-emerald-50/60" },
  orange: { badge: "bg-orange-100 text-orange-800", panel: "border-orange-100 bg-orange-50/60" },
  rose: { badge: "bg-rose-100 text-rose-800", panel: "border-rose-100 bg-rose-50/60" },
  sky: { badge: "bg-sky-100 text-sky-800", panel: "border-sky-100 bg-sky-50/60" },
  violet: { badge: "bg-violet-100 text-violet-800", panel: "border-violet-100 bg-violet-50/60" },
  red: { badge: "bg-red-100 text-red-800", panel: "border-red-100 bg-red-50/60" },
  cyan: { badge: "bg-cyan-100 text-cyan-800", panel: "border-cyan-100 bg-cyan-50/60" },
  blue: { badge: "bg-blue-100 text-blue-800", panel: "border-blue-100 bg-blue-50/60" },
  fuchsia: { badge: "bg-fuchsia-100 text-fuchsia-800", panel: "border-fuchsia-100 bg-fuchsia-50/60" },
  purple: { badge: "bg-purple-100 text-purple-800", panel: "border-purple-100 bg-purple-50/60" },
  lime: { badge: "bg-lime-100 text-lime-800", panel: "border-lime-100 bg-lime-50/60" },
  pink: { badge: "bg-pink-100 text-pink-800", panel: "border-pink-100 bg-pink-50/60" },
  indigo: { badge: "bg-indigo-100 text-indigo-800", panel: "border-indigo-100 bg-indigo-50/60" },
  stone: { badge: "bg-stone-200 text-stone-800", panel: "border-stone-200 bg-stone-50/70" },
};

export default async function SpecialtiesPage() {
  const specialties = await getSpecialtyCatalog();
  const publishedCount = specialties.reduce((total, specialty) => total + specialty.pathologies.length, 0);

  return (
    <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-28 pt-10 sm:px-6 lg:px-8">
      <header className="overflow-hidden rounded-[28px] bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Bibliothèque médicale</p>
          <h1 className="m-0 text-white">Réviser par <em className="text-teal-300">spécialité</em></h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Accédez rapidement aux définitions, signes clés, examens et prises en charge des pathologies publiées.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white/10 px-4 py-2"><strong>{specialties.length}</strong> spécialités</span>
          <span className="rounded-full bg-white/10 px-4 py-2"><strong>{publishedCount}</strong> fiches disponibles</span>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Spécialités">
        {specialties.map((specialty) => {
          const tone = tones[specialty.color ?? ""] ?? { badge: "bg-teal-100 text-teal-800", panel: "border-teal-100 bg-teal-50/60" };
          return (
            <a className={`group rounded-3xl border p-6 no-underline transition hover:-translate-y-1 hover:bg-white hover:shadow-lg ${tone.panel}`} href={specialty.pathologies.length > 0 ? `#${specialty.slug}` : "/quiz#quiz-par-specialite"} key={specialty.id}>
              <span className={`mb-5 grid size-12 place-items-center rounded-2xl ${tone.badge}`}>
                <SpecialtyIcon name={specialty.icon} />
              </span>
              <h2 className="m-0 text-xl">{specialty.name}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{specialty.description}</p>
              <span className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-800">
                {specialty.pathologies.length > 0 ? `${specialty.pathologies.length} fiches` : "Contenu en préparation"} <ArrowRight className="transition group-hover:translate-x-1" size={17} />
              </span>
            </a>
          );
        })}
      </section>

      <section className="mt-16 space-y-8" aria-label="Fiches par spécialité">
        {specialties.filter((specialty) => specialty.pathologies.length > 0).map((specialty) => (
          <article className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" id={specialty.slug} key={specialty.id}>
            <header className="mb-5 flex items-center gap-4 border-b border-slate-100 pb-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700"><SpecialtyIcon name={specialty.icon} /></span>
              <div>
                <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{specialty.pathologies.length} fiches</p>
                <h2 className="m-0 text-2xl">{specialty.name}</h2>
              </div>
            </header>
            <div className="grid gap-2 md:grid-cols-2">
              {specialty.pathologies.map((pathology) => (
                <Link className="group flex items-center gap-3 rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-800 no-underline transition hover:border-teal-200 hover:bg-teal-50" href={`/pathologies/${pathology.slug}`} key={pathology.id}>
                  <BookOpenCheck className="shrink-0 text-teal-700" size={18} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{pathology.title}</span>
                  <ArrowRight className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-700" size={16} />
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
