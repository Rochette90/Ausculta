import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getMockExamResults, parseMockSessions } from "@/lib/ecos/mock-exam";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Bilan d’examen blanc") };

type PageProps = { searchParams: Promise<{ sessions?: string }> };

/** Bilan global du circuit : uniquement les stations terminées de ce compte. */
export default async function MockExamReportPage({ searchParams }: PageProps) {
  const user = await requireUser("/examen-blanc");
  const results = await getMockExamResults(user.id, parseMockSessions((await searchParams).sessions));
  if (!results) notFound();
  return (
    <main className="learning-page">
      <header className="mock-report-head">
        <div>
          <p className="briefing-meta">Examen blanc terminé · {results.stations.length} station{results.stations.length > 1 ? "s" : ""}</p>
          <h1>{results.percent >= 70 ? "Prêt·e pour le jour J ?" : results.percent >= 50 ? "Une bonne base, des stations à reprendre." : "Un examen blanc à retravailler."}</h1>
          <p className="lead">{results.diagnoses} diagnostic{results.diagnoses > 1 ? "s" : ""} juste{results.diagnoses > 1 ? "s" : ""} sur {results.stations.length}.{results.strongest && results.weakest && results.strongest.type !== results.weakest.type ? ` Point fort : ${results.strongest.type.toLocaleLowerCase("fr")} (${results.strongest.percent} %). À reprendre : ${results.weakest.type.toLocaleLowerCase("fr")} (${results.weakest.percent} %).` : ""}</p>
        </div>
        <div className="score-card is-ready">
          <p className="score"><strong>{results.percent}</strong><span>% des points</span></p>
        </div>
      </header>

      <section className="learning-section" aria-labelledby="mock-stations-title">
        <div className="learning-section-head"><h2 id="mock-stations-title">Station par station</h2></div>
        <ol className="history-list">
          {results.stations.map((station, index) => (
            <li key={station.sessionId}>
              <Link href={`/historique/${station.sessionId}`}>
                <span className="history-code">{index + 1}</span>
                <span className="history-main">
                  <strong>{station.type}</strong>
                  <small>{station.doorNote}{station.diagnosisRight ? " · diagnostic juste" : " · diagnostic manqué"}</small>
                </span>
                <span className="history-score"><b>{station.percent}<small> %</small></b></span>
                <span className="history-bar" aria-hidden="true"><span style={{ width: `${station.percent}%` }} /></span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {results.reflexesToWork.length > 0 && (
        <section className="learning-section" aria-labelledby="mock-reflexes-title">
          <div className="learning-section-head"><h2 id="mock-reflexes-title">Réflexes à travailler</h2></div>
          <ol className="reflex-focus">
            {results.reflexesToWork.map((stat) => (
              <li key={stat.id}><div><strong>{stat.label}</strong><span>{stat.done}/{stat.total}</span></div><p>{stat.tip}</p></li>
            ))}
          </ol>
        </section>
      )}

      <div className="mock-actions">
        <Link className="button primary" href="/examen-blanc">Nouvel examen blanc</Link>
        <Link className="button secondary" href="/historique">Mes bilans</Link>
      </div>
    </main>
  );
}
