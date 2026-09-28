import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, BrainCircuit, CheckCircle2, ClipboardCheck, Gauge, Stethoscope, Target, TimerReset } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/require-user";
import { BRAND_NAME, BRAND_NAME_UPPER, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("La méthode"),
  description: `Découvrez comment ${BRAND_NAME} combine fiches structurées, QCM expliqués, cas cliniques et suivi de progression.`,
};
export const dynamic = "force-dynamic";

const methodSteps = [
  { number: "01", label: "Comprendre", text: "Une fiche claire pour construire les bons repères.", icon: BookOpenCheck },
  { number: "02", label: "Tester", text: "Des QCM pour vérifier ce que vous savez vraiment.", icon: ClipboardCheck },
  { number: "03", label: "Appliquer", text: "Des situations cliniques pour décider sous contrainte.", icon: Stethoscope },
  { number: "04", label: "Consolider", text: "Une progression visible pour organiser la répétition.", icon: Gauge },
];

const details = [
  {
    id: "fiches",
    eyebrow: "COMPRENDRE",
    title: "Des fiches faites pour raisonner, pas seulement relire",
    description: "Chaque pathologie est découpée selon la logique clinique : reconnaître, confirmer, traiter et repérer l’urgence.",
    icon: BookOpenCheck,
    points: ["Définition, facteurs de risque et physiopathologie utile", "Signes typiques, drapeaux rouges et diagnostics différentiels", "Examens à demander et interprétation des résultats", "Prise en charge aiguë, traitement de fond et suivi"],
    note: "Les fiches sont relues dans un workflow éditorial explicite et signées par la personne qui les valide.",
  },
  {
    id: "qcm",
    eyebrow: "TESTER",
    title: "Des QCM qui expliquent le raisonnement derrière la réponse",
    description: "Répondre permet d’identifier immédiatement ce qui est acquis, imprécis ou encore fragile.",
    icon: ClipboardCheck,
    points: ["Séries quotidiennes ou entraînement ciblé par spécialité", "Correction immédiate avec explication pédagogique", "Questions orientées décisions diagnostiques et thérapeutiques", "Retour possible sur les erreurs pour vérifier la consolidation"],
    note: "Le but n’est pas d’accumuler les questions, mais de comprendre pourquoi une option est juste et les autres non.",
  },
  {
    id: "cas-cliniques",
    eyebrow: "APPLIQUER",
    title: "Des cas cliniques pour transformer les connaissances en décisions",
    description: "Les scénarios vous placent face à un patient, avec les informations disponibles dans une vraie consultation.",
    icon: Stethoscope,
    points: ["Anamnèse, hypothèses diagnostiques et examens complémentaires", "Hiérarchisation des urgences et conduite à tenir", "Entraînement au raisonnement clinique intégré", "Feedback sur les critères atteints et les étapes oubliées"],
    note: "Vous entraînez la séquence complète : recueillir, interpréter, prioriser, décider et communiquer.",
  },
  {
    id: "progression",
    eyebrow: "CONSOLIDER",
    title: "Une progression qui vous dit quoi retravailler ensuite",
    description: "Chaque activité alimente un tableau de bord simple pour maintenir la régularité sans se disperser.",
    icon: Gauge,
    points: ["XP, niveau et série quotidienne pour visualiser l’effort", "Historique des activités et scores par format", "Repérage des erreurs et des thèmes à revoir", "Objectifs courts, compatibles avec un emploi du temps chargé"],
    note: `La régularité compte davantage qu’une longue session isolée : ${BRAND_NAME} rend ce rythme visible.`,
  },
];

export default async function MethodPage() {
  const user = await getCurrentUser();
  const startHref = user ? "/dashboard" : "/signup?next=%2Fdashboard";

  return (
    <>
      <main>
        <section className="mx-auto grid w-[calc(100%-2rem)] max-w-[1180px] gap-10 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="eyebrow">LA MÉTHODE {BRAND_NAME_UPPER}</p>
            <h1 className="mb-0 mt-3 max-w-4xl text-balance">Passer du savoir à la <span>bonne décision clinique.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">{BRAND_NAME} organise vos révisions autour d’une boucle simple : comprendre un sujet, tester vos connaissances, les appliquer puis consolider ce qui reste fragile.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]" href={startHref}>{user ? "Continuer mon entraînement" : "Commencer gratuitement"} <ArrowRight aria-hidden="true" size={17} /></Link>
              <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-3 font-bold text-[var(--ink)] no-underline hover:border-[var(--primary)]" href="#routine">Voir une routine type</Link>
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
            <div className="mx-auto mb-14 max-w-2xl text-center"><p className="eyebrow">LES QUATRE PILIERS</p><h2 className="mb-0 mt-2 text-balance text-3xl sm:text-5xl">Chaque outil a un rôle précis dans votre apprentissage</h2></div>
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

        <section className="mx-auto w-[calc(100%-2rem)] max-w-[1120px] py-20 sm:py-28" id="routine">
          <div className="grid overflow-hidden rounded-[32px] bg-[var(--surface-dark)] shadow-[var(--shadow-lg)] lg:grid-cols-[.85fr_1.15fr]">
            <div className="p-8 sm:p-12"><span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-teal-200"><TimerReset aria-hidden="true" size={24} /></span><p className="mb-0 mt-8 text-xs font-bold tracking-[0.14em] text-teal-300">UNE ROUTINE DE 20 MINUTES</p><h2 className="mb-0 mt-3 text-3xl text-white sm:text-4xl">Courte, ciblée et répétable.</h2><p className="mb-0 mt-4 leading-7 text-slate-300">Une session efficace doit pouvoir tenir entre deux cours. L’important est de revenir régulièrement sur ce qui résiste.</p></div>
            <ol className="m-0 grid list-none gap-px bg-white/10 p-0 sm:grid-cols-3 lg:grid-cols-1"><li className="bg-slate-950/90 p-7"><span className="text-xs font-bold text-teal-300">8 MIN</span><div className="mt-3 flex items-center gap-3 text-white"><BrainCircuit aria-hidden="true" size={20} /><strong>Lire une fiche ciblée</strong></div></li><li className="bg-slate-950/90 p-7"><span className="text-xs font-bold text-teal-300">7 MIN</span><div className="mt-3 flex items-center gap-3 text-white"><Target aria-hidden="true" size={20} /><strong>Répondre à quelques QCM</strong></div></li><li className="bg-slate-950/90 p-7"><span className="text-xs font-bold text-teal-300">5 MIN</span><div className="mt-3 flex items-center gap-3 text-white"><Gauge aria-hidden="true" size={20} /><strong>Revoir les erreurs</strong></div></li></ol>
          </div>
        </section>

        <section className="px-4 pb-24 text-center sm:pb-28"><p className="eyebrow">À VOUS DE JOUER</p><h2 className="mx-auto mb-0 mt-2 max-w-3xl text-balance text-3xl sm:text-5xl">Commencez par une activité, puis laissez la progression guider la suivante.</h2><Link className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white no-underline hover:bg-[var(--primary-hover)]" href={startHref}>{user ? "Reprendre ma progression" : "Créer mon espace gratuit"} <ArrowRight aria-hidden="true" size={17} /></Link></section>
      </main>
    </>
  );
}
