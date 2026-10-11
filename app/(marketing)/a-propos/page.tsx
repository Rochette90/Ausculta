import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/require-user";
import { BRAND_NAME, pageTitle } from "@/lib/brand";

export const metadata: Metadata = {
  title: pageTitle("À propos"),
  description: `Découvrez la mission de ${BRAND_NAME} : rendre l’entraînement aux ECOS accessible, exigeant et régulier.`,
};
export const dynamic = "force-dynamic";

const values = [
  { title: "Clarté", text: "Un déroulé lisible : on sait à chaque instant où l’on en est dans la station." },
  { title: "Raisonnement", text: "Entraîner la décision clinique, pas seulement la mémorisation isolée." },
  { title: "Transparence", text: "Citer les sources de chaque station et dire ce qui reste à valider." },
];

export default async function AboutPage() {
  const user = await getCurrentUser();
  const startHref = user ? "/dashboard" : "/signup?next=%2Fcas";
  return (
    <main>
      <header className="mk-head mk-wrap">
        <h1>Construire le pont entre ce que l’on apprend et ce que l’on doit décider.</h1>
        <p className="lead">{BRAND_NAME} est un projet d’entraînement clinique pensé en Suisse : des stations ECOS avec patient simulé, pour s’exercer à écouter, examiner et conclure avant le jour de l’examen.</p>
      </header>

      <section className="mk-section is-surface" aria-label="Le projet">
        <div className="mk-wrap mk-stack">
          <div className="script-line">
            <span className="script-who is-accent">Le point de départ</span>
            <div className="mk-prose">
              <p className="mk-statement voice">Les connaissances sont là. L’entraînement à la consultation manque.</p>
              <p>On révise beaucoup la théorie, mais on s’entraîne rarement à mener une consultation de bout en bout, faute de patient et d’examinateur disponibles. {BRAND_NAME} rend cet entraînement possible à tout moment, avec une grille et un débriefing.</p>
              <p><Link className="text-link" href="/methode">Voir comment se déroule une station</Link></p>
            </div>
          </div>

          <div className="script-line">
            <span className="script-who is-accent">Nos principes</span>
            <dl className="values">
              {values.map((value) => <div key={value.title}><dt>{value.title}</dt><dd>{value.text}</dd></div>)}
            </dl>
          </div>

          <div className="script-line">
            <span className="script-who is-accent">La direction</span>
            <div className="mk-prose">
              <p className="mk-statement voice">Un partenaire d’entraînement quotidien, pas une bibliothèque de plus.</p>
              <p>Chaque évolution doit aider à choisir la prochaine activité, comprendre une erreur ou consolider une compétence clinique.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-end" aria-labelledby="about-end-title">
        <div className="mk-wrap">
          <h2 id="about-end-title">Testez {BRAND_NAME} et dites-nous ce qui vous ferait vraiment progresser.</h2>
          <div className="mk-head-actions">
            <Link className="button primary" href={startHref}>Commencer gratuitement</Link>
            <Link className="text-link" href="/contact">Échanger avec nous</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
