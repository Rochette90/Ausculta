import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPatientPrompt, localPatientReply } from "../lib/ecos/engine.ts";
import { maxEcosScore, calculateEcosCriteria } from "../lib/ecos/scoring.ts";
import { gradeEcosStation, procedureResult, stationMaxScore, hasAnalysisStep } from "../lib/ecos/grading.ts";
import { BASIC_EXAMS, EXAM_CATALOG_BY_ID, examCatalogFor } from "../lib/ecos/exam-catalog.ts";
import { examOrderResult, procedureCovers, resolveExamOrders } from "../lib/ecos/exam-orders.ts";
import { DIAGNOSIS_BY_ID, diagnosisByLabel } from "../lib/ecos/diagnosis-catalog.ts";
import { ANALYSIS_PREFIX, normalizeEcosText, PROCEDURE_PREFIX } from "../lib/ecos/text.ts";

/**
 * Règles d'une nouvelle station d'entraînement (celles de `ecos-stations.test.mjs`
 * et `exam-catalog.test.mjs`), vérifiables sur un fichier isolé avant son
 * intégration au registre. Les stations de 5ᵉ année ont une étape « Analyse ».
 */
const FALLBACKS = [
  "Pardon docteur, je ne suis pas sûr de comprendre votre question.",
  "Je ne sais pas trop… vous pouvez me poser la question autrement ?",
  "Hmm… je ne vois pas bien ce que vous voulez dire, docteur.",
];
const HISTORY_QUESTIONS = [
  "Depuis quand ça a commencé ?",
  "Quels médicaments prenez-vous ?",
  "Avez-vous des allergies ?",
  "Avez-vous des antécédents médicaux ?",
  "Fumez-vous ?",
  "Qu'est-ce qui vous amène ?",
];
const pathologies = JSON.parse(readFileSync(new URL("../content/pathologies/index.json", import.meta.url), "utf8"));
const gesture = (procedure) => ({ role: "student", content: `${PROCEDURE_PREFIX}${procedure.label}` });
const order = (catalogId) => ({ role: "student", content: `${PROCEDURE_PREFIX}${EXAM_CATALOG_BY_ID.get(catalogId).label}` });

