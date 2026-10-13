import { EXAMINER_PREFIX, PROCEDURE_PREFIX } from "@/lib/ecos/text";
import type { EcosMessage } from "@/lib/ecos/types";
import type { EcosCommunicationReport, QuestionKind } from "@/lib/ecos/communication";
import { BRAND_NAME } from "@/lib/brand";

/** Examiner results and gestures are stored with a prefix; show them with their own label. */
export function messageView(message: EcosMessage) {
  if (message.role === "patient" && message.content.startsWith(EXAMINER_PREFIX)) {
    return { label: "Examinateur", className: "message examiner", text: message.content.slice(EXAMINER_PREFIX.length) };
  }
  if (message.role === "student" && message.content.startsWith(PROCEDURE_PREFIX)) {
    return { label: "Geste", className: "message student procedure", text: message.content.slice(PROCEDURE_PREFIX.length) };
  }
  const label = message.role === "patient" ? "Patient" : message.role === "student" ? "Vous" : BRAND_NAME;
  return { label, className: `message ${message.role}`, text: message.content };
}

export function DebriefList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="ecos-debrief-block">
      <h3>{title}</h3>
      <ul>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
    </div>
  );
}

const QUESTION_KINDS: ReadonlyArray<{ kind: QuestionKind; label: string }> = [
  { kind: "open", label: "Ouvertes" },
  { kind: "targeted", label: "Ciblées" },
  { kind: "closed", label: "Fermées" },
];

const BEHAVIOURS: ReadonlyArray<{ key: keyof EcosCommunicationReport["behaviours"]; label: string }> = [
  { key: "empathy", label: "Accueille l’émotion du patient" },
  { key: "concerns", label: "Explore ses inquiétudes et ses attentes" },
  { key: "summary", label: "Résume ce que le patient a dit" },
  { key: "understanding", label: "Vérifie la compréhension, invite aux questions" },
];

const FIRST_QUESTION_NOTE: Record<QuestionKind, string> = {
  open: "Entretien ouvert par une question ouverte.",
  targeted: "Première question : ciblée. Commence plutôt par une question ouverte.",
  closed: "Première question : fermée. Commence plutôt par une question ouverte.",
};

/** Bilan de communication : types de questions, attitudes, jargon et conseils. */
export function CommunicationReport({ report }: { report: EcosCommunicationReport }) {
  const total = QUESTION_KINDS.reduce((sum, { kind }) => sum + report.questions[kind], 0);
  const notes = [
    report.firstQuestion ? FIRST_QUESTION_NOTE[report.firstQuestion] : "",
    report.stacked.count ? `${report.stacked.count} message${report.stacked.count > 1 ? "s" : ""} avec plusieurs questions à la fois.` : "",
  ].filter(Boolean).join(" ");
  return (
    <section className="ecos-debrief communication-report" aria-labelledby="communication-title">
      <h2 id="communication-title">Ta façon de mener l’entretien</h2>
      {total > 0 && (
        <div className="question-mix">
          <div className="question-bar" aria-hidden="true">
            {QUESTION_KINDS.filter(({ kind }) => report.questions[kind] > 0).map(({ kind }) => <span className={`is-${kind}`} key={kind} style={{ flexGrow: report.questions[kind] }} />)}
          </div>
          <ul className="question-legend">
            {QUESTION_KINDS.map(({ kind, label }) => <li key={kind}><span className={`question-dot is-${kind}`} aria-hidden="true" />{label} <strong>{report.questions[kind]}</strong></li>)}
          </ul>
          {notes && <p className="question-note">{notes}</p>}
        </div>
      )}
      <div className="ecos-debrief-grid">
        <div className="ecos-debrief-block">
          <h3>Attitudes repérées</h3>
          <ul className="behaviour-list">
            {BEHAVIOURS.map(({ key, label }) => (
              <li className={report.behaviours[key] ? "is-done" : ""} key={key}>
                <span aria-hidden="true">{report.behaviours[key] ? "✓" : "·"}</span>{label}
                <span className="sr-only">{report.behaviours[key] ? " : repéré" : " : non repéré"}</span>
              </li>
            ))}
          </ul>
        </div>
        <DebriefList title="Pour la prochaine station" items={report.tips} />
        {report.jargon.length > 0 && (
          <div className="ecos-debrief-block">
            <h3>Jargon à traduire</h3>
            <ul>{report.jargon.map((item) => <li key={item.term}><strong>{item.term}</strong> → {item.plain}</li>)}</ul>
          </div>
        )}
        <DebriefList title="Questions posées à la chaîne" items={report.stacked.examples} />
      </div>
      <p className="communication-note">Repérage automatique de tes formulations : un repère pour progresser, sans effet sur la note.</p>
    </section>
  );
}
