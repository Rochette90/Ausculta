import type { EcosMessage, EcosScenario } from "./types.ts";
import { ecos3TypeOf, ECOS3_PLAYABLE_TYPES } from "./curriculum.ts";
import { resolveExamOrders } from "./exam-orders.ts";
import { stationReflexCount } from "./reflexes.ts";
import { PROCEDURE_PREFIX } from "./text.ts";

/**
 * Jalons de progression : ils remplacent les trois badges d'origine et
 * suivent ce qui prépare à l'ECOS (couverture du parcours, conditions
 * d'examen, examens ciblés, réflexes, maîtrise, volume). Recalculés
 * depuis les stations terminées, sans table dédiée.
 */
export type CompletedStation = { scenario: EcosScenario; messages: readonly EcosMessage[]; score: number; maxScore: number; mode: string };

export type Milestone = { id: string; label: string; description: string; progress: number; target: number; done: boolean };

const MASTERY = 0.8;
const EXAM_PASS = 0.7;

export function milestones(stations: readonly CompletedStation[]): Milestone[] {
  const share = (station: CompletedStation) => (station.maxScore ? station.score / station.maxScore : 0);
  const typesMet = new Set(stations.flatMap((station) => ecos3TypeOf(station.scenario.slug) ?? []));
  const examPassed = stations.filter((station) => station.mode === "exam" && share(station) >= EXAM_PASS).length;
  const targeted = stations.filter((station) => station.messages.some((message) => message.role === "student" && message.content.startsWith(PROCEDURE_PREFIX))
    && resolveExamOrders(station.scenario, station.messages).unhelpful.length === 0).length;
  const bestReflexes = Math.max(0, ...stations.map((station) => stationReflexCount(station.scenario, station.messages)));
  const best = new Map<string, number>();
  for (const station of stations) best.set(station.scenario.slug, Math.max(best.get(station.scenario.slug) ?? 0, share(station)));
  const mastered = [...best.values()].filter((value) => value >= MASTERY).length;
  const entries: Array<Omit<Milestone, "done">> = [
    { id: "premier-patient", label: "Premier patient", description: "Mener une première station jusqu’au bilan.", progress: stations.length, target: 1 },
    { id: "tour-ecos-3", label: "Tour de l’ECOS de 3ᵉ année", description: `Rencontrer un patient de chacun des ${ECOS3_PLAYABLE_TYPES} types joués avec patient simulé.`, progress: typesMet.size, target: ECOS3_PLAYABLE_TYPES },
    { id: "examen-blanc", label: "Réussite en conditions d’examen", description: "Une station en mode examen à 70 % ou plus.", progress: examPassed, target: 1 },
    { id: "examens-cibles", label: "Examens ciblés", description: "Cinq stations sans aucun examen inutile.", progress: targeted, target: 5 },
    { id: "reflexes", label: "Tous les réflexes", description: "Une station avec au moins 10 réflexes d’entretien sur 11.", progress: bestReflexes, target: 10 },
    { id: "maitrise", label: "Maîtrise", description: "Cinq stations différentes réussies à 80 % ou plus.", progress: mastered, target: 5 },
    { id: "assidu", label: "Assidu", description: "Vingt-cinq stations menées jusqu’au bilan.", progress: stations.length, target: 25 },
  ];
  return entries.map((entry) => ({ ...entry, progress: Math.min(entry.progress, entry.target), done: entry.progress >= entry.target }));
}
