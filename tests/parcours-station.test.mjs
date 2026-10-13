import assert from "node:assert/strict";
import test from "node:test";
import { ECOS_SCENARIOS, ecosStationView, getEcosScenario } from "../lib/ecos/stations/index.ts";
import { EXAMINER_PREFIX, localPatientReply } from "../lib/ecos/engine.ts";
import { gradeEcosStation, procedureResult, stationMaxScore } from "../lib/ecos/grading.ts";
import { DIAGNOSIS_PREFIX, PLAN_PREFIX, PROCEDURE_PREFIX } from "../lib/ecos/text.ts";

/**
 * Parcours complet d'une station, de l'ouverture au bilan, avec les mêmes
 * fonctions que le serveur (la notation finale passe par `gradeEcosStation`,
 * via `lib/ecos/report.ts`). Seule la persistance (Supabase) et le transport
 * HTTP ne sont pas traversés : ils sont couverts par les tests d'API.
 * Le scénario est choisi dynamiquement pour survivre aux ajouts de stations.
 */
const scenario = ECOS_SCENARIOS.find((item) => item.examination.some((procedure) => procedure.pertinent) && item.diagnosisChoice);
assert.ok(scenario, "au moins une station complète est requise");

test("parcours : de la phrase d'ouverture au bilan noté", () => {
  // 1. Ouverture : ce que l'étudiant voit d'abord.
  const transcript = [{ role: "patient", content: scenario.opening }];

  // 2. Anamnèse : le moteur local répond aux questions d'histoire de base.
  for (const question of ["Depuis quand ça a commencé ?", "Quels médicaments prenez-vous ?", "Avez-vous des allergies ?"]) {
    transcript.push({ role: "student", content: question });
    const reply = localPatientReply(scenario, question, transcript.filter((line) => line.role === "student").length);
    assert.ok(reply.length > 0 && reply.length <= 1_200, `réponse bornée pour « ${question} »`);
    assert.ok(!reply.startsWith(EXAMINER_PREFIX), "la voix du patient ne parle jamais comme l'examinateur");
    transcript.push({ role: "patient", content: reply });
  }

  // 3. Examen clinique : chaque geste attendu débloque son résultat.
  const expected = scenario.examination.filter((procedure) => procedure.pertinent);
  assert.ok(expected.length > 0);
  for (const procedure of expected) {
    transcript.push({ role: "student", content: `${PROCEDURE_PREFIX}${procedure.label}` });
    transcript.push({ role: "patient", content: `${EXAMINER_PREFIX}${procedureResult(scenario, procedure)}` });
  }

  // 4. Synthèse : diagnostic correct et prise en charge rédigés comme l'interface les enregistre.
  transcript.push({ role: "student", content: `${DIAGNOSIS_PREFIX}${scenario.diagnosisChoice.correct}` });
  transcript.push({ role: "student", content: `${PLAN_PREFIX}Je surveille le patient, je traite la cause et je réévalue.` });

  // 5. Bilan : la notation du parcours complet reconnaît le diagnostic et les gestes.
  const bilan = gradeEcosStation(scenario, transcript);
  assert.equal(bilan.maxScore, stationMaxScore(scenario));
  assert.ok(bilan.score > 0 && bilan.score <= bilan.maxScore, `score cohérent (${bilan.score}/${bilan.maxScore})`);
  const diagnosis = bilan.criteria.find((criterion) => criterion.id === "diagnosis");
  assert.equal(diagnosis.earned, diagnosis.points, "le bon diagnostic donne tous ses points");
  assert.equal(bilan.synthesis.chosen, scenario.diagnosisChoice.correct);
  assert.equal(bilan.synthesis.correct, scenario.diagnosisChoice.correct);
  assert.deepEqual(bilan.procedures.missed, [], "aucun geste attendu ne manque après le parcours complet");

  // 6. Débriefing : le contenu pédagogique du bilan est complet.
  // (Sa vue navigateur vit dans lib/ecos/debrief.ts, marqué server-only :
  // seules ses données source sont vérifiées ici.)
  assert.ok(scenario.debrief.diagnosis.length > 0);
  assert.ok(scenario.debrief.keyFindings.length > 0 && scenario.debrief.management.length > 0);
  assert.ok(scenario.debrief.pathologySlugs.every((slug) => typeof slug === "string"));
});

test("parcours vide : sans entretien, le bilan ne donne ni diagnostic ni gestes", () => {
  const bilan = gradeEcosStation(scenario, [{ role: "patient", content: scenario.opening }]);
  const diagnosis = bilan.criteria.find((criterion) => criterion.id === "diagnosis");
  assert.equal(diagnosis.earned, 0);
  assert.equal(bilan.synthesis.chosen, null);
  assert.ok(bilan.procedures.missed.length > 0, "les gestes attendus sont signalés manquants");
  assert.ok(bilan.score < bilan.maxScore);
});

test("parcours : la vue publique de la station ne fuit ni résultats ni diagnostic", () => {
  const view = ecosStationView(scenario, { candidateTitle: "Titre candidat", specialty: null });
  const serialized = JSON.stringify(view);
  for (const procedure of scenario.examination) {
    if (procedure.result) assert.ok(!serialized.includes(procedure.result), `le résultat de « ${procedure.id} » ne doit pas partir au navigateur`);
    assert.ok(!("image" in (view.procedures.find((item) => item.id === procedure.id) ?? {})), "l'image d'examen n'est révélée qu'après le geste");
  }
  assert.ok(view.code && view.code.startsWith("station-"), "la station est adressée par son code public");
  assert.equal(getEcosScenario(scenario.slug), scenario);
});
