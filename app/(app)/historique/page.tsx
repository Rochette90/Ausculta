import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { getStationHistory } from "@/lib/ecos/history";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Mes bilans") };

const dateFormat = new Intl.DateTimeFormat("fr-CH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich" });

export default async function HistoryPage() {
  const user = await requireUser("/historique");
  const entries = await getStationHistory(user.id);
  const stations = new Set(entries.map((entry) => entry.code)).size;
  const average = entries.length ? Math.round(entries.reduce((sum, entry) => sum + entry.percent, 0) / entries.length) : 0;
  return (
    <main className="learning-page">
      <header className="learning-page-head">
        <h1>Mes bilans</h1>
        <p className="dash-greeting voice">{entries.length ? `${entries.length} passage${entries.length > 1 ? "s" : ""}, ${stations} station${stations > 1 ? "s" : ""} différente${stations > 1 ? "s" : ""}.` : "Aucun bilan pour l’instant."}</p>
        <p>Rouvre une grille, ton entretien annoté et le débriefing, et suis ta progression quand tu rejoues une station.</p>
      </header>
      {entries.length === 0 ? (
        <div className="learning-empty">
          <h2>Ton premier bilan t’attend</h2>
          <p>Termine une station : son bilan sera conservé ici.</p>
          <Link className="button primary" href="/cas">Choisir une station</Link>
        </div>
      ) : (
        <>
          <dl className="dash-stats history-stats">
            <div><dt>Passages</dt><dd>{entries.length}</dd></div>
            <div><dt>Stations différentes</dt><dd>{stations}</dd></div>
            <div><dt>Score moyen</dt><dd>{average}<small>%</small></dd></div>
          </dl>
          <ol className="history-list">
            {entries.map((entry) => (
              <li key={entry.sessionId}>
                <Link href={`/historique/${entry.sessionId}`}>
                  <span className="history-code">{entry.code.startsWith("blanc-") ? "EB" : entry.code.replace(/^station-/, "")}</span>
                  <span className="history-main">
                    <strong>{entry.doorNote}</strong>
                    <small>
                      <time dateTime={entry.completedAt}>{dateFormat.format(new Date(entry.completedAt))}</time>
                      {" · "}{entry.code.startsWith("blanc-") ? "Examen blanc" : entry.mode === "exam" ? "Examen" : "Entraînement"}
                      {entry.attempt > 1 ? ` · ${entry.attempt}ᵉ passage` : ""}
                      {entry.diagnosisRight === null ? " · sans diagnostic" : entry.diagnosisRight ? " · diagnostic juste" : " · diagnostic manqué"}
                    </small>
                  </span>
                  <span className="history-score">
                    <b>{entry.score}<small>/{entry.maxScore}</small></b>
                    {entry.delta !== null && entry.delta !== 0 && <em className={entry.delta > 0 ? "is-up" : "is-down"}>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</em>}
                  </span>
                  <span className="history-bar" aria-hidden="true"><span style={{ width: `${entry.percent}%` }} /></span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
