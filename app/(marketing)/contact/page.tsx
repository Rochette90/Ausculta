import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/marketing/ContactForm";
import { BRAND_EMAIL_FROM, BRAND_NAME, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Contact"),
  description: `Contactez l’équipe ${BRAND_NAME} pour une question, un problème technique, une correction médicale ou un partenariat.`,
};
export const dynamic = "force-dynamic";

const reasons = [
  { title: "Problème technique", text: "Décrivez la page, l’action réalisée et le message affiché." },
  { title: "Contenu médical", text: "Indiquez la station ou la fiche concernée et la correction proposée." },
  { title: "Faculté ou partenariat", text: "Présentez votre institution, votre projet et la forme de collaboration souhaitée." },
];

export default async function ContactPage() {
  return (
    <main>
      <header className="mk-head mk-wrap">
        <h1>Une question, une idée ou une correction à partager ?</h1>
        <p className="lead">Nous lisons les retours des étudiants, relecteurs et partenaires pour améliorer la plateforme et son contenu.</p>
      </header>

      <section className="mk-section" aria-label="Nous écrire">
        <div className="mk-wrap contact-grid">
          <aside className="contact-aside">
            <dl className="contact-reasons">
              {reasons.map((reason) => <div key={reason.title}><dt>{reason.title}</dt><dd>{reason.text}</dd></div>)}
            </dl>
            <p>Par e-mail : <a className="text-link" href={`mailto:${BRAND_EMAIL_FROM}`}>{BRAND_EMAIL_FROM}</a></p>
            <p>La réponse se trouve peut-être déjà dans les <Link className="text-link" href="/faq">questions fréquentes</Link>.</p>
          </aside>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
