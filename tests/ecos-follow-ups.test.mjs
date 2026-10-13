import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { FOLLOW_UP_QUESTIONS, followUpLine, followUpReport } from "../lib/ecos/follow-ups.ts";
import { gradeEcosStation } from "../lib/ecos/grading.ts";
import { communicationReport } from "../lib/ecos/communication.ts";
import { ECOS_SCENARIOS } from "../lib/ecos/stations/index.ts";
import { usesReservedPrefix } from "../lib/ecos/text.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("les réponses aux relances ne rapportent aucun point, même avec tous les mots-clés", () => {
  for (const scenario of ECOS_SCENARIOS) {
    const base = [{ role: "student", content: "Bonjour, qu'est-ce qui vous amène ?" }];
    const everything = scenario.criteria.flatMap((criterion) => criterion.groups.map((group) => group[0].replace(/\$$/, ""))).join(", ");
    const withAnswers = [...base, { role: "student", content: followUpLine("differentials", everything) }, { role: "student", content: followUpLine("findings", everything) }];
    assert.equal(gradeEcosStation(scenario, withAnswers).score, gradeEcosStation(scenario, base).score, scenario.slug);
    assert.deepEqual(communicationReport(withAnswers), communicationReport(base), scenario.slug);
  }
});

test("le bilan met chaque réponse en regard des éléments attendus du débriefing", async () => {
  const scenario = ECOS_SCENARIOS[0];
  const report = followUpReport(scenario, [{ role: "student", content: followUpLine("findings", "Douleur constrictive, sus-décalage ST.") }]);
  assert.deepEqual(report.map((item) => item.id), ["findings"]);
  assert.equal(report[0].answer, "Douleur constrictive, sus-décalage ST.");
  assert.deepEqual(report[0].expected, scenario.debrief.keyFindings);
  // Les différentiels se choisissent dans la liste commune et sont comparés à ceux du débriefing.
  const { differentialsLine, differentialsReport } = await import("../lib/ecos/differentials.ts");
  const differentials = differentialsReport(scenario, [{ role: "student", content: differentialsLine(["dissection-aortique", "pneumothorax", "reflux-gastro-oesophagien"]) }]);
  assert.deepEqual(differentials.expected.map((item) => item.found), [true, false, false, true]);
  assert.deepEqual(differentials.chosen.map((item) => item.expected), [true, true, false]);
  // Le navigateur ne reçoit que le texte des questions avant la fin.
  assert.ok(FOLLOW_UP_QUESTIONS.every((item) => Object.keys(item).sort().join() === "id,question"));
  // Dans le chat, l'étudiant ne peut pas imiter une réponse à l'examinateur ni des différentiels.
  assert.ok(usesReservedPrefix("Réponse à l’examinateur (findings) : …"));
  assert.ok(usesReservedPrefix("Diagnostics différentiels : Embolie pulmonaire"));
});

test("le serveur n'enregistre les relances qu'une fois la synthèse ouverte, bornées", async () => {
  const route = await read("../app/api/ecos/session/[id]/route.ts");
  assert.match(route, /answer\.length > MAX_FOLLOW_UP_LENGTH/);
  assert.match(route, /if \(started\) for \(const \[followUpId, answer\] of synthesis\.followUps\)/);
  // Le bilan (partagé par la fin de station et l'historique) inclut les relances.
  assert.match(await read("../lib/ecos/report.ts"), /followUps: followUpReport\(scenario, transcript\)/);
  assert.match(route, /buildStationReport\(scenario, stored, id\)/);
});

test("l'entretien annoté place chaque point de grille sur le message qui l'a fait gagner", async () => {
  const { annotatedInterview } = await import("../lib/ecos/annotations.ts");
  const chest = ECOS_SCENARIOS.find((scenario) => scenario.slug === "douleur-thoracique-aigue");
  const label = (id) => chest.criteria.find((criterion) => criterion.id === id).label;
  const lines = annotatedInterview(chest, [
    { role: "student", content: "Bonjour, je suis le médecin assistant." },
    { role: "patient", content: "Bonjour docteur." },
    { role: "student", content: "Êtes-vous allergique à un médicament ?" },
    { role: "student", content: "Et des allergies alimentaires ?" },
    { role: "student", content: "Geste : ECG 12 dérivations" },
    { role: "patient", content: "Examinateur : rythme sinusal." },
    { role: "student", content: followUpLine("findings", "Bonjour, allergies, irradiation") },
  ]);
  assert.deepEqual(lines.map((line) => line.role), ["student", "patient", "student", "student", "gesture", "examiner"]);
  assert.ok(lines[0].criteria.includes(label("presentation")));
  assert.ok(lines[2].criteria.includes(label("treatments")));
  // Un même élément n'est crédité qu'une fois, sur sa première occurrence.
  assert.deepEqual(lines[3].criteria, []);
  // Le navigateur ne reçoit que des libellés de grille, jamais les mots-clés.
  const allowed = new Set(chest.criteria.map((criterion) => criterion.label));
  assert.ok(lines.flatMap((line) => line.criteria).every((item) => allowed.has(item.replace(/ \(relecture\)$/, ""))));
});

