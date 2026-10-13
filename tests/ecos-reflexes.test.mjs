import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { REFLEXES, reflexStats, reflexesToWork } from "../lib/ecos/reflexes.ts";
import { ECOS_SCENARIOS } from "../lib/ecos/stations/index.ts";
import { PROCEDURE_PREFIX } from "../lib/ecos/text.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const student = (content) => ({ role: "student", content });

test("les réflexes se comptent d'une station à l'autre et les oublis remontent en tête", () => {
  const [first, second] = ECOS_SCENARIOS;
  const good = [
    student("Bonjour, je suis le médecin assistant."),
    student("Qu'est-ce qui vous amène ?"),
    student("Prenez-vous des médicaments ?"),
    student("Êtes-vous allergique à quelque chose ?"),
    student(`${PROCEDURE_PREFIX}Constantes vitales`),
  ];
  const poor = [student("Avez-vous mal à la poitrine ?"), student(`${PROCEDURE_PREFIX}Gastroscopie`)];
  const stats = reflexStats([{ scenario: first, messages: good }, { scenario: second, messages: poor }]);
  const byId = Object.fromEntries(stats.map((stat) => [stat.id, stat]));
  assert.equal(stats.length, REFLEXES.length);
  assert.deepEqual([byId.presentation.done, byId.presentation.total], [1, 2]);
  assert.deepEqual([byId.allergies.done, byId.allergies.total], [1, 2]);
  assert.deepEqual([byId["open-start"].done, byId["open-start"].total], [1, 2]);
  // La gastroscopie n'est attendue dans aucune des deux premières stations.
  assert.deepEqual([byId["targeted-exams"].done, byId["targeted-exams"].total], [1, 2]);
  // Sans aucune question, l'entretien n'est pas jugé.
  assert.equal(reflexStats([{ scenario: first, messages: [] }]).find((stat) => stat.id === "allergies").total, 0);
  const focus = reflexesToWork(stats);
  assert.ok(focus.length <= 3 && focus.every((stat) => stat.total >= 2 && stat.done / stat.total < 0.67));
});

test("le tableau de bord lit les réflexes côté serveur, sans rien de sensible", async () => {
  const [progress, page, dashboard] = await Promise.all([
    read("../lib/ecos/progress.ts"),
    read("../app/(app)/dashboard/page.tsx"),
    read("../components/dashboard/UserDashboard.tsx"),
  ]);
  assert.match(progress, /import "server-only";/);
  assert.match(progress, /\.eq\("user_id", userId\)/);
  assert.match(progress, /\.eq\("status", "completed"\)/);
  assert.match(page, /getEcosProgress\(user\.id\)\.catch\(\(\) => null\)/);
  assert.match(dashboard, /Tes réflexes d’entretien/);
  assert.doesNotMatch(dashboard, /station_slug|diagnos/);
});

test("le parcours ECOS de 3ᵉ année range les stations par type, sans jamais exposer leur nom interne", async () => {
  const { ecos3Parcours, ECOS3_SLUGS } = await import("../lib/ecos/curriculum.ts");
  const types = ecos3Parcours();
  assert.deepEqual(types.map((type) => type.id), ["cardio-pulmonaire", "neurologique", "abdominal", "fievre", "psychosocial", "pediatrie", "bls", "dermatologie"]);
  // Chaque slug existe, n'apparaît qu'une fois, et ne sort que sous forme de code public.
  assert.equal(new Set(ECOS3_SLUGS).size, ECOS3_SLUGS.length);
  for (const slug of ECOS3_SLUGS) assert.ok(ECOS_SCENARIOS.some((scenario) => scenario.slug === slug), slug);
  const payload = JSON.stringify(types);
  for (const scenario of ECOS_SCENARIOS) assert.ok(!payload.includes(scenario.slug), scenario.slug);
  assert.ok(types.flatMap((type) => type.codes).every((code) => /^station-\d{2}$/.test(code)));
  // Les stations de 5ᵉ année (orthopédie, 21 à 23) n'y figurent pas.
  assert.equal(types.flatMap((type) => type.codes).length, 20);
  const component = await read("../components/ecos/Ecos3Parcours.tsx");
  assert.doesNotMatch(component, /from "@\/lib\/ecos\/(stations|engine|cases)"/);
});
