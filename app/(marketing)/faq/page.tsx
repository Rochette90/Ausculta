import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle, Plus } from "lucide-react";
import { BRAND_NAME, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Questions fréquentes"),
  description: `Réponses aux questions fréquentes sur les fiches, QCM, cas cliniques, comptes et tarifs ${BRAND_NAME}.`,
};
export const dynamic = "force-dynamic";

const faqGroups = [
  {
    title: `Utiliser ${BRAND_NAME}`,
    questions: [
      { question: `À qui s’adresse ${BRAND_NAME} ?`, answer: `${BRAND_NAME} est conçu en priorité pour les étudiantes et étudiants en médecine en Suisse qui souhaitent structurer leurs révisions, tester leurs connaissances et entraîner leur raisonnement clinique.` },
      { question: "Comment commencer ?", answer: "Créez un compte gratuit, choisissez une fiche ou lancez le quiz du jour. Votre tableau de bord enregistre ensuite les activités terminées et vous aide à garder un rythme régulier." },
      { question: `Puis-je utiliser ${BRAND_NAME} sur mobile ?`, answer: "Oui. Les pages, fiches, QCM et cas sont adaptés aux petits écrans afin de permettre une session courte entre deux cours ou pendant un trajet." },
      { question: "Quelle routine recommandez-vous ?", answer: "Une session de 15 à 20 minutes suffit : lire une fiche ciblée, répondre à quelques questions, puis revoir immédiatement les erreurs. La régularité compte davantage qu’une longue session isolée." },
    ],
  },
  {
    title: "Contenu médical",
    questions: [
      { question: "Que contient une fiche de pathologie ?", answer: "Les fiches couvrent les repères utiles au raisonnement : définition, facteurs de risque, signes cliniques, examens, diagnostics différentiels, traitement, suivi et situations urgentes." },
      { question: "Comment les fiches sont-elles validées ?", answer: "Chaque fiche suit un statut éditorial. Une modification la replace à réviser ; la personne qui effectue la validation finale signe ensuite la fiche à son nom." },
      { question: "Les corrections des QCM sont-elles expliquées ?", answer: `Oui. Après la réponse, ${BRAND_NAME} affiche l’option correcte et une explication pédagogique afin de comprendre le raisonnement attendu, pas seulement mémoriser une lettre.` },
      { question: "Le contenu remplace-t-il les recommandations officielles ?", answer: `Non. ${BRAND_NAME} est un outil pédagogique de révision. Il ne remplace ni les recommandations institutionnelles à jour, ni l’enseignement de votre faculté, ni un avis médical.` },
    ],
  },
  {
    title: "Compte, progression et tarifs",
    questions: [
      { question: "Ma progression est-elle sauvegardée ?", answer: "Oui. Lorsque vous êtes connecté, vos activités, XP, scores et série quotidienne sont associés à votre compte et restent disponibles sur vos différents appareils." },
      { question: `${BRAND_NAME} est-il gratuit ?`, answer: "Oui, la plateforme est actuellement accessible gratuitement. Une formule Pro plus complète est prévue, mais elle n’est pas encore disponible à l’achat." },
      { question: "Que se passe-t-il si je change de formule plus tard ?", answer: "Votre compte et votre progression resteront enregistrés. Le changement de formule n’effacera pas l’historique de vos activités." },
      { question: "Comment signaler une erreur dans une fiche ?", answer: "Sur une fiche connectée, sélectionnez le passage concerné puis utilisez l’outil de signalement. Vous pouvez aussi nous contacter en indiquant le titre de la fiche et la correction proposée." },
    ],
  },
];

export default async function FaqPage() {

  return (
    <>
      <main>
        <section className="mx-auto w-[calc(100%-2rem)] max-w-[900px] pb-14 pt-20 text-center sm:pb-20 sm:pt-28">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--mint)] text-[var(--mint-dark)]"><HelpCircle aria-hidden="true" size={27} /></span>
          <p className="eyebrow mt-7">QUESTIONS FRÉQUENTES</p>
          <h1 className="mb-0 mt-3 text-balance">Tout ce qu’il faut savoir pour <span>bien démarrer.</span></h1>
          <p className="mx-auto mb-0 mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Fonctionnement de la plateforme, validation du contenu, progression et tarifs : retrouvez ici les réponses essentielles.</p>
        </section>

        <section className="mx-auto w-[calc(100%-2rem)] max-w-[900px] pb-20 sm:pb-28">
          <div className="grid gap-12">
            {faqGroups.map((group) => <div key={group.title}><h2 className="mb-5 mt-0 text-2xl">{group.title}</h2><div className="grid gap-3">{group.questions.map((item) => <details className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] open:border-[color-mix(in_srgb,var(--primary)_45%,var(--line))]" key={item.question}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-bold text-[var(--ink)] marker:content-none sm:px-6"><span>{item.question}</span><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface-subtle)] text-[var(--primary)] transition group-open:rotate-45"><Plus aria-hidden="true" size={17} /></span></summary><p className="mb-0 border-t border-[var(--line-subtle)] px-5 pb-6 pt-5 leading-7 text-[var(--muted)] sm:px-6">{item.answer}</p></details>)}</div></div>)}
          </div>
        </section>

        <section className="border-t border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-20 text-center sm:py-24"><p className="eyebrow">UNE AUTRE QUESTION ?</p><h2 className="mx-auto mb-0 mt-2 max-w-2xl text-balance text-3xl sm:text-4xl">Dites-nous ce qui vous manque pour avancer.</h2><p className="mx-auto mb-0 mt-4 max-w-xl text-[var(--muted)]">Question technique, suggestion ou correction médicale : la page Contact vous indique le meilleur canal.</p><Link className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white no-underline hover:bg-[var(--primary-hover)]" href="/contact">Nous contacter <ArrowRight aria-hidden="true" size={17} /></Link></section>
      </main>
    </>
  );
}
