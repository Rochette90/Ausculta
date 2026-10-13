import type { StationDiagnoses } from "../diagnoses.ts";
import { MOCK_STATIONS } from "./index.ts";

/**
 * Réponses attendues des stations d'examen blanc (voir `../diagnoses.ts`),
 * déclarées dans chaque fichier de station. Tolérance large : en 3ᵉ année,
 * l'entité clinique suffit.
 */
export const MOCK_STATION_DIAGNOSES: Readonly<Record<string, StationDiagnoses>> = Object.fromEntries(
  MOCK_STATIONS.map((station) => [station.scenario.slug, station.diagnoses]),
);
