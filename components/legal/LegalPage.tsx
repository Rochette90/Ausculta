import { BRAND_LEGAL, isLegalPlaceholder } from "@/lib/brand";

const updatedOn = new Intl.DateTimeFormat("fr-CH", { dateStyle: "long", timeZone: "Europe/Zurich" }).format(new Date(`${BRAND_LEGAL.updatedOn}T12:00:00Z`));

/** Valeur d'identité légale ; un espace réservé non complété est mis en évidence. */
export function LegalValue({ value }: { value: string }) {
  return isLegalPlaceholder(value) ? <mark className="legal-placeholder">{value}</mark> : <>{value}</>;
}

export function LegalPage({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <main>
      <header className="mk-head mk-wrap">
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        <p className="legal-meta">Dernière mise à jour : {updatedOn}.</p>
      </header>
      <section className="mk-section">
        <div className="mk-wrap">
          <div className="mk-prose legal-prose">{children}</div>
        </div>
      </section>
    </main>
  );
}
