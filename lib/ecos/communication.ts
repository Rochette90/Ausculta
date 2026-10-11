import type { EcosMessage } from "./types.ts";
import { unexplainedJargon } from "./jargon.ts";
import { DIAGNOSIS_PREFIX, hasAnyKeyword, normalizeEcosText, PLAN_PREFIX, PROCEDURE_PREFIX } from "./text.ts";

/**
 * Bilan de communication de l'entretien, calculé sur les seuls messages que
 * l'étudiant adresse au patient. Rien n'y est noté : il complète la grille.
 */

/** Ouverte : le patient raconte. Ciblée : un détail précis. Fermée : oui ou non. */
export type QuestionKind = "open" | "targeted" | "closed";

export type EcosCommunicationReport = {
  questions: Record<QuestionKind, number>;
  /** Type de la première question de l'entretien (nom et âge mis à part). */
  firstQuestion: QuestionKind | null;
  /** Messages qui enchaînent plusieurs questions. */
  stacked: { count: number; examples: string[] };
  /** Mots médicaux employés sans explication, avec la formulation simple. */
  jargon: Array<{ term: string; plain: string }>;
  behaviours: {
    /** Accueille l'émotion ou rassure. */
    empathy: boolean;
    /** Explore les inquiétudes et les attentes du patient. */
    concerns: boolean;
    /** Résume ou reformule ce que le patient a dit. */
    summary: boolean;
    /** Vérifie la compréhension ou invite aux questions. */
    understanding: boolean;
  };
  /** Conseils pour la prochaine station, du plus important au moins important. */
  tips: string[];
};

const MAX_TIPS = 4;
const MAX_EXAMPLES = 2;
const EXAMPLE_LENGTH = 140;

// Les débuts de question sont comparés au texte normalisé (sans accent ni ponctuation).
/** Demandes qui invitent le patient à raconter, même sous forme impérative. */
const OPEN_DIRECTIVES = ["racontez", "raconte", "decrivez", "decris", "parlez moi", "expliquez", "explique", "dites moi ce", "dites moi comment", "dites moi tout"];
const OPEN_STARTS = ["comment", "pourquoi", "qu est ce qui", "qu est ce que", "qu est ce qu", "que ", "qu avez vous", "qu y a t il", "ce qui vous", "a quoi", "de quoi"];
// « ou » seul n'est une question que suivi d'un verbe ou d'un lieu (« ou des frissons ? » est une alternative).
const TARGETED_STARTS = ["ou$", "ou avez", "ou est", "ou ca", "ou exactement", "ou se ", "ou sentez", "ou ressentez", "ou vous", "ou etes", "ou habitez", "ou travaillez", "quand", "depuis quand", "depuis combien", "combien", "quel ", "quelle ", "quels ", "quelles ", "a quel ", "a quelle ", "a partir de quand", "jusqu ou", "qui ", "lequel", "laquelle", "sur une echelle", "sur 10"];
/** Toujours interrogatifs. */
const CLOSED_STARTS = ["est ce que", "est ce qu", "y a t il", "y a t elle", "avez vous", "etes vous", "a t il", "a t elle", "auriez vous", "seriez vous", "pouvez vous", "pourriez vous", "peut on", "puis je"];
/**
 * Interrogatifs à l'oral seulement (« Vous avez de la fièvre ? ») : comptés
 * quand la phrase finit par « ? », ou quand le message n'a aucune ponctuation
 * (dictée vocale).
 */
const SPOKEN_CLOSED_STARTS = ["vous avez", "vous etes", "il y a", "ca vous", "ca fait", "ca change", "ca va", "c est", "vous prenez", "vous fumez", "vous buvez", "vous vivez", "vous sentez", "vous ressentez", "vous toussez", "vous dormez", "vous arrivez", "vous pouvez"];
/** « Pouvez-vous me décrire… » : la forme est fermée, la demande est ouverte. */
const OPEN_REQUEST = /\b(?:decrire|raconter|parler de|parler un peu|expliquer|dire ce qui|dire comment|dire ce que)\b/;
/** Inversion du sujet : « fumez-vous », « toussez-vous », « a-t-il ». Comptée seulement devant un « ? ». */
const INVERSION = /^ [a-z]+(?:ez|ons) vous\b|^ [a-z]+ t (?:il|elle|on)\b/;
/** Consignes polies à l'impératif : « Installez-vous », « Asseyez-vous ». */
const IMPERATIVE = /^ (?:installez|asseyez|allongez|couchez|detendez|rassurez|calmez|levez|tournez|penchez|mettez|deshabillez|redressez|approchez|excusez) (?:vous|moi)\b/;
/** Mots qui ouvrent une phrase sans en faire une question. */
const FILLERS = /^ (?:alors|donc|bon|bien|tres bien|d accord|ok|okay|et|puis|maintenant|ensuite|merci|pardon|excusez moi|dites moi|monsieur|madame|bonjour|bonsoir)\b/;
/** Le nom et l'âge ouvrent souvent l'entretien : ils ne disent rien de la première question clinique. */
const IDENTITY = ["comment vous appel", "comment tu t appel", "votre nom", "quel age", "votre age", "date de naissance"];

