"use client";

import { FormEvent, useState, useTransition } from "react";
import { submitEcosFeedback } from "@/app/actions/ecos-feedback";
import { ECOS_FEEDBACK_CATEGORIES, type EcosFeedbackCategory } from "@/lib/ecos/feedback";

const RATING_LABELS = ["", "Très décevante", "Décevante", "Correcte", "Bonne", "Excellente"];

/** Avis de fin de station : rattaché à la session, donc au transcript complet. */
export function StationFeedback({ sessionId }: { sessionId: string }) {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<EcosFeedbackCategory>("patient");
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!rating) return setError("Choisis une note de 1 à 5.");
    setError("");
    startTransition(async () => {
      const result = await submitEcosFeedback({ sessionId, rating, category, comment });
      if (result.success) setSent(true);
      else setError(result.error ?? "L’avis n’a pas pu être enregistré.");
    });
  }

  if (sent) {
    return <section className="ecos-debrief station-feedback" aria-live="polite"><h2>Merci pour ton avis</h2><p>Il est relu avec le transcript de ta station pour l’améliorer.</p><button className="button quiet small" onClick={() => setSent(false)} type="button">Modifier mon avis</button></section>;
  }

  return (
    <section className="ecos-debrief station-feedback" aria-labelledby="station-feedback-title">
      <h2 id="station-feedback-title">Ton avis sur cette station</h2>
      <p>Patient incohérent, correction injuste, bug ? Dis-le : c’est ce qui fait progresser les stations.</p>
      <form onSubmit={submit}>
        <fieldset className="station-feedback-rating">
          <legend>Note globale</legend>
          {[1, 2, 3, 4, 5].map((value) => (
            <label className={value <= rating ? "is-on" : ""} key={value} title={RATING_LABELS[value]}>
              <input checked={rating === value} name="rating" onChange={() => setRating(value)} type="radio" value={value} />
              <span aria-hidden="true">★</span>
              <span className="sr-only">{value} sur 5 : {RATING_LABELS[value]}</span>
            </label>
          ))}
          {rating > 0 && <span className="station-feedback-hint">{RATING_LABELS[rating]}</span>}
        </fieldset>
        <label className="station-feedback-field">
          <span>Ça concerne surtout</span>
          <select onChange={(event) => setCategory(event.target.value as EcosFeedbackCategory)} value={category}>
            {ECOS_FEEDBACK_CATEGORIES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label className="station-feedback-field">
          <span>Commentaire (facultatif)</span>
          <textarea maxLength={2000} onChange={(event) => setComment(event.target.value)} placeholder="Ex. : le patient n’a pas compris ma question sur les allergies." rows={3} value={comment} />
        </label>
        {error && <p className="station-feedback-error" role="alert">{error}</p>}
        <button className="button secondary small" disabled={pending} type="submit">{pending ? "Envoi…" : "Envoyer mon avis"}</button>
      </form>
    </section>
  );
}
