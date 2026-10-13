import type { EcosMessage, EcosScenario } from "./types.ts";
import { FOLLOW_UP_PREFIX } from "./text.ts";

/**
 * Relance de l'examinateur en fin de station, comme au vrai ECOS : une
 * question commune à toutes les stations, posée après la synthèse (les
 * diagnostics différentiels se choisissent dans la liste, `differentials.ts`). Elles
 * ne comptent pas dans la note : au bilan, la réponse de l'étudiant est mise
 * en regard des éléments attendus du débriefing, pour qu'il se compare.
 */
export const FOLLOW_UPS = [
  {
    id: "findings",
    question: "Quels éléments de l’anamnèse et de l’examen t’ont orienté vers ton diagnostic ?",
    expected: (scenario: EcosScenario) => scenario.debrief.keyFindings,
  },
] as const;

export type FollowUpId = (typeof FOLLOW_UPS)[number]["id"];
export const FOLLOW_UP_IDS: readonly FollowUpId[] = FOLLOW_UPS.map((item) => item.id);
export const MAX_FOLLOW_UP_LENGTH = 800;

/** Questions envoyées au navigateur avant la réponse : le texte seul, jamais les éléments attendus. */
export const FOLLOW_UP_QUESTIONS: ReadonlyArray<{ id: FollowUpId; question: string }> = FOLLOW_UPS.map(({ id, question }) => ({ id, question }));

/** Ligne du transcript : « Réponse à l’examinateur (differentials) : … ». */
export function followUpLine(id: FollowUpId, answer: string): string {
  return `${FOLLOW_UP_PREFIX}${id}) : ${answer}`;
}

/** Réponses enregistrées, mises en regard des éléments attendus (après la correction seulement). */
export function followUpReport(scenario: EcosScenario, messages: readonly EcosMessage[]) {
  const answers = new Map<string, string>();
  for (const message of messages) {
    if (message.role !== "student" || !message.content.startsWith(FOLLOW_UP_PREFIX)) continue;
    const match = /^([a-z-]+)\) : ([\s\S]*)$/.exec(message.content.slice(FOLLOW_UP_PREFIX.length));
    if (match) answers.set(match[1], match[2].trim());
  }
  return FOLLOW_UPS.map(({ id, question, expected }) => ({ id, question, answer: answers.get(id) ?? "", expected: [...expected(scenario)] }));
}
