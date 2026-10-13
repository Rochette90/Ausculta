import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { stationXp, STATION_XP, MIN_INTERVIEW_QUESTIONS } from "../lib/ecos/xp.ts";
import { levelFromXp, levelThreshold } from "../lib/progress/levels.ts";
import { milestones } from "../lib/ecos/milestones.ts";
import { ECOS_SCENARIOS } from "../lib/ecos/stations/index.ts";
import { PROCEDURE_PREFIX } from "../lib/ecos/text.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("l'XP d'une station récompense la progression, pas la présence", () => {
  // Station bâclée : aucune XP, même terminée.
  assert.equal(stationXp({ score: 10, questions: MIN_INTERVIEW_QUESTIONS - 1, previousBest: null, reflexes: 5, mode: "exam" }).total, 0);
  // Première fois, entraînement : score × 2 + nouveau patient + réflexes.
  const first = stationXp({ score: 15, questions: 12, previousBest: null, reflexes: 6, mode: "training" });
  assert.equal(first.total, 15 * STATION_XP.perPoint + STATION_XP.newPatient + 6 * STATION_XP.perReflex);
  // Rejouer sans faire mieux ne rapporte que le score et les réflexes ; battre son record rapporte un bonus.
  const same = stationXp({ score: 15, questions: 12, previousBest: 15, reflexes: 6, mode: "training" });
  const better = stationXp({ score: 18, questions: 12, previousBest: 15, reflexes: 6, mode: "exam" });
  assert.equal(same.total, first.total - STATION_XP.newPatient);
  assert.equal(better.total, 18 * STATION_XP.perPoint + STATION_XP.record + 6 + STATION_XP.examMode);
  assert.ok(better.lines.some((line) => /Record battu \(15 → 18\)/.test(line.label)));
  assert.ok(stationXp({ score: 22, questions: 40, previousBest: null, reflexes: 11, mode: "exam" }).total <= 300);
});

test("les niveaux demandent de plus en plus d'XP", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(levelThreshold), [0, 100, 300, 600, 1000]);
  assert.equal(levelFromXp(0).level, 1);
  assert.equal(levelFromXp(99).level, 1);
  assert.equal(levelFromXp(100).level, 2);
  assert.deepEqual(levelFromXp(450), { level: 3, current: 150, needed: 300, percentage: 50 });
});

test("les jalons suivent le parcours, les conditions d'examen et la maîtrise", () => {
  const station = (slug, score, mode = "training", messages = []) => ({ scenario: ECOS_SCENARIOS.find((item) => item.slug === slug), messages, score, maxScore: 22, mode });
  const none = milestones([]);
  assert.ok(none.every((item) => !item.done));
  const result = Object.fromEntries(milestones([
    station("douleur-thoracique-aigue", 20, "exam", [{ role: "student", content: `${PROCEDURE_PREFIX}ECG 12 dérivations` }]),
    station("appendicite-aigue", 10),
    station("rupture-ligament-croise-anterieur", 22),
  ]).map((item) => [item.id, item]));
  assert.equal(result["premier-patient"].done, true);
  assert.equal(result["examen-blanc"].done, true);
  // Orthopédie (5ᵉ année) hors parcours de 3ᵉ année.
  assert.equal(result["tour-ecos-3"].progress, 2);
  assert.equal(result["maitrise"].progress, 2);
  assert.equal(result["examens-cibles"].progress, 1);
  // Plus de jalon de série quotidienne.
  assert.equal(result["serie-7"], undefined);
});

