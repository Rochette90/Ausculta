/**
 * Silence après le dernier mot perçu avant d'envoyer la question dictée.
 * Le navigateur valide une phrase dès une courte pause (≈ 0,5 s) : envoyer à
 * ce moment-là coupait l'étudiant au milieu d'une hésitation.
 */
export const SPEECH_END_SILENCE_MS = 1_600;

/**
 * Assemble les morceaux reconnus en une seule phrase. Chrome sur Android
 * répète parfois tout le début de la phrase dans chaque nouveau résultat :
 * un morceau qui reprend le texte déjà entendu le remplace au lieu de s'y
 * ajouter.
 */
export function joinTranscripts(parts: readonly string[]) {
  let text = "";
  for (const raw of parts) {
    const part = raw.trim().replace(/\s+/g, " ");
    if (!part) continue;
    if (text && part.toLocaleLowerCase("fr").startsWith(text.toLocaleLowerCase("fr"))) text = part;
    else text = text ? `${text} ${part}` : part;
  }
  return text;
}

/**
 * Transcription serveur : fin de la question après ce silence. Plus court que
 * pour la dictée du navigateur : notre propre détection ne valide rien à la
 * première pause, et l'audio part déjà en transcription dès SPEECH_PAUSE_MS.
 */
export const SERVER_SPEECH_END_SILENCE_MS = 1_100;

/** Pause après laquelle l'enregistrement part en transcription par anticipation. */
export const SPEECH_PAUSE_MS = 450;
