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
  assert.match(station, /if \(field === "analysis"\) setAnalysis\(append\);\s+else setPlan\(append\);/);
});

test("l'image d'un examen n'arrive qu'avec son résultat, et seulement depuis /ecos/", async () => {
  const [route, types, station] = await Promise.all([
    read("../app/api/ecos/session/[id]/procedure/route.ts"),
    read("../lib/ecos/types.ts"),
    read("../components/ecos/EcosStation.tsx"),
  ]);
  // La vue de la station ne transporte jamais l'image avant le geste.
  assert.match(types, /procedures: Array<Pick<EcosProcedure, "id" \| "label" \| "category">>/);
  assert.match(route, /procedure\.image\.src\.startsWith\("\/ecos\/"\)/);
  assert.match(station, /<ProcedureFigure image=\{lastResult\.image\} \/>/);
  assert.match(station, /<ProcedureFigure image=\{item\.image\} \/>/);
});