test("les questions hors script remontent dans l'administration des stations", async () => {
  const { unscriptedQuestions } = await import("../lib/ecos/engine.ts");
  const chest = ECOS_SCENARIOS.find((scenario) => scenario.slug === "douleur-thoracique-aigue");
  assert.deepEqual(unscriptedQuestions(chest, "Depuis quand avez-vous mal ?"), []);
  assert.deepEqual(unscriptedQuestions(chest, "Avez-vous des allergies ?"), []);
  assert.deepEqual(unscriptedQuestions(chest, "Bonjour, comment allez-vous ?"), []);
  assert.deepEqual(unscriptedQuestions(chest, "Est-ce que vous faites du vélo ?"), ["Est-ce que vous faites du vélo"]);
  const [insights, page] = await Promise.all([read("../lib/admin/ecos-insights.ts"), read("../app/(app)/admin/stations/page.tsx")]);
  assert.match(insights, /usesReservedPrefix\(content\)/);
  // La garde d'administration précède toute lecture.
  assert.ok(page.indexOf("requireAdminUser(") < page.indexOf("getAdminUnscriptedQuestions(days)"));
});

test("l'annonce au patient est évaluée à part et ne rapporte aucun point", async () => {
  const { announcementReport, localAnnouncementReply, buildAnnouncementPrompt, MAX_ANNOUNCEMENT_MESSAGES } = await import("../lib/ecos/announcement.ts");
  const { ANNOUNCE_PREFIX } = await import("../lib/ecos/text.ts");
  for (const scenario of ECOS_SCENARIOS) {
    const base = [{ role: "student", content: "Bonjour, qu'est-ce qui vous amène ?" }];
    const everything = scenario.criteria.flatMap((criterion) => criterion.groups.map((group) => group[0].replace(/\$$/, ""))).join(", ");
    const announced = [...base, { role: "student", content: `${ANNOUNCE_PREFIX}${everything}` }];
    assert.equal(gradeEcosStation(scenario, announced).score, gradeEcosStation(scenario, base).score, scenario.slug);
    assert.deepEqual(communicationReport(announced), communicationReport(base), scenario.slug);
    assert.doesNotMatch(buildAnnouncementPrompt(scenario), new RegExp(scenario.diagnosisChoice.correct, "i"), scenario.slug);
  }
  const report = announcementReport([
    { role: "student", content: `${ANNOUNCE_PREFIX}Je comprends que ce soit inquiétant. Nous allons faire une prise de sang. Avez-vous des questions ?` },
  ]);
  assert.deepEqual([report.done, report.nextSteps, report.empathy, report.understanding], [true, true, true, true]);
  assert.equal(announcementReport([]).done, false);
  assert.ok(announcementReport([]).tips.length === 1);
  assert.match(localAnnouncementReply("Vous avez une dyspnée.", 1), /comprendre/);
  assert.equal(MAX_ANNOUNCEMENT_MESSAGES, 4);
  assert.ok(usesReservedPrefix(`${ANNOUNCE_PREFIX}…`));
  const chat = await read("../app/api/ecos/chat/route.ts");
  // Après l'ouverture de la synthèse, seule l'annonce est encore permise, bornée.
  assert.match(chat, /if \(synthesisOpen && !announcement\)/);
  assert.match(chat, /if \(announcement && !synthesisOpen\)/);
  assert.match(chat, /announced >= MAX_ANNOUNCEMENT_MESSAGES/);
  assert.match(chat, /p_content: announcement \? `\$\{ANNOUNCE_PREFIX\}\$\{message\}` : message/);
  // Une seule question du patient par réplique : la suite est coupée, à l'écrit comme à la voix.
  assert.match(chat, /if \(askedQuestion\) return;/);
});

test("rejouer une station change le tempérament du patient, jamais les faits", async () => {
  const { PATIENT_VARIANTS, patientVariant, withPatientVariant } = await import("../lib/ecos/variants.ts");
  const { buildPatientPrompt } = await import("../lib/ecos/engine.ts");
  const ids = Array.from({ length: 60 }, (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`);
  const seen = new Set(ids.map((id) => patientVariant(id).id));
  assert.ok(seen.size >= 4, "plusieurs tempéraments au fil des séances");
  assert.equal(patientVariant(ids[0]).id, patientVariant(ids[0]).id);
  for (const scenario of ECOS_SCENARIOS) {
    for (const id of ids.slice(0, 12)) {
      const played = withPatientVariant(scenario, id);
      // Seul le persona change : faits, règles, examens et grille identiques.
      assert.deepEqual({ ...played, persona: "" }, { ...scenario, persona: "" }, scenario.slug);
      assert.ok(buildPatientPrompt(played).length < 12_000, scenario.slug);
    }
  }
  assert.ok(PATIENT_VARIANTS.every((variant) => !/diagnost/i.test(variant.trait)));
  const chat = await read("../app/api/ecos/chat/route.ts");
  assert.match(chat, /const scenario = withPatientVariant\(station, sessionId\);/);
});

test("la liste des diagnostics s'ouvre à trois lettres et ne dépend pas de la station", async () => {
  const { searchDiagnoses, DIAGNOSIS_CATALOG } = await import("../lib/ecos/diagnosis-catalog.ts");
  assert.ok(DIAGNOSIS_CATALOG.length >= 150);
  assert.deepEqual(searchDiagnoses("py"), []);
  assert.ok(searchDiagnoses("pyé").some((entry) => entry.label === "Pyélonéphrite aiguë"));
  // Synonymes et accents : « infarctus » trouve le STEMI, « horton » l'artérite temporale.
  assert.ok(searchDiagnoses("infarctus").some((entry) => entry.id === "sca-st"));
  assert.ok(searchDiagnoses("horton").some((entry) => entry.id === "arterite-temporale"));
  const picker = await read("../components/ecos/DiagnosisPicker.tsx");
  // Le composant ne lit que la liste publique, jamais les réponses attendues.
  assert.doesNotMatch(picker, /stations\/diagnoses|STATION_DIAGNOSES/);
});
