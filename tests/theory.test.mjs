import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readSeed } from "./seed.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { parseMarkdown } = await import(path.join(root, "app/markdown-parser.ts"));
const { buildFicheDocument } = await import(path.join(root, "lib/content/fiche-document.ts"));
const { BRAND_NAME } = await import(path.join(root, "lib/brand.ts"));

const fiches = readSeed("theory_fiches");

test("la fiche socle de théorie est semée et publiée", () => {
  assert.deepEqual(fiches.map((fiche) => fiche.slug), ["anamnese-classique"]);
  assert.ok(fiches.every((fiche) => fiche.isPublished && fiche.detail.length >= 10));
});

test("une fiche de théorie garde l'ordre de sa trame", () => {
  for (const { slug, content } of fiches) {
    assert.ok(!new RegExp(`\\b${BRAND_NAME}\\b`).test(content), `${slug} : nom de marque en dur`);
    const blocks = parseMarkdown(content);
    const written = blocks.filter((block) => block.kind === "h2").map((block) => block.text);
    const document = buildFicheDocument(blocks, { keepOrder: true });
    assert.equal(document.autoSectioned, false, slug);
    assert.equal(document.reordered, false, slug);
    assert.ok(document.sections.length >= 5, slug);
    assert.deepEqual(
      [...document.sections, ...document.appendix].map((section) => section.title),
      written,
      `${slug} : sections réordonnées`,
    );
  }
});

test("la trame d'anamnèse couvre l'entretien de bout en bout", () => {
  const { content } = fiches.find((fiche) => fiche.slug === "anamnese-classique");
  const titles = parseMarkdown(content).filter((block) => block.kind === "h2").map((block) => block.text);
  for (const expected of ["Motif de consultation", "Anamnèse actuelle", "Revue des systèmes", "Antécédents personnels", "Traitements et allergies", "Antécédents familiaux", "Conclure l'entretien"]) {
    assert.ok(titles.includes(expected), expected);
  }
  assert.ok(titles.indexOf("Motif de consultation") < titles.indexOf("Conclure l'entretien"));
});
