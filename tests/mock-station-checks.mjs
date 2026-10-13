import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPatientPrompt, localPatientReply } from "../lib/ecos/engine.ts";
import { maxEcosScore, calculateEcosCriteria } from "../lib/ecos/scoring.ts";
import { gradeEcosStation, procedureResult, stationMaxScore, hasAnalysisStep } from "../lib/ecos/grading.ts";
import { BASIC_EXAMS, EXAM_CATALOG_BY_ID, examCatalogFor } from "../lib/ecos/exam-catalog.ts";
import { examOrderResult, procedureCovers, resolveExamOrders } from "../lib/ecos/exam-orders.ts";
import { DIAGNOSIS_BY_ID, diagnosisByLabel } from "../lib/ecos/diagnosis-catalog.ts";
import { normalizeEcosText, PROCEDURE_PREFIX } from "../lib/ecos/text.ts";

/**
 * Règles communes à toute station d'examen blanc (3ᵉ année) : celles des
 * stations d'entraînement, plus un barème centré sur l'anamnèse et le status
 * (grille de 21 points, diagnostic à 1 point, au moins 3 gestes d'examen
 * physique attendus, prise en charge à 2 points au plus).
 * Partagé par `ecos-mock-stations.test.mjs` et la vérification d'un fichier isolé.
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

export function checkMockStation(scenario, diagnoses) {
  const { slug } = scenario;
  // Contenu complet et borné.
  assert.match(slug, /^[a-z0-9-]{3,80}$/);
  assert.ok(scenario.opening.length > 10 && scenario.opening.length <= 2_000, slug);
  assert.ok(scenario.brief.length >= 3, `${slug}: brief`);
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

  // Barème de 3ᵉ année : anamnèse et status d'abord.
  assert.equal(scenario.diagnosisPoints, 1, `${slug}: diagnostic à 1 point`);
  assert.equal(new Set(scenario.criteria.map((item) => item.id)).size, scenario.criteria.length, slug);
  assert.equal(maxEcosScore(scenario.criteria), 21, `${slug}: grille de 21 points`);
  assert.equal(stationMaxScore(scenario), 22, slug);
  for (const id of ["presentation", "treatments", "exam", "communication"]) assert.ok(scenario.criteria.some((item) => item.id === id), `${slug}: ligne ${id}`);
  for (const criterion of scenario.criteria) {
    assert.ok(criterion.points >= 1 && criterion.groups.length >= 1, `${slug}/${criterion.id}`);
    assert.ok(criterion.groups.every((group) => group.length > 0), `${slug}/${criterion.id}`);
  }
  assert.ok(scenario.criteria.find((item) => item.id === "exam").points >= 5, `${slug}: status ≥ 5 points`);
  const management = scenario.criteria.find((item) => item.id === "management");
  if (management) assert.ok(management.points <= 2, `${slug}: prise en charge ≤ 2 points`);
  const history = scenario.criteria.filter((item) => !["exam", "management", "communication"].includes(item.id)).reduce((sum, item) => sum + item.points, 0);
  assert.ok(history >= 12, `${slug}: anamnèse ≥ 12 points (${history})`);
  assert.ok(!hasAnalysisStep(scenario), `${slug}: pas d'étape Analyse en 3ᵉ année`);

  // Débriefing.
  const { debrief } = scenario;
  assert.ok(debrief.diagnosis && debrief.summary, slug);
  for (const list of [debrief.keyFindings, debrief.redFlags, debrief.management, debrief.differentials]) assert.ok(list.length >= 3, slug);
  assert.ok(debrief.sources.length >= 1 && debrief.sources.every((source) => source.url.startsWith("https://")), slug);
  assert.ok(debrief.pathologySlugs.every((fiche) => pathologies.some((item) => item.slug === fiche)), `${slug}: fiche inconnue`);
  assert.equal(debrief.examReading, undefined, slug);

  // Gestes : résultats, pertinents et distracteurs.
  const { examination } = scenario;
  assert.ok(examination.length >= 9, slug);
  assert.equal(new Set(examination.map((item) => item.id)).size, examination.length, slug);
  assert.equal(new Set(examination.map((item) => normalizeEcosText(item.label))).size, examination.length, slug);
  // En 3ᵉ année, un cas typique peut se passer d'examen complémentaire : constantes et status suffisent.
  for (const category of ["constantes", "examen"]) assert.ok(examination.some((item) => item.category === category && item.pertinent), `${slug}: ${category}`);
  assert.ok(examination.filter((item) => item.category === "examen" && item.pertinent).length >= 3, `${slug}: au moins 3 gestes d'examen physique attendus`);
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
