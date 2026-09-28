import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Bug, Building2, Mail, MessageCircleQuestion } from "lucide-react";
import { ContactForm } from "@/components/marketing/ContactForm";
import { BRAND_EMAIL_FROM, BRAND_NAME, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Contact"),
  description: `Contactez l’équipe ${BRAND_NAME} pour une question, un problème technique, une correction médicale ou un partenariat.`,
};
export const dynamic = "force-dynamic";

const reasons = [
  { icon: Bug, title: "Problème technique", text: "Décrivez la page, l’action réalisée et le message affiché." },
  { icon: BookOpenCheck, title: "Contenu médical", text: "Indiquez la fiche ou la question concernée et la correction proposée." },
  { icon: Building2, title: "Faculté ou partenariat", text: "Présentez votre institution, votre projet et la forme de collaboration souhaitée." },
];

export default async function ContactPage() {

  return (
    <>
      <main>
        <section className="mx-auto w-[calc(100%-2rem)] max-w-[1120px] pb-12 pt-20 sm:pb-16 sm:pt-28">
          <p className="eyebrow">CONTACT</p>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><h1 className="mb-0 mt-3 max-w-4xl text-balance">Une question, une idée ou une <span>correction à partager ?</span></h1><p className="mb-0 mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Nous lisons les retours des étudiants, relecteurs et partenaires pour améliorer la plateforme et son contenu.</p></div>
            <a className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3 font-bold text-[var(--ink)] no-underline shadow-[var(--shadow-sm)] hover:border-[var(--primary)]" href={`mailto:${BRAND_EMAIL_FROM}`}><Mail aria-hidden="true" className="text-[var(--primary)]" size={19} /> {BRAND_EMAIL_FROM}</a>
          </div>
        </section>

        <section className="mx-auto grid w-[calc(100%-2rem)] max-w-[1120px] gap-6 pb-20 sm:pb-28 lg:grid-cols-[.78fr_1.22fr]">
          <aside className="grid content-start gap-4">
            {reasons.map((reason) => { const Icon = reason.icon; return <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6" key={reason.title}><span className="grid size-10 place-items-center rounded-xl bg-[var(--mint)] text-[var(--mint-dark)]"><Icon aria-hidden="true" size={19} /></span><h2 className="mb-2 mt-5 text-xl">{reason.title}</h2><p className="m-0 text-sm leading-6 text-[var(--muted)]">{reason.text}</p></article>; })}
            <div className="rounded-2xl bg-[var(--surface-dark)] p-6 text-slate-300"><MessageCircleQuestion aria-hidden="true" className="text-teal-300" size={22} /><h2 className="mb-2 mt-5 text-xl text-white">Avant d’écrire</h2><p className="m-0 text-sm leading-6">La réponse se trouve peut-être déjà dans les questions fréquentes.</p><Link className="mt-5 inline-flex font-bold text-teal-300 no-underline hover:text-teal-200" href="/faq">Consulter la FAQ →</Link></div>
          </aside>
          <ContactForm />
        </section>
      </main>
    </>
  );
}
