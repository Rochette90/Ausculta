import { UUID_PATTERN } from "../validation.ts";
import { ecos3Parcours } from "./curriculum.ts";
import { MOCK_CODES, MOCK_STATIONS } from "./stations/mock/index.ts";

/**
 * Examen blanc de 3ᵉ année : une station tirée au sort par type, dans le jeu
 * réservé à l'examen blanc (`stations/mock/`, jamais proposé à
 * l'entraînement), enchaînées en mode examen, bilan global à la fin. Le
 * circuit voyage dans l'adresse (plan de codes publics, étape, sessions
 * jouées) : rien à stocker, et chaque élément est revérifié ici.
 */
export type MockExamType = { id: string; label: string; codes: string[] };

/** Types du parcours de 3ᵉ année qui ont des stations d'examen blanc, dans l'ordre du parcours. */
export function mockExamTypes(): MockExamType[] {
  return ecos3Parcours()
    .map(({ id, label }) => ({ id, label, codes: MOCK_STATIONS.filter((station) => station.type === id).map((station) => MOCK_CODES[station.scenario.slug]) }))
    .filter((type) => type.codes.length > 0);
}

/** Type de 3ᵉ année d'une station d'examen blanc (slug interne). Serveur seulement. */
export function mockTypeOf(slug: string): string | null {
  return MOCK_STATIONS.find((station) => station.scenario.slug === slug)?.type ?? null;
}

/** Un code par type ; de préférence une station que l'étudiant n'a pas encore jouée. */
export function drawMockExam(played: ReadonlySet<string> = new Set()): string[] {
  const pick = (codes: readonly string[]) => codes[Math.floor(Math.random() * codes.length)];
  return mockExamTypes().map((type) => {
    const fresh = type.codes.filter((code) => !played.has(code));
    return pick(fresh.length ? fresh : type.codes);
  });
}

/** Plan valide : un code d'examen blanc par type, dans l'ordre du parcours. */
export function parseMockPlan(value: string | undefined): string[] | null {
  const types = mockExamTypes();
  const codes = (value ?? "").split(",").map((code) => code.trim()).filter(Boolean);
  if (!types.length || codes.length !== types.length || !codes.every((code, index) => types[index].codes.includes(code))) return null;
  return codes;
}

export function parseMockSessions(value: string | undefined): string[] {
  const ids = (value ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  return ids.every((id) => UUID_PATTERN.test(id)) ? [...new Set(ids)] : [];
}
