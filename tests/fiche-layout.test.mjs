import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { parseMarkdown, parseFrontmatter } = await import(path.join(root, "app/markdown-parser.ts"));
const { buildFicheDocument } = await import(path.join(root, "lib/content/fiche-document.ts"));
const { FICHE_GROUPS, classifyFicheSection } = await import(path.join(root, "lib/content/fiche-taxonomy.ts"));

const fichesDir = path.join(root, "content/pathologies");
const fiches = readdirSync(fichesDir).filter((file) => file.endsWith(".md")).sort();

function flatten(blocks) {
  return blocks.flatMap((block) => (block.kind === "callout" ? [block, ...flatten(block.blocks)] : [block]));
}

function textOf(blocks) {
  const walk = (items) => items.map((item) => `${item.text} ${walk(item.children)}`).join(" ");
  return blocks
    .map((block) => {
      if (block.kind === "callout") return `${block.title} ${textOf(block.blocks)}`;
      if (block.kind === "table") return [...block.header, ...block.rows.flat()].join(" ");
      if (block.kind === "list") return walk(block.items);
      return block.text ?? "";
    })
    .join(" ");
}

test("le rendu neutralise le LaTeX et le HTML hérités du vault", () => {
  const blocks = parseMarkdown([
    "Blocage **Pro-B $\\to$ Pré-B** avec $\\downarrow$ IgG $\\ge 4$ et $O_2$.",
    "",
    "- <font color=\"#ff0000\">Point à retenir</font> et <b>gras</b>.",
  ].join("\n"));

  const text = textOf(blocks);
  assert.match(text, /Pro-B → Pré-B/);
  assert.match(text, /↓ IgG ≥ 4/);
  assert.match(text, /O₂/);
  assert.match(text, /==Point à retenir==/, "le surlignage rouge devient un point à retenir");
  assert.match(text, /\*\*gras\*\*/);
  assert.doesNotMatch(text, /<[a-z/]|\\[a-z]+|\$/i);
});

test("les listes gardent leur profondeur, leurs cases à cocher et leur numérotation", () => {
  const [list] = parseMarkdown(["- Parent", "\t1. Enfant", "\t2. Enfant bis"].join("\n"));
  assert.equal(list.kind, "list");
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].childrenOrdered, true);
  assert.equal(list.items[0].children.length, 2);

  const [tasks] = parseMarkdown("- [x] Relu\n- [ ] À relire");
  assert.deepEqual(tasks.items.map((item) => item.checked), [true, false]);
  assert.deepEqual(tasks.items.map((item) => item.text), ["Relu", "À relire"]);
});

test("un encadré Obsidian conserve sa tonalité et sa structure interne", () => {
  const [callout] = parseMarkdown([
    "> [!DANGER] Urgence absolue",
    "> Le rachis est un monobloc rigide.",
    ">",
    "> 1. Appeler la réanimation",
    "> 2. Préparer l'intubation",
  ].join("\n"));

  assert.equal(callout.kind, "callout");
  assert.equal(callout.tone, "danger");
  assert.equal(callout.title, "Urgence absolue");
  const inner = callout.blocks.at(-1);
  assert.equal(inner.kind, "list");
  assert.equal(inner.ordered, true);
  assert.equal(inner.items.length, 2);
});

test("les métadonnées de fiche alimentent l'en-tête au lieu d'être jetées", () => {
  const meta = parseFrontmatter(readFileSync(path.join(fichesDir, "asthme.md"), "utf8"));
  assert.equal(meta.title, "Asthme");
  assert.ok(meta.synonymes.includes("Asthme bronchique"));
  assert.ok(meta.tags.includes("sibilants"));
});

test("une fiche importée sans titres est découpée en sections navigables", () => {
  const document = buildFicheDocument(parseMarkdown(readFileSync(path.join(fichesDir, "psoriasis.md"), "utf8")));
  assert.equal(document.autoSectioned, true);
  assert.ok(document.sections.length >= 4, "les filets du vault deviennent des sections");
  assert.equal(document.sections[0].title, "Définition");
  assert.ok(document.sections[0].subsections.length >= 2, "les intertitres en gras deviennent des ancres");
  assert.deepEqual(document.appendix.map((section) => section.title), ["Provenance pédagogique"]);
});

test("une fiche éditoriale garde son découpage d'origine et ses annexes", () => {
  const document = buildFicheDocument(parseMarkdown(readFileSync(path.join(fichesDir, "asthme.md"), "utf8")));
  assert.equal(document.autoSectioned, false);
  assert.deepEqual(document.sections.slice(0, 3).map((section) => section.title), [
    "Définition",
    "Épidémiologie",
    "Physiopathologie",
  ]);
  assert.deepEqual(document.appendix.map((section) => section.title), ["Liens", "Références médicales"]);
  assert.ok(document.minutes >= 3);
});

