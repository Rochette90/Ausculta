import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, Ear, Gauge, Stethoscope, TimerReset } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/require-user";
import { BRAND_NAME, BRAND_NAME_UPPER, pageTitle } from "@/lib/brand";
import { EXAM_DURATION_SECONDS } from "@/lib/ecos/timing";

export const metadata: Metadata = {
  title: pageTitle("La méthode"),
  description: `Découvrez comment se déroule une station ECOS sur ${BRAND_NAME} : anamnèse avec un patient simulé, examen clinique, synthèse et débriefing.`,
};
export const dynamic = "force-dynamic";

const examMinutes = Math.round(EXAM_DURATION_SECONDS / 60);

const methodSteps = [
  { number: "01", label: "Écouter", text: "Un entretien avec le patient simulé, à l’écrit ou à la voix.", icon: Ear },
  { number: "02", label: "Examiner", text: "Des gestes et des examens à choisir, avec leurs résultats.", icon: Stethoscope },
  { number: "03", label: "Conclure", text: "Un diagnostic à retenir et une prise en charge à rédiger.", icon: ClipboardCheck },
  { number: "04", label: "Progresser", text: "Une grille corrigée et un débriefing pour savoir quoi revoir.", icon: Gauge },
];

const details = [
  {
    id: "anamnese",
    eyebrow: "ÉCOUTER",
    title: "Une anamnèse face à un patient qui répond vraiment",
    description: "Vous menez l’entretien comme en consultation : le patient simulé répond à vos questions, une par une.",
    icon: Ear,
    points: ["Entretien au clavier ou à la voix, selon votre navigateur", "Le patient répond à vos questions, sans souffler le diagnostic", "Un symptôme absent du cas est nié, comme le ferait un vrai patient", "Urgences ou cabinet : la consigne s’adapte au lieu de la station"],
    note: "L’adresse d’une station ne révèle jamais le diagnostic : c’est à vous de le construire par vos questions.",
  },
  {
    id: "examen",
    eyebrow: "EXAMINER",
    title: "Un examen clinique où chaque geste compte",
    description: "Vous annoncez l’examen, puis vous choisissez ce que vous relevez, examinez et demandez.",
    icon: Stethoscope,
    points: ["Paramètres, examen physique et examens complémentaires", "Chaque geste choisi débloque son résultat", "Des gestes attendus et des gestes peu utiles sont proposés", "Les résultats sont donnés par un examinateur, distinct du patient"],
    note: "Un geste peu utile coûte un demi-point : l’objectif est de cibler, pas de tout demander.",
  },
  {
    id: "synthese",
    eyebrow: "CONCLURE",
    title: "Une synthèse qui vous oblige à trancher",
    description: "Une fois l’entretien et l’examen terminés, vous concluez comme devant l’examinateur.",
    icon: ClipboardCheck,
    points: ["Un diagnostic à retenir parmi quatre propositions", "Une prise en charge à rédiger avec vos mots", "L’entretien et l’examen sont fermés avant de conclure", `En mode examen, ${examMinutes} minutes pour toute la station`],
    note: "En mode examen, ni indice ni score ne s’affichent avant la fin.",
  },
  {
    id: "debriefing",
    eyebrow: "PROGRESSER",
    title: "Un débriefing qui vous dit quoi retravailler",
    description: "Après la correction, vous voyez précisément ce qui a été fait, oublié ou superflu.",
    icon: Gauge,
    points: ["Une grille sur 22 points : 20 pour la station, 2 pour le diagnostic", "Les gestes attendus oubliés et les gestes peu utiles", "Éléments clés, drapeaux rouges et diagnostics différentiels", "La prise en charge attendue, avec ses sources"],
    note: "La grille repère des thèmes dans vos réponses : c’est un outil d’entraînement, pas une évaluation clinique validée.",
  },
];

