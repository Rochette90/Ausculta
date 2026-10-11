import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle, Plus } from "lucide-react";
import { BRAND_NAME, BRAND_PLAN_LABEL, pageTitle } from "@/lib/brand";
import { EXAM_DURATION_SECONDS } from "@/lib/ecos/timing";
import { FEATURES, type FeatureKey } from "@/lib/features";

const examMinutes = Math.round(EXAM_DURATION_SECONDS / 60);

export const metadata: Metadata = {
  title: pageTitle("Questions fréquentes"),
  description: `Réponses aux questions fréquentes sur les stations ECOS, le patient simulé, la notation, les comptes et les tarifs ${BRAND_NAME}.`,
};
export const dynamic = "force-dynamic";

type FaqItem = { question: string; answer: string; feature?: FeatureKey };

// Une question liée à un module masqué (lib/features.ts) n'est pas affichée.
const allFaqGroups: Array<{ title: string; questions: FaqItem[] }> = [
  {
    title: `Utiliser ${BRAND_NAME}`,
    questions: [
      { question: `À qui s’adresse ${BRAND_NAME} ?`, answer: `${BRAND_NAME} est conçu en priorité pour les étudiantes et étudiants en médecine en Suisse qui préparent leurs ECOS et veulent entraîner leur raisonnement clinique face à un patient.` },
      { question: "Comment commencer ?", answer: "Créez un compte gratuit, choisissez une station et lancez-la en mode entraînement. Votre tableau de bord enregistre ensuite les stations terminées et vous aide à garder un rythme régulier." },
      { question: `Puis-je utiliser ${BRAND_NAME} sur mobile ?`, answer: "Oui. Les stations sont adaptées aux petits écrans, pour s’entraîner entre deux cours ou pendant un trajet." },
      { question: "Quelle routine recommandez-vous ?", answer: `Une station à la fois : d’abord en mode entraînement pour prendre vos repères, puis en mode examen (${examMinutes} minutes) pour retrouver les conditions réelles. La régularité compte davantage qu’une longue session isolée.` },
    ],
  },
  {
    title: "Les stations ECOS",
    questions: [
      { question: "Comment se déroule une station ?", answer: "En trois temps : l’anamnèse avec le patient simulé, l’examen clinique où vous choisissez vos gestes et vos examens complémentaires, puis la synthèse avec un diagnostic à retenir et une prise en charge à rédiger. Vous recevez ensuite votre grille corrigée et un débriefing." },
      { question: "Puis-je parler au patient à voix haute ?", answer: "Oui, si votre navigateur le permet : Chrome, Edge et Safari prennent en charge le micro et la réponse orale du patient. Le clavier reste disponible à tout moment, et tout l’échange est affiché à l’écran." },
      { question: "Quelle différence entre entraînement et examen ?", answer: `Le mode entraînement n’a pas de chronomètre. Le mode examen dure ${examMinutes} minutes pour toute la station. Dans les deux cas, comme à l’examen, la grille et le score n’apparaissent qu’au bilan, avec un retour sur ta communication.` },
      { question: "Comment la station est-elle notée ?", answer: "Chaque station est notée sur 22 points : 20 pour la grille et 2 pour le diagnostic. La grille repère des thèmes dans vos questions et vos réponses : c’est un outil d’entraînement, pas une évaluation clinique validée." },
    ],
  },
  {
    title: "Contenu médical",
    questions: [
      { question: "D’où vient le contenu des stations ?", answer: "Chaque station est une synthèse pédagogique construite à partir de sources citées dans son débriefing. La validation médicale signée des stations est en cours : signalez-nous toute erreur depuis la page Contact." },
      { question: "Que contient une fiche de pathologie ?", answer: "Les fiches couvrent les repères utiles au raisonnement : définition, facteurs de risque, signes cliniques, examens, diagnostics différentiels, traitement, suivi et situations urgentes.", feature: "fiches" },
      { question: "Comment les fiches sont-elles validées ?", answer: "Chaque fiche suit un statut éditorial. Une modification la replace à réviser ; la personne qui effectue la validation finale signe ensuite la fiche à son nom.", feature: "fiches" },
      { question: "Les corrections des QCM sont-elles expliquées ?", answer: `Oui. Après la réponse, ${BRAND_NAME} affiche l’option correcte et une explication pédagogique afin de comprendre le raisonnement attendu, pas seulement mémoriser une lettre.`, feature: "quiz" },
      // Affichée tant que le catalogue de fiches est masqué.
      ...(FEATURES.fiches ? [] : [{ question: "Les fiches et les QCM sont-ils disponibles ?", answer: `Pas encore dans leur ensemble. ${BRAND_NAME} se concentre d’abord sur les stations ECOS ; le débriefing d’une station donne déjà accès aux fiches à revoir. Le catalogue complet de fiches et les QCM arriveront ensuite.` }]),
      { question: "Le contenu remplace-t-il les recommandations officielles ?", answer: `Non. ${BRAND_NAME} est un outil pédagogique d’entraînement. Il ne remplace ni les recommandations institutionnelles à jour, ni l’enseignement de votre faculté, ni un avis médical.` },
    ],
  },
  {
    title: "Compte, progression et tarifs",
    questions: [
      { question: "Ma progression est-elle sauvegardée ?", answer: "Oui. Lorsque vous êtes connecté, vos activités, XP, scores et série quotidienne sont associés à votre compte et restent disponibles sur vos différents appareils." },
      { question: `${BRAND_NAME} est-il gratuit ?`, answer: `Oui, la plateforme est actuellement accessible gratuitement. Une formule ${BRAND_PLAN_LABEL} plus complète est prévue, mais elle n’est pas encore disponible à l’achat.` },
      { question: "Que se passe-t-il si je change de formule plus tard ?", answer: "Votre compte et votre progression resteront enregistrés. Le changement de formule n’effacera pas l’historique de vos activités." },
      { question: "Comment signaler une erreur ?", answer: "Écrivez-nous depuis la page Contact en indiquant la station ou la fiche concernée et la correction proposée. Sur une fiche, vous pouvez aussi sélectionner le passage puis utiliser l’outil de signalement." },
    ],
  },
];
const faqGroups = allFaqGroups.map((group) => ({
  ...group,
  questions: group.questions.filter((item) => !item.feature || FEATURES[item.feature]),
}));

export default async function FaqPage() {

  return (
    <>
      <main>
        <section className="mx-auto w-[calc(100%-2rem)] max-w-[900px] pb-14 pt-20 text-center sm:pb-20 sm:pt-28">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--mint)] text-[var(--mint-dark)]"><HelpCircle aria-hidden="true" size={27} /></span>
          <p className="eyebrow mt-7">QUESTIONS FRÉQUENTES</p>
          <h1 className="mb-0 mt-3 text-balance">Tout ce qu’il faut savoir pour <span>bien démarrer.</span></h1>
          <p className="mx-auto mb-0 mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Déroulé des stations, mode vocal, notation, progression et tarifs : retrouvez ici les réponses essentielles.</p>
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
