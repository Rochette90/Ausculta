import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

test("the UNIL MVP contains 90 balanced pathology entries", async () => {
  const catalog = await readJson("../content/pathologies/index.json");
  assert.equal(catalog.length, 90);
  assert.equal(catalog.filter((item) => item.status === "ready").length, 83);
  assert.equal(catalog.filter((item) => item.status === "planned").length, 7);
  const counts = Object.groupBy(catalog, (item) => item.specialty);
  assert.deepEqual(Object.values(counts).map((items) => items.length).sort(), [15, 15, 15, 15, 15, 15]);
});

test("the clinical MVP catalog contains 12 priority cases", async () => {
  const catalog = await readJson("../content/cases/index.json");
  assert.equal(catalog.length, 12);
  assert.ok(catalog.some((item) => item.slug === "douleur-thoracique-aigue" && item.interactive));
});

test("the quiz catalog contains 12 validated questions", async () => {
  const catalog = await readJson("../content/questions/index.json");
  assert.equal(catalog.length, 12);
  assert.ok(catalog.every((item) => item.options.length === 4));
  assert.ok(catalog.every((item) => item.answer >= 0 && item.answer < item.options.length));
});

test("phase 2 provides idempotent seed data and shared TypeScript types", async () => {
  const [seed, types] = await Promise.all([
    readFile(new URL("../supabase/migrations/20260810200000_phase2_seed.sql", import.meta.url), "utf8"),
    readFile(new URL("../types/medtrain.ts", import.meta.url), "utf8"),
  ]);
  assert.match(seed, /on conflict\(slug\) do update/i);
  assert.match(seed, /infarctus-myocarde-sca/);
  for (const type of ["Specialty", "Pathology", "Question", "QuestionOption", "UserProgress"]) {
    assert.match(types, new RegExp(`export type ${type} =`));
  }
});
