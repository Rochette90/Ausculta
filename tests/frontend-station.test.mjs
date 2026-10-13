import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("la station dit quelle voix on entend, et combien de temps elle a mis", async () => {
  const station = await read("../components/ecos/EcosStation.tsx");
  // La source suit les événements réels : audio réaliste reçu, ou repli navigateur.
  assert.match(station, /setVoiceSource\(event\.voice \? "realiste" : "navigateur"\)/);
  assert.match(station, /setVoiceSource\("realiste"\);[\s\S]+player\.pushAudio/);
  assert.match(station, /Voix du navigateur — la voix réaliste n’a pas pris le relais/);
  assert.match(station, /premier son à \$\{voiceLatencyMs\} ms/);
  // Pendant que le texte arrive et que la voix se prépare, l'état le dit.
  assert.match(station, /loading && streamingText \? "Prépare sa réponse…"/);
  assert.match(station, /className="patient-status" role="status"/);
});

test("le bilan de communication vit dans son propre composant", async () => {
  const [station, report] = await Promise.all([
    read("../components/ecos/EcosStation.tsx"),
    read("../components/ecos/StationReport.tsx"),
  ]);
  assert.match(station, /import \{ CommunicationReport, DebriefList, messageView \} from "\.\/StationReport";/);
  assert.match(report, /export function CommunicationReport/);
  assert.match(report, /export function messageView/);
  assert.doesNotMatch(station, /function CommunicationReport/);
});

test("le catalogue marque les stations déjà réalisées", async () => {
  const [catalog, page, cases] = await Promise.all([
    read("../components/ecos/CaseCatalog.tsx"),
    read("../app/(app)/cas/page.tsx"),
    read("../lib/ecos/cases.ts"),
  ]);
  assert.match(cases, /export async function getCompletedStationCodes/);
  assert.match(cases, /\.eq\("status", "completed"\)/);
  assert.match(page, /getCompletedStationCodes\(user\.id\)/);
  assert.match(catalog, /Déjà réalisée/);
  assert.match(catalog, /done\.has\(item\.code\) \? "Rejouer" : "Commencer"/);
});

test("on peut couper la parole au patient, au bouton ou à Échap", async () => {
  const station = await read("../components/ecos/EcosStation.tsx");
  assert.match(station, /Interrompre le patient/);
  assert.match(station, /event\.key === "Escape"\) interruptPatient\(\)/);
});

test("l'analyse et la prise en charge se dictent sans rien envoyer au patient", async () => {
  const station = await read("../components/ecos/EcosStation.tsx");
  assert.match(station, /toggleFieldDictation\("analysis"\)/);
  assert.match(station, /toggleFieldDictation\("plan"\)/);
  assert.match(station, /if \(field === "analysis"\) setAnalysis\(bounded\);\s+else if \(field === "plan"\) setPlan\(bounded\);/);
});

test("l'image d'un examen n'arrive qu'avec son résultat, et seulement depuis /ecos/", async () => {
  const [route, types, station] = await Promise.all([
    read("../app/api/ecos/session/[id]/procedure/route.ts"),
    read("../lib/ecos/types.ts"),
    read("../components/ecos/EcosStation.tsx"),
  ]);
  // La vue de la station ne transporte jamais l'image avant le geste.
  assert.match(types, /procedures: Array<Pick<EcosProcedure, "id" \| "label" \| "category"> & \{ group: string \}>/);
  assert.match(route, /order\.image\.src\.startsWith\("\/ecos\/"\)/);
  assert.match(station, /<ProcedureFigure image=\{lastResult\.image\} \/>/);
  assert.match(station, /<ProcedureFigure image=\{item\.image\} \/>/);
});