export default async function MethodPage() {
  const user = await getCurrentUser();
  const startHref = user ? "/cas" : "/signup?next=%2Fcas";

  return (
    <>
      <main>
        <section className="mx-auto grid w-[calc(100%-2rem)] max-w-[1180px] gap-10 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="eyebrow">LA MÉTHODE {BRAND_NAME_UPPER}</p>
            <h1 className="mb-0 mt-3 max-w-4xl text-balance">Une station ECOS, <span>du premier mot au débriefing.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">{BRAND_NAME} reproduit le déroulé d’une station : vous écoutez le patient, vous l’examinez, vous concluez, puis vous voyez ce qui vous a échappé.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]" href={startHref}>{user ? "Choisir une station" : "Commencer gratuitement"} <ArrowRight aria-hidden="true" size={17} /></Link>
              <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-3 font-bold text-[var(--ink)] no-underline hover:border-[var(--primary)]" href="#modes">Voir les deux modes</Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {methodSteps.map((step) => {
              const Icon = step.icon;
              return <article className="min-h-52 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]" key={step.number}><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-[var(--mint)] text-[var(--mint-dark)]"><Icon aria-hidden="true" size={21} /></span><small className="font-serif text-[var(--muted-light)]">{step.number}</small></div><h2 className="mb-2 mt-8 text-2xl">{step.label}</h2><p className="m-0 text-sm leading-6 text-[var(--muted)]">{step.text}</p></article>;
            })}
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-[var(--surface-subtle)] py-20 sm:py-28">
          <div className="mx-auto w-[calc(100%-2rem)] max-w-[1120px]">
            <div className="mx-auto mb-14 max-w-2xl text-center"><p className="eyebrow">LES QUATRE TEMPS</p><h2 className="mb-0 mt-2 text-balance text-3xl sm:text-5xl">Chaque étape a un rôle précis dans la station</h2></div>
            <div className="grid gap-6">
              {details.map((detail, index) => {
                const Icon = detail.icon;
                return (
                  <article className="scroll-mt-28 overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]" id={detail.id} key={detail.id}>
                    <div className="grid lg:grid-cols-[.8fr_1.2fr]">
                      <div className={`p-7 sm:p-10 ${index % 2 === 1 ? "bg-[var(--surface-dark)]" : "bg-[var(--primary-subtle)]"}`}>
                        <span className={`grid size-12 place-items-center rounded-2xl ${index % 2 === 1 ? "bg-white/10 text-teal-200" : "bg-[var(--mint)] text-[var(--mint-dark)]"}`}><Icon aria-hidden="true" size={23} /></span>
                        <p className={`mb-0 mt-8 text-xs font-extrabold tracking-[0.14em] ${index % 2 === 1 ? "text-teal-300" : "text-[var(--primary)]"}`}>{detail.eyebrow}</p>
                        <h3 className={`mb-0 mt-3 text-balance text-2xl sm:text-3xl ${index % 2 === 1 ? "text-white" : "text-[var(--ink)]"}`}>{detail.title}</h3>
                        <p className={`mb-0 mt-4 leading-7 ${index % 2 === 1 ? "text-slate-300" : "text-[var(--muted)]"}`}>{detail.description}</p>
                      </div>
                      <div className="p-7 sm:p-10">
                        <ul className="m-0 grid list-none gap-4 p-0">{detail.points.map((point) => <li className="flex items-start gap-3 text-[var(--ink-secondary)]" key={point}><CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--primary)]" size={19} /><span>{point}</span></li>)}</ul>
                        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface-subtle)] p-5"><p className="m-0 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--ink)]">À retenir — </strong>{detail.note}</p></div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-[calc(100%-2rem)] max-w-[1120px] py-20 sm:py-28" id="modes">
          <div className="grid overflow-hidden rounded-[32px] bg-[var(--surface-dark)] shadow-[var(--shadow-lg)] lg:grid-cols-[.85fr_1.15fr]">
            <div className="p-8 sm:p-12"><span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-teal-200"><TimerReset aria-hidden="true" size={24} /></span><p className="mb-0 mt-8 text-xs font-bold tracking-[0.14em] text-teal-300">DEUX MODES</p><h2 className="mb-0 mt-3 text-3xl text-white sm:text-4xl">S’entraîner, puis se tester.</h2><p className="mb-0 mt-4 leading-7 text-slate-300">Commencez en mode entraînement pour prendre vos repères, puis passez en mode examen pour retrouver la pression du chronomètre.</p></div>
            <ol className="m-0 grid list-none gap-px bg-white/10 p-0 sm:grid-cols-2 lg:grid-cols-1"><li className="bg-slate-950/90 p-7"><span className="text-xs font-bold text-teal-300">ENTRAÎNEMENT</span><div className="mt-3 flex items-center gap-3 text-white"><Gauge aria-hidden="true" size={20} /><strong>Sans chronomètre, bilan détaillé à la fin</strong></div></li><li className="bg-slate-950/90 p-7"><span className="text-xs font-bold text-teal-300">EXAMEN · {examMinutes} MIN</span><div className="mt-3 flex items-center gap-3 text-white"><TimerReset aria-hidden="true" size={20} /><strong>Chronométré, sans indice ni score avant la fin</strong></div></li></ol>
          </div>
        </section>

        <section className="px-4 pb-24 text-center sm:pb-28"><p className="eyebrow">À VOUS DE JOUER</p><h2 className="mx-auto mb-0 mt-2 max-w-3xl text-balance text-3xl sm:text-5xl">Commencez par une station, puis laissez le débriefing guider la suivante.</h2><Link className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white no-underline hover:bg-[var(--primary-hover)]" href={startHref}>{user ? "Choisir une station" : "Créer mon espace gratuit"} <ArrowRight aria-hidden="true" size={17} /></Link></section>
      </main>
    </>
  );
}
