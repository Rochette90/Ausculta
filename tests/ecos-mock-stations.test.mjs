import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { checkMockStation } from "./mock-station-checks.mjs";
import { ECOS_SCENARIOS, MOCK_SCENARIOS, ecosStationView, resolveEcosStation, resolveMockStation } from "../lib/ecos/stations/index.ts";
import { MOCK_CODES, MOCK_STATIONS } from "../lib/ecos/stations/mock/index.ts";
import { STATION_DIAGNOSES } from "../lib/ecos/stations/diagnoses.ts";
import { ecos3Parcours } from "../lib/ecos/curriculum.ts";
import { gradeEcosStation, procedureResult } from "../lib/ecos/grading.ts";
import { DIAGNOSIS_BY_ID } from "../lib/ecos/diagnosis-catalog.ts";
import { DIAGNOSIS_PREFIX } from "../lib/ecos/text.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("l'examen blanc a son propre jeu de stations : deux par type jouable de 3ᵉ année", () => {
  const playable = ecos3Parcours().filter((type) => type.codes.length > 0).map((type) => type.id);
  assert.equal(MOCK_STATIONS.length, playable.length * 2);
  for (const type of playable) assert.equal(MOCK_STATIONS.filter((station) => station.type === type).length, 2, type);
  for (const { scenario } of MOCK_STATIONS) checkMockStation(scenario, STATION_DIAGNOSES[scenario.slug]);
});

test("les stations d'examen blanc sont totalement différentes de celles de l'entraînement", async () => {
  const training = new Set(ECOS_SCENARIOS.map((scenario) => scenario.slug));
  const trainingAccepted = new Set(ECOS_SCENARIOS.flatMap((scenario) => STATION_DIAGNOSES[scenario.slug].accepted));
  const trainingNames = new Set(ECOS_SCENARIOS.map((scenario) => scenario.patient.name.replace(/^(M\.|Mme) /, "")));
  for (const scenario of MOCK_SCENARIOS) {
    assert.ok(!training.has(scenario.slug), scenario.slug);
    for (const id of STATION_DIAGNOSES[scenario.slug].accepted) assert.ok(!trainingAccepted.has(id), `${scenario.slug}: ${id} déjà à l'entraînement`);
    assert.ok(!trainingNames.has(scenario.patient.name.replace(/^(M\.|Mme) /, "")), `${scenario.slug}: patient déjà à l'entraînement`);
  }
  assert.equal(new Set(MOCK_SCENARIOS.map((scenario) => scenario.patient.name)).size, MOCK_SCENARIOS.length);
  // Ni catalogue, ni parcours, ni `/cas` : elles n'existent que dans le circuit.
  const catalog = JSON.parse(await read("../content/cases/index.json"));
  for (const scenario of MOCK_SCENARIOS) assert.ok(!catalog.some((item) => item.slug === scenario.slug), scenario.slug);
  const parcoursCodes = ecos3Parcours().flatMap((type) => type.codes);
  assert.ok(parcoursCodes.every((code) => /^station-\d{2}$/.test(code)));
  for (const scenario of MOCK_SCENARIOS) {
    const code = MOCK_CODES[scenario.slug];
    assert.match(code, /^blanc-\d{2}$/);
    assert.equal(resolveEcosStation(code), null, code);
    assert.equal(resolveEcosStation(scenario.slug), null, scenario.slug);
    assert.equal(resolveMockStation(code), scenario);
  }
  assert.equal(new Set(Object.values(MOCK_CODES)).size, MOCK_SCENARIOS.length);
  assert.equal(resolveMockStation("station-01"), null);
  assert.equal(resolveMockStation("toString"), null);
});

test("barème de 3ᵉ année : le diagnostic vaut 1 point, le navigateur ne reçoit rien de sensible", () => {
  for (const scenario of MOCK_SCENARIOS) {
    const accepted = DIAGNOSIS_BY_ID.get(STATION_DIAGNOSES[scenario.slug].accepted[0]).label;
    const graded = gradeEcosStation(scenario, [{ role: "student", content: `${DIAGNOSIS_PREFIX}${accepted}` }]);
    assert.equal(graded.criteria.find((item) => item.id === "diagnosis").earned, 1, scenario.slug);
    assert.equal(graded.score, 1, scenario.slug);
    assert.equal(graded.maxScore, 22, scenario.slug);
    const view = ecosStationView(scenario, { candidateTitle: "", specialty: null });
    const payload = JSON.stringify(view);
    assert.equal(view.code, MOCK_CODES[scenario.slug]);
    assert.ok(!payload.includes(scenario.slug) && !payload.includes(scenario.debrief.diagnosis) && !payload.includes(scenario.diagnosisChoice.correct), scenario.slug);
    for (const rule of scenario.rules) assert.ok(!payload.includes(rule.reply), `${scenario.slug}/${rule.topic}`);
    for (const procedure of scenario.examination) assert.ok(!payload.includes(procedureResult(scenario, procedure)), `${scenario.slug}/${procedure.id}`);
  }
});

test("une station d'examen blanc ne se joue qu'en circuit, en mode examen, sans points affichés", async () => {
  const [session, page, station, report] = await Promise.all([
    read("../app/api/ecos/session/route.ts"),
    read("../app/(app)/examen-blanc/station/page.tsx"),
    read("../components/ecos/EcosStation.tsx"),
    read("../app/(app)/examen-blanc/bilan/page.tsx"),
  ]);
  assert.match(session, /const mode = mock \? "exam" : parseEcosMode\(body\.mode\)/);
  assert.match(page, /resolveMockStation\(plan\[step\]\)/);
  assert.doesNotMatch(page, /resolveEcosStation/);
  // Ni au briefing ni au bilan global : le nombre de points maximum n'est pas montré.
  assert.match(station, /circuit \? <div><dt>Station<\/dt>/);
  assert.doesNotMatch(report, /maxScore|results\.max\b/);
});
