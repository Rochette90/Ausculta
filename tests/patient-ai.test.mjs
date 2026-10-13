import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PATIENT_REPLY_MAX_CHARACTERS,
  alternatingMessages,
  patientAiChain,
  patientAiConfig,
  patientAiErrorReason,
  patientAiRequest,
  patientAiStreamDelta,
  patientAiTimeoutMs,
} from "../lib/ecos/patient-ai.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("sans clé, le patient est joué par le moteur local", () => {
  assert.equal(patientAiConfig({}), null);
  assert.equal(patientAiConfig({ ANTHROPIC_API_KEY: "  ", GROQ_API_KEY: "" }), null);
});

test("le fournisseur suit les clés présentes et la préférence explicite", () => {
  assert.deepEqual(patientAiConfig({ ANTHROPIC_API_KEY: "a" }), { provider: "anthropic", apiKey: "a", model: "claude-haiku-5-5" });
  assert.deepEqual(patientAiConfig({ GROQ_API_KEY: "g" }), { provider: "groq", apiKey: "g", model: "qwen/qwen3-32b" });
  const both = { ANTHROPIC_API_KEY: "a", GROQ_API_KEY: "g" };
  assert.equal(patientAiConfig(both).provider, "anthropic");
  assert.equal(patientAiConfig({ ...both, PATIENT_AI_PROVIDER: "Groq" }).provider, "groq");
  // Une préférence sans la clé correspondante retombe sur l'autre fournisseur.
  assert.equal(patientAiConfig({ ANTHROPIC_API_KEY: "a", PATIENT_AI_PROVIDER: "groq" }).provider, "anthropic");
  assert.equal(patientAiConfig({ ANTHROPIC_API_KEY: "a", ANTHROPIC_MODEL: "claude-sonnet-5-5" }).model, "claude-sonnet-5-5");
});

test("la chaîne de secours essaie Anthropic, puis OpenRouter, puis Groq", () => {
  assert.deepEqual(patientAiChain({}), []);
  const all = { ANTHROPIC_API_KEY: "a", OPENROUTER_API_KEY: "o", GROQ_API_KEY: "g" };
  assert.deepEqual(patientAiChain(all).map((item) => item.provider), ["anthropic", "openrouter", "groq"]);
  assert.deepEqual(patientAiChain({ ANTHROPIC_API_KEY: "a", OPENROUTER_API_KEY: "o" }), [
    { provider: "anthropic", apiKey: "a", model: "claude-haiku-5-5" },
    { provider: "openrouter", apiKey: "o", model: "anthropic/claude-haiku-5.5" },
  ]);
  // Sans clé Anthropic, OpenRouter devient le fournisseur principal.
  assert.equal(patientAiConfig({ OPENROUTER_API_KEY: "o" }).provider, "openrouter");
  assert.deepEqual(patientAiChain({ ...all, PATIENT_AI_PROVIDER: "openrouter" }).map((item) => item.provider), ["openrouter", "anthropic", "groq"]);
  assert.deepEqual(patientAiChain({ ...all, PATIENT_AI_PROVIDER: "inconnu" }).map((item) => item.provider), ["anthropic", "openrouter", "groq"]);
  assert.equal(patientAiChain({ OPENROUTER_API_KEY: "o", OPENROUTER_MODEL: "mistralai/mistral-large-4-0" })[0].model, "mistralai/mistral-large-4-0");
});

test("la chaîne entière tient dans la durée maximale de la route", async () => {
  const vercel = JSON.parse(await read("../vercel.json"));
  const maxDurationMs = vercel.functions["app/api/ecos/chat/route.ts"].maxDuration * 1_000;
  for (const length of [1, 2, 3]) {
    assert.ok(patientAiTimeoutMs(length) * length < maxDurationMs, `${length} fournisseur(s)`);
    assert.ok(patientAiTimeoutMs(length) >= 4_000);
  }
  assert.equal(patientAiTimeoutMs(1), 12_000);
});

const history = [
  { role: "patient", content: "Bonjour docteur… j’ai mal." },
  { role: "student", content: "Bonjour." },
  { role: "system", content: "Rappel de l’interface." },
  { role: "student", content: "Depuis quand ?" },
  { role: "patient", content: "Depuis ce matin." },
  { role: "student", content: "Où avez-vous mal ?" },
];

test("l'entretien envoyé à Anthropic commence par l'étudiant et alterne les rôles", () => {
  const messages = alternatingMessages(history);
  assert.deepEqual(messages, [
    { role: "user", content: "Bonjour.\nDepuis quand ?" },
    { role: "assistant", content: "Depuis ce matin." },
    { role: "user", content: "Où avez-vous mal ?" },
  ]);
  for (let index = 0; index < messages.length; index += 1) assert.equal(messages[index].role, index % 2 ? "assistant" : "user");
  assert.deepEqual(alternatingMessages([{ role: "patient", content: "Bonjour." }]), []);
});