const EMPATHY = ["je comprends", "ca doit etre", "ca a du etre", "je vois que", "c est normal d", "c est comprehensible", "je suis desole", "desolee", "ne vous inquietez pas", "ne vous en faites pas", "on va s occuper", "nous allons nous occuper", "je vais m occuper", "on va vous aider", "nous allons vous aider", "je vais vous aider", "je suis la pour vous", "on est la pour vous", "je reste avec vous", "entre de bonnes mains", "prenez votre temps", "rassurez vous"];
const CONCERNS = ["qu est ce qui vous inquiet", "ce qui vous inquiet", "ca vous inquiet", "vous etes inquiet", "etes vous inquiet", "vous inquiete le plus", "vous preoccupe", "avez vous peur", "de quoi avez vous peur", "qu est ce qui vous fait peur", "ce qui vous fait peur", "vos craintes", "vous craignez", "qu en pensez vous", "a quoi pensez vous", "vous pensez que c est", "pensez vous que ce", "votre avis", "qu attendez vous", "vous attendez", "vos attentes", "esperez vous"];
const SUMMARY = ["si je resume", "pour resumer", "je resume", "en resume", "si je comprends bien", "si j ai bien compris", "recapitul", "vous me dites que", "si je vous suis bien"];
const UNDERSTANDING = ["avez vous des questions", "des questions", "est ce clair", "c est clair", "avez vous compris", "vous avez compris", "est ce que vous comprenez", "vous comprenez", "est ce que ca vous va", "ca vous va", "pouvez vous me redire", "pouvez vous reformuler", "qu avez vous retenu"];

/** Messages de l'étudiant au patient : ni geste, ni diagnostic, ni prise en charge écrite. */
export function interviewLines(messages: readonly EcosMessage[]): string[] {
  return messages
    .filter((message) => message.role === "student")
    .map((message) => message.content)
    .filter((content) => ![PROCEDURE_PREFIX, DIAGNOSIS_PREFIX, PLAN_PREFIX].some((prefix) => content.startsWith(prefix)));
}

const startsWithAny = (text: string, starts: readonly string[]) => starts.some((start) => {
  const wholeWord = start.endsWith("$");
  const needle = ` ${wholeWord ? start.slice(0, -1).trim() : start}`;
  return wholeWord ? text === `${needle} ` : text.startsWith(needle);
});

/** Retire les mots d'introduction : « Alors, dites-moi, depuis quand… » → « depuis quand… ». */
function withoutFillers(text: string): string {
  let current = text;
  for (let guard = 0; guard < 4 && FILLERS.test(current); guard += 1) current = ` ${current.replace(FILLERS, "").trim()} `;
  return current.trim() ? current : " ";
}

/** Type d'une proposition interrogative, ou `null` si elle n'en est pas une. */
/**
 * `asked` : la phrase finit par « ? ». `fallback` : compter la proposition
 * comme question fermée même sans tournure interrogative reconnue.
 */
export function questionKind(clause: string, asked = false, spoken = false, fallback = asked): QuestionKind | null {
  const raw = normalizeEcosText(clause);
  if (startsWithAny(raw, OPEN_DIRECTIVES)) return "open";
  const text = withoutFillers(raw);
  if (text.trim().length < 2) return null;
  if (startsWithAny(text, OPEN_DIRECTIVES)) return "open";
  if (OPEN_REQUEST.test(text) && startsWithAny(text, ["est ce que vous pouvez", "est ce que vous pourriez", "pouvez vous", "pourriez vous", "vous pouvez", "voulez vous", "j aimerais que vous", "je voudrais que vous"])) return "open";
  if (startsWithAny(text, IDENTITY)) return "targeted";
  if (startsWithAny(text, ["comment ca va", "comment allez vous"])) return "open";
  if (startsWithAny(text, TARGETED_STARTS)) return "targeted";
  if (startsWithAny(text, OPEN_STARTS)) return "open";
  if (IMPERATIVE.test(text)) return null;
  if (startsWithAny(text, CLOSED_STARTS) || (asked && INVERSION.test(text))) return "closed";
  if ((asked || spoken) && startsWithAny(text, SPOKEN_CLOSED_STARTS)) return "closed";
  return fallback ? "closed" : null;
}

