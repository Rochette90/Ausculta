import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { drawMockExam, mockExamTypes, playedMockCodes } from "@/lib/ecos/mock-exam";
import { EXAM_DURATION_SECONDS } from "@/lib/ecos/timing";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Examen blanc") };

/** Présentation de l'examen blanc et tirage du circuit (un nouveau à chaque visite). */
export default async function MockExamPage() {
  const user = await requireUser("/examen-blanc");
  const plan = drawMockExam(await playedMockCodes(user.id));
  const types = mockExamTypes();
  const minutes = Math.round(EXAM_DURATION_SECONDS / 60);
  return (
    <main className="learning-page">
      <header className="learning-page-head">
        <h1>Examen blanc</h1>
        <p className="dash-greeting voice">L’ECOS de 3ᵉ année, d’une traite.</p>
        <p>{types.length} stations, une par type, tirées au sort parmi des patients réservés à l’examen blanc, que tu ne croises jamais à l’entraînement. Chacune en conditions d’examen ({minutes} minutes), sans bilan entre deux stations, comme le jour J. Ton bilan global t’attend à la fin.</p>
      </header>
      <section className="mock-intro">
        <ol className="mock-types">
          {types.map((type, index) => <li key={type.id}><span>{index + 1}</span>{type.label}</li>)}
        </ol>
        <dl className="mock-facts">
          <div><dt>Durée</dt><dd>Environ {types.length * minutes + types.length * 2} minutes</dd></div>
          <div><dt>Conditions</dt><dd>Chronomètre, signal à 2 minutes, aucun indice</dd></div>
          <div><dt>À la fin</dt><dd>Score par type, points forts, réflexes à travailler</dd></div>
        </dl>
        <p className="mock-note">Le BLS se travaille en binôme avec sa grille. Tu peux quitter le circuit entre deux stations ; les stations terminées restent dans Mes bilans.</p>
        <Link className="button primary" href={`/examen-blanc/station?plan=${plan.join(",")}&step=0`}>Commencer l’examen blanc</Link>
      </section>
    </main>
  );
}