test("chaque fournisseur reçoit sa requête, avec la clé dans les en-têtes seulement", () => {
  const anthropic = patientAiRequest({ provider: "anthropic", apiKey: "secret-a", model: "claude-haiku-5-5" }, "CONSIGNE", history);
  assert.equal(anthropic.url, "https://api.anthropic.com/v1/messages");
  assert.equal(anthropic.headers["x-api-key"], "secret-a");
  assert.equal(anthropic.headers["anthropic-version"], "2023-06-01");
  assert.equal(anthropic.body.system, "CONSIGNE");
  assert.equal(anthropic.body.model, "claude-haiku-5-5");
  assert.deepEqual(anthropic.body.output_config, { effort: "low" });
  assert.deepEqual(anthropic.body.thinking, { type: "disabled" });
  assert.equal(anthropic.body.messages[0].role, "user");
  assert.doesNotMatch(JSON.stringify(anthropic.body), /secret-a/);

  const groq = patientAiRequest({ provider: "groq", apiKey: "secret-g", model: "qwen/qwen3-32b" }, "CONSIGNE", history);
  assert.equal(groq.url, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(groq.headers.authorization, "Bearer secret-g");
  assert.deepEqual(groq.body.messages[0], { role: "system", content: "CONSIGNE" });
  assert.equal(groq.body.messages.length, 6);
  assert.doesNotMatch(JSON.stringify(groq.body), /secret-g/);

  const openrouter = patientAiRequest({ provider: "openrouter", apiKey: "secret-o", model: "anthropic/claude-haiku-5.5" }, "CONSIGNE", history);
  assert.equal(openrouter.url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(openrouter.headers.authorization, "Bearer secret-o");
  assert.equal(openrouter.body.model, "anthropic/claude-haiku-5.5");
  assert.deepEqual(openrouter.body.messages[0], { role: "system", content: "CONSIGNE" });
  assert.doesNotMatch(JSON.stringify(openrouter.body), /secret-o/);
  // Les trois fournisseurs répondent en flux : le patient parle dès sa première phrase.
  for (const request of [anthropic, groq, openrouter]) assert.equal(request.body.stream, true);
});

test("le flux de chaque fournisseur est lu morceau par morceau", () => {
  const anthropicText = JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Depuis " } });
  assert.deepEqual(patientAiStreamDelta("anthropic", anthropicText), { text: "Depuis " });
  // Le raisonnement éventuel n'est jamais repris.
  assert.deepEqual(patientAiStreamDelta("anthropic", JSON.stringify({ type: "content_block_delta", delta: { type: "thinking_delta", thinking: "…" } })), {});
  assert.deepEqual(patientAiStreamDelta("anthropic", JSON.stringify({ type: "message_stop" })), { done: true });
  assert.deepEqual(patientAiStreamDelta("anthropic", JSON.stringify({ type: "error", error: { type: "overloaded_error", message: "Overloaded" } })), { error: "overloaded_error : Overloaded" });
  assert.deepEqual(patientAiStreamDelta("openrouter", JSON.stringify({ choices: [{ delta: { content: "ce matin." } }] })), { text: "ce matin." });
  assert.deepEqual(patientAiStreamDelta("groq", JSON.stringify({ choices: [{ delta: { reasoning: "…" } }] })), {});
  assert.deepEqual(patientAiStreamDelta("openrouter", "[DONE]"), { done: true });
  assert.deepEqual(patientAiStreamDelta("openrouter", JSON.stringify({ error: { code: 402, message: "Insufficient credits" } })), { error: "402 : Insufficient credits" });
  assert.deepEqual(patientAiStreamDelta("groq", "pas du json"), {});
  assert.ok(PATIENT_REPLY_MAX_CHARACTERS >= 1_000);
});

test("le motif d'un refus est court et lisible", () => {
  assert.equal(patientAiErrorReason({ type: "error", error: { type: "not_found_error", message: "model: claude-3-5-sonnet" } }), "not_found_error : model: claude-3-5-sonnet");
  assert.equal(patientAiErrorReason({ error: { code: "model_decommissioned", message: "x\ny" } }), "model_decommissioned : x y");
  assert.equal(patientAiErrorReason({ error: { code: 402, message: "Insufficient credits" } }), "402 : Insufficient credits");
  assert.equal(patientAiErrorReason(null), null);
  assert.ok(patientAiErrorReason({ error: { message: "m".repeat(1_000) } }).length <= 240);
});

test("la route de discussion passe par cette couche et journalise les échecs sans la clé", async () => {
  const [route, station, envExample] = await Promise.all([
    read("../app/api/ecos/chat/route.ts"),
    read("../components/ecos/EcosStation.tsx"),
    read("../.env.example"),
  ]);
  // La chaîne n'est construite que sous le plafond global du jour (voir tests/ecos-quotas.test.mjs).
  assert.match(route, /const chain = modelWithinGlobalQuota \? patientAiChain\(\) : \[\];/);
  assert.match(route, /streamPatientReply\(\{/);
  // Si aucun modèle ne répond, le moteur local répond toujours.
  assert.match(route, /fallback: \(\) => localPatientReply\(scenario, message, turn\)/);
  assert.match(route, /log: \(reason\) => console\.error\(`\$\{BRAND_NAME\} patient: \$\{reason\}`\)/);
  assert.doesNotMatch(route, /console\.\w+\([^)]*apiKey/);
  assert.doesNotMatch(route, /process\.env\.(GROQ|ANTHROPIC|OPENROUTER)/);
  assert.doesNotMatch(station, /ANTHROPIC|OPENROUTER|GROQ_API|api\.anthropic\.com|openrouter\.ai|api\.groq\.com/);
  assert.match(envExample, /^ANTHROPIC_API_KEY=$/m);
  assert.match(envExample, /^OPENROUTER_API_KEY=$/m);
  assert.match(envExample, /^GROQ_API_KEY=$/m);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_(ANTHROPIC|OPENROUTER|GROQ)/);
});
