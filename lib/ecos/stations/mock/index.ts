import type { EcosScenario } from "../../types.ts";
import type { StationDiagnoses } from "../diagnoses.ts";
import { pericarditeAigue, pericarditeAigueDiagnoses } from "./pericardite-aigue.ts";
import { exacerbationBpco, exacerbationBpcoDiagnoses } from "./exacerbation-bpco.ts";
import { migraineSansAura, migraineSansAuraDiagnoses } from "./migraine-sans-aura.ts";
import { vertigePositionnel, vertigePositionnelDiagnoses } from "./vertige-positionnel.ts";
import { diverticuliteSigmoidienne, diverticuliteSigmoidienneDiagnoses } from "./diverticulite-sigmoidienne.ts";
import { ulcereGastroduodenal, ulcereGastroduodenalDiagnoses } from "./ulcere-gastroduodenal.ts";
import { mononucleoseInfectieuse, mononucleoseInfectieuseDiagnoses } from "./mononucleose-infectieuse.ts";
import { prostatiteAigue, prostatiteAigueDiagnoses } from "./prostatite-aigue.ts";
import { troublePanique, troublePaniqueDiagnoses } from "./trouble-panique.ts";
import { consommationAlcool, consommationAlcoolDiagnoses } from "./consommation-alcool.ts";
import { bronchiolite, bronchioliteDiagnoses } from "./bronchiolite.ts";
import { otiteMoyenneAigue, otiteMoyenneAigueDiagnoses } from "./otite-moyenne-aigue.ts";
import { zonaThoracique, zonaThoraciqueDiagnoses } from "./zona-thoracique.ts";
import { urticaireAigue, urticaireAigueDiagnoses } from "./urticaire-aigue.ts";

/**
 * Stations de l'examen blanc de 3ᵉ année : un jeu à part, jamais proposé à
 * l'entraînement (ni catalogue, ni parcours, ni `/cas`). Présentations plus
 * typiques que les stations d'entraînement, diagnostic parfois moins net ;
 * la note porte surtout sur l'anamnèse et le status (diagnostic : 1 point).
 * Sans ligne en base : le registre fait foi. Serveur seulement.
 */
export type MockStation = { scenario: EcosScenario; type: string; diagnoses: StationDiagnoses };

export const MOCK_STATIONS: readonly MockStation[] = [
  { type: "cardio-pulmonaire", scenario: pericarditeAigue, diagnoses: pericarditeAigueDiagnoses },
  { type: "cardio-pulmonaire", scenario: exacerbationBpco, diagnoses: exacerbationBpcoDiagnoses },
  { type: "neurologique", scenario: migraineSansAura, diagnoses: migraineSansAuraDiagnoses },
  { type: "neurologique", scenario: vertigePositionnel, diagnoses: vertigePositionnelDiagnoses },
  { type: "abdominal", scenario: diverticuliteSigmoidienne, diagnoses: diverticuliteSigmoidienneDiagnoses },
  { type: "abdominal", scenario: ulcereGastroduodenal, diagnoses: ulcereGastroduodenalDiagnoses },
  { type: "fievre", scenario: mononucleoseInfectieuse, diagnoses: mononucleoseInfectieuseDiagnoses },
  { type: "fievre", scenario: prostatiteAigue, diagnoses: prostatiteAigueDiagnoses },
  { type: "psychosocial", scenario: troublePanique, diagnoses: troublePaniqueDiagnoses },
  { type: "psychosocial", scenario: consommationAlcool, diagnoses: consommationAlcoolDiagnoses },
  { type: "pediatrie", scenario: bronchiolite, diagnoses: bronchioliteDiagnoses },
  { type: "pediatrie", scenario: otiteMoyenneAigue, diagnoses: otiteMoyenneAigueDiagnoses },
  { type: "dermatologie", scenario: zonaThoracique, diagnoses: zonaThoraciqueDiagnoses },
  { type: "dermatologie", scenario: urticaireAigue, diagnoses: urticaireAigueDiagnoses },
];

/** Codes publics neutres. Jamais renumérotés : l'historique s'y réfère. */
export const MOCK_CODES: Readonly<Record<string, string>> = {
  "pericardite-aigue": "blanc-01",
  "exacerbation-bpco": "blanc-02",
  "migraine-sans-aura": "blanc-03",
  "vertige-positionnel": "blanc-04",
  "diverticulite-sigmoidienne": "blanc-05",
  "ulcere-gastroduodenal": "blanc-06",
  "mononucleose-infectieuse": "blanc-07",
  "prostatite-aigue": "blanc-08",
  "trouble-panique": "blanc-09",
  "consommation-alcool": "blanc-10",
  "bronchiolite": "blanc-11",
  "otite-moyenne-aigue": "blanc-12",
  "zona-thoracique": "blanc-13",
  "urticaire-aigue": "blanc-14",
};