test("la question dictée part après un silence, pas à la première pause", async () => {
  const station = await read("../components/ecos/EcosStation.tsx");
  const { joinTranscripts, SPEECH_END_SILENCE_MS } = await import("../lib/ecos/dictation.ts");
  assert.ok(SPEECH_END_SILENCE_MS >= 1_200);
  assert.match(station, /recognition\.continuous = true;\s+recognition\.onstart/);
  assert.match(station, /silenceTimer = window\.setTimeout\(\(\) => finish\(true\), SPEECH_END_SILENCE_MS\)/);
  // Une hésitation au milieu de la phrase ne déclenche plus l'envoi.
  assert.doesNotMatch(station, /understood = true;\s+setInput\(heard\);\s+void sendMessage\(heard\)/);
  // Morceaux successifs, et répétition du début de phrase (Chrome Android).
  assert.equal(joinTranscripts(["depuis quand", " avez-vous mal ?"]), "depuis quand avez-vous mal ?");
  assert.equal(joinTranscripts(["depuis quand", "depuis quand avez-vous mal"]), "depuis quand avez-vous mal");
  assert.equal(joinTranscripts(["", "  "]), "");
});

test("la station se choisit sur sa feuille de porte, sans diagnostic ni spécialité", async () => {
  const { ECOS_SCENARIOS, ecosDoorNote } = await import("../lib/ecos/stations/index.ts");
  const { normalizeEcosText } = await import("../lib/ecos/text.ts");
  const [cases, catalog, dashboard, station] = await Promise.all([
    read("../lib/ecos/cases.ts"),
    read("../components/ecos/CaseCatalog.tsx"),
    read("../components/dashboard/UserDashboard.tsx"),
    read("../components/ecos/EcosStation.tsx"),
  ]);
  for (const scenario of ECOS_SCENARIOS) {
    const note = ecosDoorNote(scenario);
    // « Mme X, 45 ans, se présente aux urgences / consulte au cabinet pour… »
    assert.match(note, /\d+ ans,.*(urgences|cabinet)/, scenario.slug);
    assert.ok(!normalizeEcosText(note).includes(normalizeEcosText(scenario.diagnosisChoice.correct)), scenario.slug);
    assert.doesNotMatch(normalizeEcosText(note), / (cardio|neuro|pneumo|gastro|infectio|nephro|ortho|dermato|psychiatr|endocrino|thoraciqu|abdominal|epigastr|febril|cephal|dyspne)/, scenario.slug);
  }
  assert.match(cases, /candidateTitle: \(scenario && ecosDoorNote\(scenario\)\)/);
  // L'activité récente du tableau de bord passe aussi par la feuille de porte.
  assert.match(cases, /return scenario \? ecosDoorNote\(scenario\) : editorialTitles\.get\(slug\) \?\? null;/);
  assert.doesNotMatch(cases, /specialties\(name\)|specialty:/);
  for (const source of [catalog, dashboard]) assert.doesNotMatch(source, /\.specialty/);
  assert.doesNotMatch(station, /station\.specialty/);
});

test("le patient ne livre que ce qu'on lui demande", async () => {
  const { ECOS_SCENARIOS } = await import("../lib/ecos/stations/index.ts");
  const { buildPatientPrompt } = await import("../lib/ecos/engine.ts");
  const prompt = buildPatientPrompt(ECOS_SCENARIOS[0]);
  assert.match(prompt, /Ne cite jamais ce que tu n'as pas/);
  assert.match(prompt, /Une question ne vise qu'une chose/);
  assert.match(prompt, /tes contraintes \(travail, famille\) et tes émotions ne viennent que si on t'interroge dessus/);
  assert.match(prompt, /n'invente ni moment, ni chiffre, ni lieu/);
});

test("le mode examen prévient à 2 minutes de la fin, puis à la fin, comme le jour de l'ECOS", async () => {
  const { examSignal, EXAM_WARNING_SECONDS } = await import("../lib/ecos/timing.ts");
  assert.equal(EXAM_WARNING_SECONDS, 120);
  assert.equal(examSignal(121, 120), "warning");
  assert.equal(examSignal(125, 119), "warning");
  assert.equal(examSignal(120, 119), null);
  assert.equal(examSignal(1, 0), "end");
  assert.equal(examSignal(0, 0), null);
  // Une station rejouée repart à 13 minutes sans signal.
  assert.equal(examSignal(0, 780), null);
  const station = await read("../components/ecos/EcosStation.tsx");
  assert.match(station, /if \(mode === "exam" && !signalContextRef\.current/);
  assert.match(station, /playExamSignal\(signalContextRef\.current, signal\)/);
  assert.match(station, /Il reste 2 minutes\./);
});
