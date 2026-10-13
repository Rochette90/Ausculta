import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/require-user";
import { BRAND_NAME, pageTitle } from "@/lib/brand";
import { EXAM_DURATION_SECONDS } from "@/lib/ecos/timing";

export const metadata: Metadata = {
  title: pageTitle("La méthode"),
  description: `Découvrez comment se déroule une station ECOS sur ${BRAND_NAME} : anamnèse avec un patient simulé, examen clinique, synthèse et débriefing.`,
};
export const dynamic = "force-dynamic";

const examMinutes = Math.round(EXAM_DURATION_SECONDS / 60);

const details = [
  {
    id: "anamnese",
    label: "Anamnèse",
    title: "Une anamnèse face à un patient qui répond vraiment",
    description: "Vous menez l’entretien comme en consultation : le patient simulé répond à vos questions, une par une.",
    points: ["Entretien au clavier ou à la voix, selon votre navigateur", "Le patient répond à vos questions, sans souffler le diagnostic", "Un symptôme absent du cas est nié, comme le ferait un vrai patient", "Urgences ou cabinet : la consigne s’adapte au lieu de la station"],
    note: "L’adresse d’une station ne révèle jamais le diagnostic : c’est à vous de le construire par vos questions.",
  },
  {
    id: "examen",
    label: "Examen clinique",
    title: "Un examen clinique où chaque geste compte",
    description: "Vous annoncez l’examen, puis vous choisissez ce que vous relevez, examinez et demandez.",
    points: ["Paramètres, examen physique et examens complémentaires", "Chaque geste choisi débloque son résultat", "Des gestes attendus et des gestes peu utiles sont proposés", "Les résultats sont donnés par un examinateur, distinct du patient"],
    note: "Un geste peu utile coûte un demi-point : l’objectif est de cibler, pas de tout demander.",
  },
  {
    id: "synthese",
    label: "Synthèse",
    title: "Une synthèse qui vous oblige à trancher",
    description: "Une fois l’entretien et l’examen terminés, vous concluez comme devant l’examinateur.",
    points: ["Votre diagnostic et vos différentiels, cherchés dans une liste sans aucune proposition", "Une prise en charge à rédiger avec vos mots", "L’entretien et l’examen sont fermés avant de conclure", `En mode examen, ${examMinutes} minutes pour toute la station`],
    note: "En mode examen, ni indice ni score ne s’affichent avant la fin.",
  },
  {
    id: "debriefing",
    label: "Débriefing",
    title: "Un débriefing qui vous dit quoi retravailler",
    description: "Après la correction, vous voyez précisément ce qui a été fait, oublié ou superflu.",
    points: ["Une grille sur 22 points : 20 pour la station, 2 pour le diagnostic", "Les gestes attendus oubliés et les gestes peu utiles", "Éléments clés, drapeaux rouges et diagnostics différentiels", "La prise en charge attendue, avec ses sources"],
    note: "La grille repère des thèmes dans vos réponses : c’est un outil d’entraînement, pas une évaluation clinique validée.",
  },
];

export default async function MethodPage() {
  const user = await getCurrentUser();
  const startHref = user ? "/cas" : "/signup?next=%2Fcas";

  return (
    <main>
      <header className="mk-head mk-wrap">
        <h1>Une station ECOS, du premier mot au débriefing.</h1>
        <p className="lead">{BRAND_NAME} reproduit le déroulé d’une station : vous écoutez le patient, vous l’examinez, vous concluez, puis vous voyez ce qui vous a échappé.</p>
        <div className="mk-head-actions">
          <Link className="button primary" href={startHref}>{user ? "Choisir une station" : "Commencer gratuitement"}</Link>
          <Link className="text-link" href="#modes">Les deux modes</Link>
        </div>
      </header>

      <section className="mk-section is-surface" aria-label="Les quatre temps d’une station">
        <div className="mk-wrap mk-stack">
          {details.map((detail) => (
            <article className="method-phase script-line" id={detail.id} key={detail.id}>
              <span className="script-who is-accent">{detail.label}</span>
              <div>
                <h2>{detail.title}</h2>
                <p className="lead">{detail.description}</p>
                <ul className="method-points">{detail.points.map((point) => <li key={point}>{point}</li>)}</ul>
                <p className="method-note"><strong>À retenir : </strong>{detail.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mk-section mk-wrap" id="modes" aria-labelledby="modes-title">
        <div className="script-line">
          <span className="script-who">Deux modes</span>
          <div>
            <h2 id="modes-title">S’entraîner, puis se tester.</h2>
            <p className="lead">Commencez en mode entraînement pour prendre vos repères, puis passez en mode examen pour retrouver la pression du chronomètre.</p>
            <div className="modes">
              <article className="mode-card">
                <h3>Entraînement</h3>
                <p>Sans chronomètre. Le bilan détaillé arrive à la fin, comme à l’examen.</p>
                <span className="mode-time is-free" aria-hidden="true">--:--</span>
              </article>
              <article className="mode-card is-timed">
                <h3>Examen</h3>
                <p>Chronométré, sans indice ni score avant la fin.</p>
                <span className="mode-time">{examMinutes}:00</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-end" aria-labelledby="method-end-title">
        <div className="mk-wrap">
          <h2 id="method-end-title">Commencez par une station, puis laissez le débriefing guider la suivante.</h2>
          <Link className="button primary" href={startHref}>{user ? "Choisir une station" : "Créer mon espace gratuit"}</Link>
        </div>
      </section>
    </main>
  );
}
