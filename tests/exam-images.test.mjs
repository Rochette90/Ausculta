import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { ALL_ECOS_SCENARIOS } from "../lib/ecos/stations/index.ts";
import { LICENSE_URLS } from "../lib/ecos/image-credits.ts";
import { THIRD_PARTY_IMAGES } from "../lib/legal/third-party-images.ts";
import { normalizeEcosText } from "../lib/ecos/text.ts";

const publicFile = (src) => new URL(`../public${src}`, import.meta.url);
const images = ALL_ECOS_SCENARIOS.flatMap((scenario) => scenario.examination.flatMap((procedure) => (procedure.image ? [{ scenario, procedure, image: procedure.image }] : [])));

test("chaque image d'examen existe, au nom neutre, sans diagnostic dans son texte", () => {
  assert.ok(images.length >= 20);
  for (const { scenario, procedure, image } of images) {
    const where = `${scenario.slug}/${procedure.id}`;
    assert.match(image.src, /^\/ecos\/(ecg|imagerie)\/(station|blanc)-\d{2}[a-z0-9-]*\.(svg|png|jpg)$/, where);
    assert.ok(existsSync(publicFile(image.src)), `${where}: fichier absent`);
    for (const text of [image.alt, image.src]) {
      assert.ok(!normalizeEcosText(text).includes(normalizeEcosText(scenario.diagnosisChoice.correct)), where);
      assert.ok(!text.includes(scenario.slug), where);
    }
    // Les ECG sont dessinés pour le projet ; toute autre image cite son auteur et sa licence.
    if (image.src.startsWith("/ecos/imagerie/")) assert.ok(image.credit && LICENSE_URLS[image.credit.license], `${where}: crédit manquant`);
  }
  // Aucun fichier orphelin dans public/ecos/imagerie.
  const used = new Set(images.map(({ image }) => image.src));
  for (const file of readdirSync(publicFile("/ecos/imagerie/"))) assert.ok(used.has(`/ecos/imagerie/${file}`), `fichier inutilisé : ${file}`);
});

test("les images tierces figurent toutes dans les mentions légales, sans lien avec les stations", () => {
  const credited = images.filter(({ image }) => image.credit);
  assert.equal(credited.length, THIRD_PARTY_IMAGES.length);
  for (const { image } of credited) assert.ok(THIRD_PARTY_IMAGES.some((item) => item.author === image.credit.author && item.license === image.credit.license));
  for (const item of THIRD_PARTY_IMAGES) assert.match(item.source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  const page = readFileSync(new URL("../app/(marketing)/mentions-legales/page.tsx", import.meta.url), "utf8");
  assert.match(page, /THIRD_PARTY_IMAGES\.map/);
  // La liste des titres d'origine (qui nomment souvent le diagnostic) n'est jamais importée par la station.
  const station = readFileSync(new URL("../components/ecos/EcosStation.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(station, /third-party-images/);
});