/** Questions d'un message : « Depuis quand avez-vous mal, et où ? » en compte deux. */
export function messageQuestions(message: string): QuestionKind[] {
  const kinds: QuestionKind[] = [];
  const spoken = !/[?!.]/.test(message);
  const sentences = message.match(/[^?!.;…\n]+[?!.;…\n]*/g) ?? [];
  for (const sentence of sentences) {
    // « Si je résume, vous avez mal depuis hier ? » reformule : ce n'est pas une question.
    if (hasAnyKeyword(normalizeEcosText(sentence), SUMMARY)) continue;
    const asked = sentence.includes("?");
    const parts = sentence.replace(/[?!.;…\n]+$/, "").split(/,|\s+et\s+/i);
    const found = parts.map((part) => questionKind(part, asked, spoken, false)).filter((kind): kind is QuestionKind => kind !== null);
    if (found.length) kinds.push(...found);
    else if (asked) kinds.push(questionKind(sentence, true, spoken) ?? "closed");
  }
  return kinds;
}

const shorten = (text: string) => (text.length > EXAMPLE_LENGTH ? `${text.slice(0, EXAMPLE_LENGTH - 1).trimEnd()}…` : text);

export function communicationReport(messages: readonly EcosMessage[]): EcosCommunicationReport {
  const lines = interviewLines(messages);
  const questions: Record<QuestionKind, number> = { open: 0, targeted: 0, closed: 0 };
  let firstQuestion: QuestionKind | null = null;
  const stacked: string[] = [];
  const jargon = new Map<string, string>();

  for (const line of lines) {
    const kinds = messageQuestions(line);
    for (const kind of kinds) questions[kind] += 1;
    if (firstQuestion === null && kinds.length && !hasAnyKeyword(normalizeEcosText(line), IDENTITY)) firstQuestion = kinds[0];
    if (kinds.length >= 2) stacked.push(shorten(line.trim()));
    for (const entry of unexplainedJargon(line)) if (!jargon.has(entry.term)) jargon.set(entry.term, entry.plain);
  }

  const text = normalizeEcosText(lines.join(" | "));
  const behaviours = {
    empathy: hasAnyKeyword(text, EMPATHY),
    concerns: hasAnyKeyword(text, CONCERNS),
    summary: hasAnyKeyword(text, SUMMARY),
    understanding: hasAnyKeyword(text, UNDERSTANDING),
  };
  const jargonList = [...jargon].map(([term, plain]) => ({ term, plain }));
  const total = questions.open + questions.targeted + questions.closed;

  const tips: string[] = [];
  if (!total) tips.push("Mène l’entretien par des questions au patient : c’est là que se gagnent la plupart des points.");
  if (firstQuestion && firstQuestion !== "open") tips.push("Ouvre l’entretien par une question ouverte (« Qu’est-ce qui vous amène ? ») avant de cibler.");
  if (stacked.length) tips.push("Une question à la fois : quand tu en enchaînes plusieurs, le patient ne répond qu’à une partie.");
  if (jargonList.length) tips.push(`Remplace le jargon par des mots simples : ${jargonList.slice(0, 3).map((item) => `« ${item.term} » → ${item.plain}`).join(" ; ")}.`);
  if (total >= 6 && questions.closed / total > 0.6) tips.push("Beaucoup de questions fermées : pour chaque thème, commence par une question ouverte (« Comment est cette douleur ? »), puis précise.");
  if (total && !behaviours.concerns) tips.push("Demande au patient ce qui l’inquiète et ce qu’il attend de la consultation.");
  if (total && !behaviours.summary) tips.push("Résume ce que tu as compris avant l’examen clinique (« Si je résume… »).");
  if (total && !behaviours.empathy) tips.push("Accueille l’émotion du patient (« Je comprends que ce soit inquiétant »).");
  if (total && !behaviours.understanding) tips.push("Termine en vérifiant qu’il a compris et en l’invitant à poser ses questions.");

  return {
    questions,
    firstQuestion,
    stacked: { count: stacked.length, examples: stacked.slice(0, MAX_EXAMPLES) },
    jargon: jargonList,
    behaviours,
    tips: tips.slice(0, MAX_TIPS),
  };
}
