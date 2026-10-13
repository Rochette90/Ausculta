import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readSeed } from "./seed.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { checklistRubric, markFromChecked, partMaximum, partScore, GRID_DURATION_SECONDS } = await import(path.join(root, "lib/grids/scoring.ts"));
const { emptyGridContent, validateGridContent } = await import(path.join(root, "lib/grids/validate.ts"));
const { BRAND_NAME } = await import(path.join(root, "lib/brand.ts"));

const rows = readSeed("practice_grids");
const grids = rows.map((row) => ({ slug: row.slug, title: row.title, themes: row.detail, ...JSON.parse(row.content) }));

test("les 8 grilles de l'ECOS de 3e année sont semées, publiées et ordonnées", () => {
  assert.deepEqual(rows.map((row) => row.slug), ["cardio-pulmonaire", "neurologique", "abdominal", "fievre", "psychosocial", "pediatrie", "bls", "dermatologie"]);
  assert.deepEqual(rows.map((row) => row.position), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(rows.every((row) => row.isPublished));
});

test("chaque grille semée passe le validateur, à l'identique", () => {
  for (const grid of grids) {
    const { slug, title, themes, ...content } = grid;
    const result = validateGridContent(content);
    assert.ok(result.ok, `${slug} : ${result.ok ? "" : result.errors.join(" / ")}`);
    assert.deepEqual(result.content, content, slug);
    assert.ok(title && themes !== undefined, slug);
    assert.ok(content.synthesis.criteria.length >= 3, slug);
    assert.ok(content.synthesis.cards.length > 0, slug);
  }
});

test("le validateur refuse ce que l'éditeur ne doit pas enregistrer", () => {
  const base = emptyGridContent();
  assert.ok(validateGridContent(base).ok);
  const section = { id: "s", title: "S", kind: "checklist", items: ["a", "b"], rule: { yes: 2, partial: 1 } };
  const withSections = (sections) => ({ ...base, history: { ...base.history, sections } });
  assert.ok(validateGridContent(withSections([section])).ok);
  assert.equal(validateGridContent(withSections([section, { ...section }])).ok, false, "ids dupliqués");
  assert.equal(validateGridContent(withSections([{ ...section, rule: { yes: 3, partial: 1 } }])).ok, false, "oui inatteignable");
  assert.equal(validateGridContent(withSections([{ ...section, rule: { yes: 2, partial: 2 } }])).ok, false, "± pas sous oui");
  assert.equal(validateGridContent(withSections([{ ...section, id: "a b" }])).ok, false, "id invalide");
  assert.equal(validateGridContent({ ...base, synthesis: { ...base.synthesis, criteria: [] } }).ok, false, "synthèse vide");
  assert.equal(validateGridContent(null).ok, false);
});

test("la note proposée suit la règle et le barème affiché en découle", () => {
  const section = { id: "s", title: "S", kind: "checklist", items: ["a", "b", "c", "d"], rule: { yes: 3, partial: 2 } };
  assert.deepEqual([0, 1, 2, 3, 4].map((count) => markFromChecked(section, count)), ["no", "no", "partial", "yes", "yes"]);
  assert.deepEqual(checklistRubric(section), ["au moins trois = oui", "deux = ±", "aucun à un = non"]);
  assert.deepEqual(checklistRubric({ ...section, items: ["a", "b", "c"] }), ["les trois = oui", "deux = ±", "aucun à un = non"]);
});

test("score : 2 points par section, chrono de 13 minutes", () => {
  const grid = grids.find((entry) => entry.slug === "abdominal");
  assert.equal(partMaximum(grid, "history"), grid.history.sections.length * 2);
  assert.equal(partScore({ a: "yes", b: "partial" }, ["a", "b", "c"]), 3);
  assert.equal(GRID_DURATION_SECONDS, 780);
});

test("les grilles ne codent pas le nom de marque en dur", () => {
  const text = JSON.stringify(grids);
  // « Auscultation » est un mot médical : seul le nom isolé est interdit.
  assert.ok(!new RegExp(`\\b${BRAND_NAME}\\b`).test(text));
  assert.ok(!/rescos/i.test(text));
});
