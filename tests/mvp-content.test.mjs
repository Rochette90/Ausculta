import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

test("the Ausculta catalog contains 156 pathology entries across 15 populated specialties", async () => {
  const catalog = await readJson("../content/pathologies/index.json");
  assert.equal(catalog.length, 156);
  assert.equal(catalog.filter((item) => item.status === "ready").length, 156);
  assert.equal(catalog.filter((item) => item.status === "planned").length, 0);
  const counts = Object.groupBy(catalog, (item) => item.specialty);
  assert.equal(Object.keys(counts).length, 15);
  assert.deepEqual(Object.values(counts).map((items) => items.length).sort((a, b) => a - b), [3, 4, 4, 4, 5, 5, 11, 12, 15, 15, 15, 15, 15, 16, 17]);
  for (const specialty of ["Urgences", "Radiologie", "Néphrologie", "Hématologie", "Oncologie", "Pédiatrie", "Psychiatrie", "Rhumatologie", "Dermatologie"]) assert.ok(counts[specialty]?.length > 0);
});

test("the B3 expansion strengthens abdomen, inflammation and pediatrics", async () => {
  const catalog = await readJson("../content/pathologies/index.json");
  for (const slug of ["cholangite-aigue", "allergie-anaphylaxie", "croissance-deficit-gh"]) {
    assert.ok(catalog.some((item) => item.slug === slug && item.status === "ready"));
  }
  for (const specialty of ["Néphrologie", "Rhumatologie", "Pédiatrie"]) {
    assert.ok(catalog.filter((item) => item.specialty === specialty).length >= 10);
  }
});

test("vault imports keep provenance and start in needs-review state", async () => {
  for (const slug of ["insuffisance-renale-aigue", "imagerie-thoracique", "risque-suicidaire", "psoriasis", "cholangite-aigue", "allergie-anaphylaxie", "croissance-deficit-gh"]) {
    const markdown = await readFile(new URL(`../content/pathologies/${slug}.md`, import.meta.url), "utf8");
    assert.match(markdown, /review_status: needs_review/);
    assert.match(markdown, /source_vault:/);
    assert.match(markdown, /À réviser — non signée/);
  }
});

test("the clinical catalog contains 23 ECOS cases", async () => {
  const catalog = await readJson("../content/cases/index.json");
  assert.equal(catalog.length, 23);
  assert.ok(catalog.some((item) => item.slug === "douleur-thoracique-aigue" && item.interactive));
  assert.ok(catalog.every((item) => item.candidateTitle?.length > 10));
  assert.ok(catalog.every((item) => item.diagnosis?.length > 3));
  assert.ok(catalog.every((item) => item.candidateTitle.toLocaleLowerCase("fr") !== item.diagnosis.toLocaleLowerCase("fr")));
});

test("the quiz catalog contains a clinical B3-B4 batch covering every pathology across all difficulties", async () => {
  const [questions, pathologies] = await Promise.all([
    readJson("../content/questions/index.json"),
    readJson("../content/pathologies/index.json"),
  ]);
  assert.equal(questions.length, 870);
  assert.equal(new Set(questions.map((item) => item.slug)).size, questions.length);
  assert.ok(questions.every((item) => item.options.length === 4));
  assert.ok(questions.every((item) => item.answer >= 0 && item.answer < item.options.length));
  assert.ok(questions.every((item) => new Set(item.options).size === item.options.length));
  assert.ok(questions.every((item) => item.examDomain === "Bachelor 3–4 · Suisse"));
  assert.ok(questions.every((item) => ["facile", "moyen", "difficile"].includes(item.difficulty)));
  assert.ok(questions.filter((item) => item.difficulty === "difficile").length >= 350);

  for (const pathology of pathologies) {
    const pathologyQuestions = questions.filter((item) => item.pathologySlug === pathology.slug);
    const difficulties = new Set(pathologyQuestions.map((item) => item.difficulty));
    assert.ok(["facile", "moyen", "difficile"].every((difficulty) => difficulties.has(difficulty)),
      `${pathology.slug} is missing a difficulty tier: has ${[...difficulties]}`);
  }

  const pathologyBySlug = new Map(pathologies.map((item) => [item.slug, item]));
  for (const question of questions) {
    assert.equal(pathologyBySlug.get(question.pathologySlug)?.specialty, question.specialty);
    assert.ok(question.question.length >= 40);
    assert.ok(question.explanation.length >= 40);
  }
  const countsBySpecialty = Object.groupBy(questions, (item) => item.specialty);
  assert.equal(Object.keys(countsBySpecialty).length, 15);
  const pathologyCountBySpecialty = Object.groupBy(pathologies, (item) => item.specialty);
  for (const [specialty, specialtyPathologies] of Object.entries(pathologyCountBySpecialty)) {
    assert.ok(countsBySpecialty[specialty]?.length >= specialtyPathologies.length * 5,
      `${specialty} should have at least ${specialtyPathologies.length * 5} questions (5 per pathology across two batches)`);
  }
});

test("phase 2 provides idempotent seed data and shared TypeScript types", async () => {
  const [seed, types] = await Promise.all([
    readFile(new URL("../supabase/migrations/20260810200000_phase2_seed.sql", import.meta.url), "utf8"),
    readFile(new URL("../types/content.ts", import.meta.url), "utf8"),
  ]);
  assert.match(seed, /on conflict\(slug\) do update/i);
  assert.match(seed, /infarctus-myocarde-sca/);
  for (const type of ["Specialty", "Pathology", "Question", "QuestionOption", "UserProgress"]) {
    assert.match(types, new RegExp(`export type ${type} =`));
  }
});