test("le serveur crédite la nouvelle XP, et l'objectif du jour compte les vraies stations", async () => {
  const [route, dashboard, profile, catalog] = await Promise.all([
    read("../app/api/ecos/session/[id]/route.ts"),
    read("../lib/dashboard/queries.ts"),
    read("../app/(app)/profil/page.tsx"),
    read("../components/ecos/CaseCatalog.tsx"),
  ]);
  assert.match(route, /p_xp: report\.xp/);
  assert.match(route, /const report = \{ \.\.\.graded, xp: xp\.total, xpLines: xp\.lines \};/);
  // Le record se lit sur les autres séances terminées de la même station.
  assert.match(route, /\.neq\("id", id\)/);
  // Un bilan rouvert montre l'XP créditée, pas un nouveau calcul.
  assert.match(route, /from\("xp_events"\)\.select\("amount"\)/);
  assert.match(dashboard, /event\.amount > 0 && zurichDate/);
  assert.match(dashboard, /level: levelFromXp\(profile\.xp\)/);
  assert.doesNotMatch(profile, /user_badges/);
  assert.match(catalog, /record \$\{best\[item\.code\]\} %/);
});

test("les bilans enregistrés se rouvrent depuis l'historique, pour leur seul propriétaire", async () => {
  const [history, list, detail, station] = await Promise.all([
    read("../lib/ecos/history.ts"),
    read("../app/(app)/historique/page.tsx"),
    read("../app/(app)/historique/[id]/page.tsx"),
    read("../components/ecos/EcosStation.tsx"),
  ]);
  assert.match(history, /import "server-only";/);
  // Toujours filtré sur le compte, et seulement des stations terminées.
  assert.ok((history.match(/\.eq\("user_id", userId\)/g) ?? []).length >= 3);
  assert.match(history, /session\.status !== "completed"\) return null/);
  assert.match(history, /UUID_PATTERN\.test\(sessionId\)/);
  // Le même bilan que la fin de station, avec l'XP réellement créditée.
  assert.match(history, /buildStationReport\(scenario, storedTranscript\(session\.transcript\), sessionId\)/);
  assert.match(list, /requireUser\("\/historique"\)/);
  assert.match(detail, /if \(!saved\) notFound\(\);/);
  assert.match(station, /useState<Screen>\(savedReport \? "report" : "briefing"\)/);
  // La liste ne nomme jamais le diagnostic : codes publics et feuilles de porte.
  assert.doesNotMatch(list, /diagnosisChoice|station_slug/);
});

test("l'examen blanc tire une station par type et revérifie le circuit transmis dans l'adresse", async () => {
  const { drawMockExam, mockExamTypes, parseMockPlan, parseMockSessions } = await import("../lib/ecos/mock-plan.ts");
  const types = mockExamTypes();
  assert.equal(types.length, 7);
  for (let run = 0; run < 20; run += 1) {
    const plan = drawMockExam();
    assert.equal(plan.length, types.length);
    plan.forEach((code, index) => assert.ok(types[index].codes.includes(code)));
    assert.deepEqual(parseMockPlan(plan.join(",")), plan);
  }
  // De préférence des stations pas encore jouées.
  const played = new Set(types.map((type) => type.codes[0]));
  for (let run = 0; run < 10; run += 1) assert.ok(drawMockExam(played).every((code) => !played.has(code)));
  // Plan trafiqué : station d'entraînement, doublon, mauvais ordre, longueur fausse.
  const good = drawMockExam();
  assert.equal(parseMockPlan([...good.slice(0, -1), "station-15"].join(",")), null);
  assert.equal(parseMockPlan([good[0], ...good.slice(0, -1)].join(",")), null);
  assert.equal(parseMockPlan([good[1], good[0], ...good.slice(2)].join(",")), null);
  assert.equal(parseMockPlan(good.slice(1).join(",")), null);
  assert.deepEqual(parseMockSessions("pas-un-uuid"), []);
  const [station, results] = await Promise.all([read("../app/(app)/examen-blanc/station/page.tsx"), read("../lib/ecos/mock-exam.ts")]);
  assert.match(station, /step >= plan\.length\) notFound\(\)/);
  // Le bilan global ne lit que les stations terminées de ce compte.
  assert.match(results, /\.eq\("user_id", userId\)/);
  assert.match(results, /row\.status !== "completed"\) return \[\]/);
});
