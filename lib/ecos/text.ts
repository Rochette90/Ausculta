/** Prefix of replies given by the examiner (exam findings, results). */
export const EXAMINER_PREFIX = "Examinateur : ";
/** Student messages recorded by the structured phases of the station. */
export const PROCEDURE_PREFIX = "Geste : ";
export const DIAGNOSIS_PREFIX = "Diagnostic retenu : ";
export const PLAN_PREFIX = "Prise en charge proposée : ";
/** Lecture écrite des examens complémentaires (stations avec une étape d'analyse). */
export const ANALYSIS_PREFIX = "Analyse des examens : ";
/** Réponses aux relances de l'examinateur en fin de station (`lib/ecos/follow-ups.ts`) : hors notation. */
export const FOLLOW_UP_PREFIX = "Réponse à l’examinateur (";
/** Diagnostics différentiels choisis dans la liste en fin de station (`lib/ecos/differentials.ts`) : hors notation. */
export const DIFFERENTIALS_PREFIX = "Diagnostics différentiels : ";
/** Explication orale ou écrite au patient en fin de station (`lib/ecos/announcement.ts`) : hors notation. */
export const ANNOUNCE_PREFIX = "Annonce au patient : ";
/** System line recorded when the synthesis opens: history and exam are then closed. */
export const SYNTHESIS_MARKER = "Synthèse ouverte : anamnèse et examen clinique terminés.";
/** Examiner answer when a gesture is requested in the chat instead of the exam list. */
export const EXAM_LIST_REDIRECT = "Choisis ce geste ou cet examen dans la liste de l’examen clinique : c’est là qu’il débloque son résultat.";

/** Phrases by which the student announces the clinical examination. */
const EXAM_TRANSITION_KEYWORDS = [
  "passer a l examen", "on passe a l examen", "passons a l examen", "je passe a l examen", "passe a l examen clinique",
  "je vais vous examiner", "je vais maintenant vous examiner", "je vais passer a l examen", "puis je vous examiner",
  "est ce que je peux vous examiner", "place a l examen", "debuter l examen clinique", "commencer l examen clinique",
];

/** Lower-case, accent-free, punctuation-free text with single spaces. */
export function normalizeEcosText(value: string): string {
  return ` ${value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

/**
 * True when `keyword` starts a word of the normalised text. Keywords are
 * prefixes (`irrad` matches « irradie ») but never match inside a word, so
 * `tension` does not match « hypertension ». A trailing `$` asks for a whole
 * word: `cou$` matches « cou » but not « coucher ».
 */
export function hasKeyword(normalizedText: string, keyword: string): boolean {
  const wholeWord = keyword.endsWith("$");
  const needle = normalizeEcosText(wholeWord ? keyword.slice(0, -1) : keyword);
  if (!needle.trim()) return false;
  return normalizedText.includes(wholeWord ? needle : needle.trimEnd());
}

/** Length of the keyword itself, used to prefer the most specific match. */
export function keywordWeight(keyword: string): number {
  return normalizeEcosText(keyword.endsWith("$") ? keyword.slice(0, -1) : keyword).trim().length;
}

export function hasAnyKeyword(normalizedText: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => hasKeyword(normalizedText, keyword));
}

/** True when the student announces the clinical examination in their own words. */
export function isExamTransition(message: string): boolean {
  return hasAnyKeyword(normalizeEcosText(message), EXAM_TRANSITION_KEYWORDS);
}

export const EXAM_TRANSITION_PHRASES: readonly string[] = EXAM_TRANSITION_KEYWORDS;

const RESERVED_STARTS = ["geste", "diagnostic retenu", "prise en charge proposee", "analyse des examens", "examinateur", "synthese ouverte", "reponse a l examinateur", "annonce au patient", "diagnostics differentiels"];

/** Chat messages may not imitate the lines recorded by the structured phases. */
export function usesReservedPrefix(message: string): boolean {
  const text = normalizeEcosText(message).trimStart();
  return RESERVED_STARTS.some((start) => text.startsWith(start));
}

/** « Mme Rochat, 29 ans », ou l'âge en mois d'un nourrisson. */
export function patientLabel(patient: { name: string; age: number; ageLabel?: string }): string {
  return `${patient.name}, ${patient.ageLabel ?? `${patient.age} ans`}`;
}
