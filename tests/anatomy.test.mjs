import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { anatomyModules } from "../lib/anatomy/catalog.ts";
import { gradeAnatomy, publicAnatomyModule, normalizeSearch } from "../lib/anatomy/assessment.ts";
import { gradeTutorial, ecgQuestions } from "../lib/tutorials/questions.ts";
import { remainingSeconds } from "../lib/ecos/timing.ts";

const answers = (questions) => questions.map((question) => ({ id: question.id, optionId: question.correctId }));
test("anatomy curriculum has resolvable fiche links, unique IDs and valid answer keys", async () => {
  const pathologies = JSON.parse(await readFile(new URL("../content/pathologies/index.json", import.meta.url)));
  assert.equal(anatomyModules.length, 6);
  assert.equal(new Set(anatomyModules.map((item) => item.slug)).size, anatomyModules.length);
  for (const lesson of anatomyModules) {
    assert.ok(lesson.sources.every((source) => source.url.startsWith("https://")));
    assert.ok(lesson.pathologySlugs.every((slug) => pathologies.some((item) => item.slug === slug)), lesson.slug);
    const questions = [...lesson.questions, ...lesson.case.questions];
    assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
    for (const q of questions) {
      assert.equal(q.options.filter((option) => option.id === q.correctId).length, 1);
      assert.ok(q.explanation.length > 20);
    }
  }
});
test("perfect, partial and zero scores are derived from answers in both modes", () => {
  for (const lesson of anatomyModules) for (const questions of [lesson.questions, lesson.case.questions]) {
    assert.equal(gradeAnatomy(questions, answers(questions)).percent, 100);
    const wrong = questions.map((q) => ({ id: q.id, optionId: q.options.find((o) => o.id !== q.correctId).id }));
    assert.equal(gradeAnatomy(questions, wrong).score, 0);
    wrong[0].optionId = questions[0].correctId;
    assert.equal(gradeAnatomy(questions, wrong).score, 1);
    assert.equal(gradeAnatomy(questions, [...answers(questions)].reverse()).percent, 100);
  }
});
test("tampered, missing, duplicate, extra and foreign anatomy answers are rejected", () => {
  const qs = anatomyModules[0].questions;
  const valid = answers(qs);
  for (const input of [null, {}, [], valid.slice(1), [...valid, valid[0]], [valid[0], valid[0], valid[2]], [{ id: "foreign", optionId: "a" }, ...valid.slice(1)], [{ ...valid[0], optionId: "bogus" }, ...valid.slice(1)], [null, ...valid.slice(1)]]) assert.throws(() => gradeAnatomy(qs, input));
});
test("public lesson payload does not disclose keys or corrections", () => {
  for (const lesson of anatomyModules) {
    const publicLesson = publicAnatomyModule(lesson);
    assert.equal(publicLesson.structures.length, lesson.structures.length);
    for (const q of [...publicLesson.questions, ...publicLesson.case.questions]) {
      assert.deepEqual(Object.keys(q).sort(), ["id", "options", "prompt"]);
    }
    assert.ok(lesson.questions[0].correctId, "conversion must not mutate source");
  }
});
test("search ignores accents, case and surrounding spaces", () => {
  assert.equal(normalizeSearch("  MÉNINGES  "), "meninges");
});
test("tutorials reject unknown identifiers and fabricated scores", () => {
  assert.equal(gradeTutorial("tutoriel-ecg", ecgQuestions.map((q) => q.answer)), 100);
  assert.equal(gradeTutorial("tutoriel-ecg", [0, 0, 0]), 0);
  for (const invalid of [100, null, [], [1, 2], [1, 2, 99], [1, 2, 2.5], [1, 2, "2"]]) assert.equal(gradeTutorial("tutoriel-ecg", invalid), null);
  assert.equal(gradeTutorial("fake", [1, 2, 2]), null);
  assert.equal(gradeTutorial("__proto__", [1, 2, 2]), null);
});
test("ECOS clock catches up after suspended tabs and never becomes negative", () => {
  assert.equal(remainingSeconds(480_000, 0), 480);
  assert.equal(remainingSeconds(480_000, 1001), 479);
  assert.equal(remainingSeconds(480_000, 460_001), 20);
  assert.equal(remainingSeconds(480_000, 480_000), 0);
  assert.equal(remainingSeconds(480_000, 900_000), 0);
});
