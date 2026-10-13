import assert from "node:assert/strict";
import test from "node:test";
import { BASIC_EXAMS, EXAM_CATALOG, EXAM_CATALOG_BY_ID, EXAM_GROUPS, examCatalogFor } from "../lib/ecos/exam-catalog.ts";
import { examOrderResult, procedureCovers, resolveExamOrders } from "../lib/ecos/exam-orders.ts";
import { ECOS_SCENARIOS, ecosStationView } from "../lib/ecos/stations/index.ts";
import { gradeEcosStation } from "../lib/ecos/grading.ts";
import { normalizeEcosText, PROCEDURE_PREFIX } from "../lib/ecos/text.ts";

const order = (catalogId) => ({ role: "student", content: `${PROCEDURE_PREFIX}${EXAM_CATALOG_BY_ID.get(catalogId).label}` });
const examLine = (scenario, messages) => gradeEcosStation(scenario, messages).criteria.find((item) => item.id === "exam");

test("le catalogue commun est cohérent", () => {
  assert.ok(EXAM_CATALOG.length >= 90);
  assert.equal(new Set(EXAM_CATALOG.map((item) => item.id)).size, EXAM_CATALOG.length);
  assert.equal(new Set(EXAM_CATALOG.map((item) => normalizeEcosText(item.label))).size, EXAM_CATALOG.length);
  for (const item of EXAM_CATALOG) {
    assert.ok(EXAM_GROUPS.includes(item.group), item.id);
    assert.match(item.id, /^[a-z0-9-]{1,60}$/);
    assert.ok(item.normal.length > 5, item.id);
  }
  for (const id of BASIC_EXAMS) assert.ok(EXAM_CATALOG_BY_ID.has(id), id);
  // Examens réservés à un sexe ou à un âge.
  assert.ok(!examCatalogFor({ sex: "M", age: 30 }).some((item) => item.id === "beta-hcg"));
  assert.ok(examCatalogFor({ sex: "F", age: 30 }).some((item) => item.id === "beta-hcg"));
  assert.ok(!examCatalogFor({ sex: "M", age: 2 }).some((item) => item.id === "phq9"));
});

test("la liste d'examens ne dépend que du sexe et de l'âge du patient, jamais du cas", () => {
  for (const scenario of ECOS_SCENARIOS) {
    const view = ecosStationView(scenario, { candidateTitle: "", specialty: null });
    const expected = examCatalogFor(scenario.patient).map((item) => item.id).sort();
    assert.deepEqual(view.procedures.map((item) => item.id).sort(), expected, scenario.slug);
  }
});

test("chaque station rattache ses gestes au catalogue et rend un résultat pour chaque examen", () => {
  for (const scenario of ECOS_SCENARIOS) {
    const { slug } = scenario;
    for (const procedure of scenario.examination) {
      const covers = procedureCovers(procedure);
      assert.ok(covers.length >= 1, `${slug}/${procedure.id}`);
      for (const id of [...covers, ...(procedure.key ?? [])]) assert.ok(EXAM_CATALOG_BY_ID.has(id), `${slug}/${procedure.id}: ${id}`);
      for (const id of procedure.key ?? []) assert.ok(covers.includes(id), `${slug}/${procedure.id}: clé ${id}`);
    }
    for (const id of [...Object.keys(scenario.catalogResults ?? {}), ...(scenario.acceptable ?? [])]) {
      assert.ok(EXAM_CATALOG_BY_ID.has(id), `${slug}: ${id}`);
    }
    for (const item of examCatalogFor(scenario.patient)) {
      const outcome = examOrderResult(scenario, item.id);
      assert.ok(outcome && outcome.result.length > 5 && outcome.result.length < 1_900, `${slug}/${item.id}`);
    }
  }
});

test("demander les bons examens du catalogue remplit la ligne d'examen, tout demander est pénalisé", () => {
  for (const scenario of ECOS_SCENARIOS) {
    const { slug } = scenario;
    const pertinent = scenario.examination.filter((procedure) => procedure.pertinent);
    const keys = [...new Set(pertinent.map((procedure) => (procedure.key ?? procedureCovers(procedure))[0]))];
    const line = examLine(scenario, keys.map(order));
    assert.equal(line.earned, line.points, `${slug}: examens attendus`);
    const everything = examCatalogFor(scenario.patient).map((item) => order(item.id));
    assert.ok(examLine(scenario, everything).earned < line.points, `${slug}: tout demander`);
    // Un examen sans rapport coûte ; les gestes de base non jugés inutiles, non.
    const { unhelpful } = resolveExamOrders(scenario, [order("gastroscopie")]);
    const gastroscopyExpected = scenario.examination.some((procedure) => procedure.pertinent && procedureCovers(procedure).includes("gastroscopie"));
    if (!gastroscopyExpected) assert.equal(unhelpful.length, 1, slug);
    const basics = [...BASIC_EXAMS].filter((id) => !scenario.examination.some((procedure) => !procedure.pertinent && procedureCovers(procedure).includes(id)));
    assert.equal(resolveExamOrders(scenario, basics.map(order)).unhelpful.length, 0, `${slug}: gestes de base`);
  }
});

test("un bilan groupé se détaille examen par examen, sans révéler le reste", () => {
  const pancreatitis = ECOS_SCENARIOS.find((scenario) => scenario.slug === "pancreatite-aigue");
  assert.match(examOrderResult(pancreatitis, "lipase").result, /2 400/);
  assert.doesNotMatch(examOrderResult(pancreatitis, "fsc").result, /lipase/i);
  // Ordonner la FSC seule ne valide pas la biologie attendue (la lipase est la clé).
  const biology = pancreatitis.examination.find((procedure) => procedure.id === "biologie");
  assert.ok(!resolveExamOrders(pancreatitis, [order("fsc")]).satisfied.includes(biology));
  assert.ok(resolveExamOrders(pancreatitis, [order("lipase")]).satisfied.includes(biology));
  // Un examen non décrit par la station rend le résultat normal du catalogue.
  assert.equal(examOrderResult(pancreatitis, "eeg").result, EXAM_CATALOG_BY_ID.get("eeg").normal);
});

test("la relecture par le modèle voit les examens attendus demandés dans le catalogue", async () => {
  const { reviewTranscript } = await import("../lib/ecos/review.ts");
  const chest = ECOS_SCENARIOS.find((scenario) => scenario.slug === "douleur-thoracique-aigue");
  const text = reviewTranscript(chest, [order("ecg"), order("gastroscopie")]);
  assert.match(text, /Geste demandé par l’étudiant : ECG 12 dérivations/);
  assert.doesNotMatch(text, /Gastroscopie/);
});
