import "server-only";

import type { EcosMessage, EcosScenario } from "./types.ts";
import { annotatedInterview } from "./annotations.ts";
import { announcementReport } from "./announcement.ts";
import { communicationReport } from "./communication.ts";
import { debriefView } from "./debrief.ts";
import { differentialsReport } from "./differentials.ts";
import { followUpReport } from "./follow-ups.ts";
import { gradeEcosStation } from "./grading.ts";
import { patientVariant } from "./variants.ts";

/**
 * Bilan d'une station, construit sur le serveur depuis le transcript
 * enregistré : grille, communication, relances, différentiels, entretien
 * annoté, annonce et débriefing. Partagé par la fin de station
 * (`POST /api/ecos/session/[id]`) et l'historique (`/historique/[id]`).
 */
export function buildStationReport(scenario: EcosScenario, transcript: EcosMessage[], sessionId: string) {
  return {
    saved: true,
    ...gradeEcosStation(scenario, transcript),
    communication: communicationReport(transcript),
    followUps: followUpReport(scenario, transcript),
    differentials: differentialsReport(scenario, transcript),
    interview: annotatedInterview(scenario, transcript),
    announcement: announcementReport(transcript),
    // Tempérament joué par le patient pendant cette séance (révélé après la station).
    patientVariant: patientVariant(sessionId).label,
    debrief: debriefView(scenario.debrief),
  };
}