test("les 156 fiches sont lisibles : sections ancrées, sans balisage résiduel", () => {
  const unsectioned = [];
  for (const file of fiches) {
    const source = readFileSync(path.join(fichesDir, file), "utf8");
    const blocks = parseMarkdown(source);
    const document = buildFicheDocument(blocks);

    const residue = textOf(flatten(blocks)).match(/<\/?[a-zA-Z][^>]*>|\\[a-zA-Z]+|\$/);
    assert.equal(residue, null, `${file} laisse passer du balisage brut : ${residue?.[0]}`);

    const ids = [
      ...document.sections.flatMap((section) => [section.id, ...section.subsections.map((sub) => sub.id)]),
      ...document.appendix.map((section) => section.id),
    ];
    assert.equal(new Set(ids).size, ids.length, `${file} produit des ancres dupliquées`);
    for (const section of document.sections) {
      assert.ok(section.title.trim().length > 0, `${file} produit une section sans titre`);
      assert.ok(section.blocks.length > 0, `${file} produit une section vide`);
    }
    if (document.sections.length === 0) unsectioned.push(file);
  }

  // Seule une fiche encore vide côté contenu peut ne produire aucune section.
  assert.deepEqual(unsectioned, ["cholestase.md"]);
});

test("le squelette canonique range chaque fiche dans les mêmes phases de lecture", () => {
  const document = buildFicheDocument(parseMarkdown(readFileSync(path.join(fichesDir, "appendicite-aigue.md"), "utf8")));

  // Les phases vides disparaissent : ici le bilan paraclinique est rédigé à
  // l'intérieur de l'examen clinique, la fiche n'a donc pas de phase dédiée.
  assert.deepEqual(document.groups.map((group) => group.label), [
    "Synthèse",
    "Tableau clinique",
    "Prise en charge",
  ]);
  assert.deepEqual(document.groups[1].sections.map((section) => section.title), [
    "Symptômes",
    "Signes",
    "Examen clinique",
  ]);
  // Le fil et le sommaire décrivent les mêmes sections, sans perte ni doublon.
  assert.deepEqual(
    document.groups.flatMap((group) => group.sections.map((section) => section.id)),
    document.sections.map((section) => section.id),
  );
});

test("une section hors séquence remonte à sa place canonique", () => {
  const document = buildFicheDocument(parseMarkdown(readFileSync(path.join(fichesDir, "syndrome-cushing.md"), "utf8")));
  const titles = document.sections.map((section) => section.title);

  assert.equal(document.reordered, true);
  assert.ok(titles.indexOf("Traitement") < titles.indexOf("Complications"), "les complications suivent le traitement");
  assert.deepEqual(document.groups.map((group) => group.key), ["synthese", "clinique", "diagnostic", "traitement"]);
});

test("une fiche découpée automatiquement garde son fil d'origine", () => {
  const document = buildFicheDocument(parseMarkdown(readFileSync(path.join(fichesDir, "psoriasis.md"), "utf8")));
  assert.equal(document.autoSectioned, true);
  assert.equal(document.reordered, false, "des titres devinés ne justifient pas de déplacer du texte");
});

test("chaque section porte une phase connue et un chapitre cohérent", () => {
  const groupKeys = new Set(FICHE_GROUPS.map((group) => group.key));

  for (const file of fiches) {
    const document = buildFicheDocument(parseMarkdown(readFileSync(path.join(fichesDir, file), "utf8")));
    for (const section of document.sections) {
      assert.ok(groupKeys.has(section.group), `${file} : phase inconnue « ${section.group} »`);
      if (section.chapter) {
        assert.equal(section.chapter.group, section.group, `${file} : ${section.title} classée hors de sa phase`);
      }
    }
    for (const section of document.appendix) {
      assert.equal(section.group, "ressources", `${file} : annexe hors des ressources`);
    }
  }
});

test("le vocabulaire des fiches retombe sur les chapitres canoniques", () => {
  const cases = [
    ["Symptômes", "symptomes"],
    ["Signes fonctionnels", "symptomes"],
    ["Signes physiques", "signes"],
    ["CAT en urgence", "urgence"],
    ["DD", "differentiel"],
    ["Diagnostics différentiels", "differentiel"],
    ["Examens complémentaires", "examens"],
    ["Facteurs de risque", "etiologie"],
    ["Références médicales", "references"],
  ];
  for (const [title, key] of cases) {
    assert.equal(classifyFicheSection(title)?.key, key, `« ${title} » devrait devenir « ${key} »`);
  }
  assert.equal(classifyFicheSection("Perfusion cérébrale"), null, "une section maison reste maison");
});