export function checkTrainingStation(scenario, diagnoses) {
  const { slug } = scenario;
  // Contenu complet et borné.
  assert.match(slug, /^[a-z0-9-]{3,80}$/);
  assert.ok(scenario.opening.length > 10 && scenario.opening.length <= 2_000, slug);
  assert.ok(scenario.brief.length >= 2, `${slug}: brief`);
  for (const [field, value] of Object.entries(scenario.history)) assert.ok(value.trim().length > 1, `${slug}.${field}`);
  for (const field of ["living", "feeling", "previousEpisodes", "course", "otherSymptoms"]) assert.ok(scenario.history[field].trim().length > 5, `${slug}.${field}`);
  assert.ok(scenario.history.otherSymptoms.split(/[.!?…]+\s/).length <= 2, `${slug}: otherSymptoms en un seul élément`);
  for (const rule of scenario.rules) {
    assert.ok(rule.keywords.length > 0 && rule.reply.length > 0 && rule.reply.length < 1_900, `${slug}/${rule.topic}`);
    assert.ok(rule.keywords.every((keyword) => normalizeEcosText(keyword).trim().length >= 2), `${slug}/${rule.topic}`);
  }
  if (scenario.proxy) assert.ok(scenario.voiceSex, `${slug}: voiceSex manquant`);

  // Feuille de porte : qui, où, pourquoi ; ni diagnostic ni spécialité.
  const note = scenario.brief[1];
  assert.match(note, /\d+ ans,.*(urgences|cabinet)/, `${slug}: feuille de porte`);
  assert.ok(!normalizeEcosText(note).includes(normalizeEcosText(scenario.diagnosisChoice.correct)), slug);
  assert.doesNotMatch(normalizeEcosText(note), / (cardio|neuro|pneumo|gastro|infectio|nephro|ortho|dermato|psychiatr|endocrino|thoraciqu|abdominal|epigastr|febril|cephal|dyspne)/, `${slug}: spécialité dans la feuille de porte`);

  // Barème : grille de 20 points + diagnostic à 2 points.
  assert.equal(scenario.diagnosisPoints, undefined, `${slug}: diagnostic à 2 points par défaut`);
  assert.equal(new Set(scenario.criteria.map((item) => item.id)).size, scenario.criteria.length, slug);
  assert.equal(maxEcosScore(scenario.criteria), 20, `${slug}: grille de 20 points`);
  assert.equal(stationMaxScore(scenario), 22, slug);
  for (const id of ["presentation", "exam", "communication"]) assert.ok(scenario.criteria.some((item) => item.id === id), `${slug}: ligne ${id}`);
  for (const criterion of scenario.criteria) {
    assert.ok(criterion.points >= 1 && criterion.groups.length >= 1, `${slug}/${criterion.id}`);
    assert.ok(criterion.groups.every((group) => group.length > 0), `${slug}/${criterion.id}`);
  }
  // 5ᵉ année : étape « Analyse » des examens, lecture attendue au débriefing.
  if (hasAnalysisStep(scenario)) {
    const line = scenario.criteria.find((item) => item.id === "analysis");
    assert.ok(line.points >= 2, `${slug}: analyse ≥ 2 points`);
    assert.ok(scenario.debrief.examReading?.length >= 3, `${slug}: examReading`);
    const tests = scenario.examination.filter((item) => item.category === "complementaire" && item.pertinent);
    for (const test of tests) assert.ok(!normalizeEcosText(procedureResult(scenario, test)).includes(normalizeEcosText(scenario.diagnosisChoice.correct)), `${slug}/${test.id}: le résultat nomme le diagnostic`);
    const reading = line.groups.map((group) => group[0].replace(/\$$/, "")).join(", ");
    const analysis = { role: "student", content: `${ANALYSIS_PREFIX}${reading}` };
    const earned = gradeEcosStation(scenario, [...tests.map(gesture), analysis]).criteria.find((item) => item.id === "analysis").earned;
    assert.equal(earned, line.points, `${slug}: analyse complète`);
  } else {
    assert.equal(scenario.debrief.examReading, undefined, `${slug}: examReading sans étape Analyse`);
  }

  // Débriefing.
  const { debrief } = scenario;
  assert.ok(debrief.diagnosis && debrief.summary, slug);
  for (const list of [debrief.keyFindings, debrief.redFlags, debrief.management, debrief.differentials]) assert.ok(list.length >= 3, slug);
  assert.ok(debrief.sources.length >= 1 && debrief.sources.every((source) => source.url.startsWith("https://")), slug);
  assert.ok(debrief.pathologySlugs.every((fiche) => pathologies.some((item) => item.slug === fiche)), `${slug}: fiche inconnue`);

  // Gestes : résultats, pertinents et distracteurs.
  const { examination } = scenario;
  assert.ok(examination.length >= 9, slug);
  assert.equal(new Set(examination.map((item) => item.id)).size, examination.length, slug);
  assert.equal(new Set(examination.map((item) => normalizeEcosText(item.label))).size, examination.length, slug);
  for (const category of ["constantes", "examen", "complementaire"]) assert.ok(examination.some((item) => item.category === category && item.pertinent), `${slug}: ${category}`);
  assert.ok(examination.filter((item) => !item.pertinent).length >= 3, slug);
  for (const procedure of examination) {
    const result = procedureResult(scenario, procedure);
    assert.ok(result.length > 5 && result.length < 1_900, `${slug}/${procedure.id}`);
  }
  const pertinent = examination.filter((item) => item.pertinent);
  const distractors = examination.filter((item) => !item.pertinent);
  const examLine = (messages) => gradeEcosStation(scenario, messages).criteria.find((item) => item.id === "exam");
  assert.equal(examLine(pertinent.map(gesture)).earned, examLine(pertinent.map(gesture)).points, `${slug}: gestes attendus`);
  assert.equal(examLine(distractors.map(gesture)).earned, 0, `${slug}: distracteurs`);
  assert.ok(examLine(examination.map(gesture)).earned < examLine(examination.map(gesture)).points, `${slug}: tout demander`);
  const keywordOnly = calculateEcosCriteria(scenario.criteria, examination.map(gesture));
  assert.equal(keywordOnly.reduce((total, item) => total + item.earned, 0), 0, `${slug}: libellés des gestes`);
  assert.equal(gradeEcosStation(scenario, distractors.map(gesture)).score, 0, `${slug}: distracteurs, score`);

  // Catalogue commun.
  for (const procedure of examination) {
    const covers = procedureCovers(procedure);
    for (const id of [...covers, ...(procedure.key ?? [])]) assert.ok(EXAM_CATALOG_BY_ID.has(id), `${slug}/${procedure.id}: ${id}`);
    for (const id of procedure.key ?? []) assert.ok(covers.includes(id), `${slug}/${procedure.id}: clé ${id}`);
  }
  for (const id of [...Object.keys(scenario.catalogResults ?? {}), ...(scenario.acceptable ?? [])]) assert.ok(EXAM_CATALOG_BY_ID.has(id), `${slug}: ${id}`);
  for (const item of examCatalogFor(scenario.patient)) {
    const outcome = examOrderResult(scenario, item.id);
    assert.ok(outcome && outcome.result.length > 5 && outcome.result.length < 1_900, `${slug}/${item.id}`);
  }
  const keys = [...new Set(pertinent.map((procedure) => (procedure.key ?? procedureCovers(procedure))[0]))];
  const fromCatalog = gradeEcosStation(scenario, keys.map(order)).criteria.find((item) => item.id === "exam");
  assert.equal(fromCatalog.earned, fromCatalog.points, `${slug}: examens attendus via le catalogue`);
  const basics = [...BASIC_EXAMS].filter((id) => !examination.some((procedure) => !procedure.pertinent && procedureCovers(procedure).includes(id)));
  assert.equal(resolveExamOrders(scenario, basics.map(order)).unhelpful.length, 0, `${slug}: gestes de base`);

  // Patient : réponses scriptées et consigne.
  for (const question of HISTORY_QUESTIONS) {
    const reply = localPatientReply(scenario, question);
    assert.ok(!FALLBACKS.includes(reply), `${slug}: ${question}`);
  }
  assert.match(localPatientReply(scenario, "On passe à l'examen clinique"), /^D’accord, allez-y/, slug);
  const prompt = buildPatientPrompt(scenario);
  assert.ok(prompt.length < 12_000, `${slug}: consigne trop longue`);
  assert.ok(!prompt.includes(debrief.diagnosis), `${slug}: diagnostic dans la consigne`);

  // Diagnostics dans la liste commune.
  assert.ok(diagnoses && diagnoses.accepted.length >= 1, `${slug}: diagnostics attendus`);
  assert.ok(diagnoses.differentials.length >= 3, `${slug}: au moins 3 différentiels`);
  for (const id of [...diagnoses.accepted, ...diagnoses.differentials.flatMap((item) => item.ids)]) assert.ok(DIAGNOSIS_BY_ID.has(id), `${slug}: ${id} absent de la liste`);
  for (const item of diagnoses.differentials) assert.ok(!item.ids.some((id) => diagnoses.accepted.includes(id)), `${slug}: ${item.label}`);
  for (const distractor of scenario.diagnosisChoice.distractors) {
    const entry = diagnosisByLabel(distractor);
    if (entry) assert.ok(!diagnoses.accepted.includes(entry.id), `${slug}: ${distractor}`);
  }
}
