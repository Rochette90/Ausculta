import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createSpeechSegmenter, createSseParser, createStageDirectionFilter, createThinkFilter } from "../lib/ecos/patient-stream.ts";
import { streamPatientReply } from "../lib/ecos/patient-reply.ts";
import { encodeChatEvent, readChatEvents } from "../lib/ecos/chat-stream.ts";
import { isPermanentVoiceFailure, synthesizeSpeech, VoiceProviderError } from "../lib/ecos/voice.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const encoder = new TextEncoder();

/** Flux d'octets livré en morceaux arbitraires, comme sur le réseau. */
function chunkedStream(text, sizes = [7, 3, 11]) {
  const bytes = encoder.encode(text);
  const parts = [];
  for (let offset = 0, index = 0; offset < bytes.length; index += 1) {
    const size = sizes[index % sizes.length];
    parts.push(bytes.slice(offset, offset + size));
    offset += size;
  }
  return new ReadableStream({
    pull(controller) {
      const part = parts.shift();
      if (part) controller.enqueue(part); else controller.close();
    },
  });
}

const anthropicSse = (texts) => [
  `event: message_start\ndata: ${JSON.stringify({ type: "message_start" })}\n\n`,
  ...texts.map((text) => `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text } })}\n\n`),
  `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`,
].join("");

const openAiSse = (texts) => [
  ": OPENROUTER PROCESSING\n\n",
  ...texts.map((text) => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\r\n\r\n`),
  "data: [DONE]\n\n",
].join("");

const sseResponse = (body) => new Response(chunkedStream(body), { status: 200, headers: { "content-type": "text/event-stream" } });

const chain = [
  { provider: "anthropic", apiKey: "a", model: "claude-haiku-5-5" },
  { provider: "openrouter", apiKey: "o", model: "anthropic/claude-haiku-5.5" },
];
const history = [{ role: "student", content: "Comment est la douleur ?" }];

function run(fetchImpl, overrides = {}) {
  const segments = [];
  const logs = [];
  const promise = streamPatientReply({
    chain,
    systemPrompt: "CONSIGNE",
    history,
    timeoutMs: 2_000,
    fallback: () => "Réponse du moteur local.",
    onSegment: (text) => segments.push(text),
    silent: (text) => /^\s*examinateur\b/i.test(text),
    log: (message) => logs.push(message),
    fetchImpl,
    ...overrides,
  });
  return promise.then((result) => ({ ...result, segments, logs }));
}

test("les blocs <think> sont retirés même coupés entre deux morceaux", () => {
  const filter = createThinkFilter();
  const output = ["Bon", "<thi", "nk>je réfléchis</th", "ink>jour.", " Ça <", "va."].map((part) => filter.push(part)).join("") + filter.flush();
  assert.equal(output, "Bonjour. Ça <va.");
  const truncated = createThinkFilter();
  assert.equal(truncated.push("<think>jamais refermé") + truncated.flush(), "");
  const upper = createThinkFilter();
  assert.equal(upper.push("<THINK>x</THINK>Oui.") + upper.flush(), "Oui.");
});

/** Passe un texte dans le filtre, découpé tous les `size` caractères. */
function words(text, size = 3, speakers = ["M. Favre", "Favre"]) {
  const filter = createStageDirectionFilter({ speakers });
  let output = "";
  for (let index = 0; index < text.length; index += size) output += filter.push(text.slice(index, index + size));
  return output + filter.flush();
}

test("seules les paroles du patient sont gardées, jamais sa description", () => {
  for (const size of [1, 3, 7, 500]) {
    assert.equal(words("*Anxieux, en sueur, se tient la poitrine* Ça serre très fort, docteur.", size), "Ça serre très fort, docteur.");
    assert.equal(words("(soupire) Depuis ce matin. *grimace* Et ça ne passe pas.", size), "Depuis ce matin. Et ça ne passe pas.");
    assert.equal(words("J’ai mal [se plie en deux] ici, au milieu.", size), "J’ai mal ici, au milieu.");
    assert.equal(words("J’ai mal (soupire).", size), "J’ai mal.");
    assert.equal(words("M. Favre : Huit sur dix.", size), "Huit sur dix.");
    assert.equal(words("Favre (inquiet) : Huit sur dix.", size), "Huit sur dix.");
    assert.equal(words("Le patient : Non, pas de fièvre.", size), "Non, pas de fièvre.");
    assert.equal(words("La patiente : Oui.", size), "Oui.");
    assert.equal(words("Le mari : Elle parlait normalement hier.", size), "Elle parlait normalement hier.");
    // Le gras est retiré, les mots restent.
    assert.equal(words("C’est **vraiment** très fort.", size), "C’est vraiment très fort.");
    // Une didascalie jamais refermée (réponse tronquée) disparaît entière.
    assert.equal(words("Oui. *se rallonge doucement", size), "Oui.");
  }
  // Ce qui n'est pas un nom de patient reste intact.
  assert.equal(words("Examinateur : choisis ce geste dans la liste."), "Examinateur : choisis ce geste dans la liste.");
  assert.equal(words("Bonjour docteur : j’ai mal."), "Bonjour docteur : j’ai mal.");
  assert.equal(words("Huit sur dix : c’est vraiment fort."), "Huit sur dix : c’est vraiment fort.");
});

test("chaque phrase part dès qu'elle est complète", () => {
  const segmenter = createSpeechSegmenter();
  assert.deepEqual(segmenter.push("Oui. "), []);
  assert.deepEqual(segmenter.push("Ça serre comme un étau. Et ça "), ["Oui. Ça serre comme un étau."]);
  assert.deepEqual(segmenter.push("descend dans le bras. Depuis ce matin."), ["Et ça descend dans le bras."]);
  assert.deepEqual(segmenter.flush(), ["Depuis ce matin."]);

  const single = createSpeechSegmenter();
  assert.deepEqual(single.push("Depuis ce matin, docteur"), []);
  assert.deepEqual(single.flush(), ["Depuis ce matin, docteur"]);

  const quoted = createSpeechSegmenter();
  assert.deepEqual(quoted.push("Il m’a dit « ça va passer. » Puis"), ["Il m’a dit « ça va passer. »"]);
  const nbsp = createSpeechSegmenter();
  assert.deepEqual(nbsp.push("Il m’a dit «\u00a0ça va passer.\u00a0» Puis"), ["Il m’a dit «\u00a0ça va passer.\u00a0»"]);
  // Un nombre décimal n'est pas une fin de phrase.
  const decimal = createSpeechSegmenter();
  assert.deepEqual(decimal.push("J’ai eu 38.5 de fièvre hier soir"), []);

  // La ligne de l'examinateur n'est jamais dite, même longue.
  const examiner = createSpeechSegmenter({ mute: (text) => text.startsWith("Examinateur") });
  assert.deepEqual(examiner.push("Examinateur : choisis les gestes dans la liste. Merci."), []);
  assert.deepEqual(examiner.flush(), []);
  assert.deepEqual(createSpeechSegmenter().flush(), []);
});

test("le flux d'événements est relu quel que soit le découpage réseau", () => {
  const parser = createSseParser();
  const text = ": commentaire\n\nevent: a\ndata: un\n\ndata: deux\r\n\r\ndata: trois";
  const events = [];
  for (let index = 0; index < text.length; index += 4) events.push(...parser.push(text.slice(index, index + 4)));
  events.push(...parser.flush());
  assert.deepEqual(events, ["un", "deux", "trois"]);
});

test("la réponse d'Anthropic part par morceaux dès la première phrase", async () => {
  const calls = [];
  const result = await run(async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return sseResponse(anthropicSse(["J’ai très mal ", "dans la poitrine. ", "Ça serre", " comme un étau."]));
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.anthropic.com/v1/messages");
  assert.equal(calls[0].body.stream, true);
  assert.equal(result.source, "anthropic");
  assert.equal(result.reply, "J’ai très mal dans la poitrine. Ça serre comme un étau.");
  assert.deepEqual(result.segments, ["J’ai très mal dans la poitrine.", "Ça serre comme un étau."]);
  assert.deepEqual(result.logs, []);
});

test("un fournisseur en échec avant toute phrase passe la main au suivant", async () => {
  const result = await run(async (url) => (url.includes("anthropic.com")
    ? new Response(JSON.stringify({ type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } }), { status: 401 })
    : sseResponse(openAiSse(["Depuis ce matin, ", "vers huit heures."]))));
  assert.equal(result.source, "openrouter");
  assert.equal(result.reply, "Depuis ce matin, vers huit heures.");
  assert.deepEqual(result.segments, ["Depuis ce matin, vers huit heures."]);
  assert.deepEqual(result.logs, ["anthropic 401 — authentication_error : invalid x-api-key"]);
});

test("après une phrase déjà dite, une coupure garde ce fournisseur et ce texte", async () => {
  let calls = 0;
  const result = await run(async () => {
    calls += 1;
    const body = anthropicSse(["Ça a commencé d’un coup ce matin. ", "Et "]).replace(/event: message_stop[\s\S]*$/, "")
      + `data: ${JSON.stringify({ type: "error", error: { type: "overloaded_error", message: "Overloaded" } })}\n\n`;
    return sseResponse(body);
  });
  assert.equal(calls, 1, "aucun changement de fournisseur après une phrase transmise");
  assert.equal(result.source, "anthropic");
  assert.equal(result.reply, "Ça a commencé d’un coup ce matin. Et");
  assert.deepEqual(result.segments, ["Ça a commencé d’un coup ce matin.", "Et"]);
  assert.match(result.logs[0], /overloaded_error/);
});

test("sans réponse d'aucun modèle, le moteur local répond et parle", async () => {
  const result = await run(async () => { throw new TypeError("fetch failed"); });
  assert.equal(result.source, "scenario-engine");
  assert.equal(result.reply, "Réponse du moteur local.");
  assert.deepEqual(result.segments, ["Réponse du moteur local."]);
  assert.equal(result.logs.length, 2);
  const silent = await run(async () => { throw new TypeError("fetch failed"); }, { chain: [], fallback: () => "Examinateur : choisis les gestes dans la liste." });
  assert.deepEqual(silent.segments, []);
});

test("un délai dépassé passe au fournisseur suivant", async () => {
  const result = await run((url, init) => (url.includes("anthropic.com")
    ? new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))))
    : Promise.resolve(sseResponse(openAiSse(["Non, pas de fièvre."])))), { timeoutMs: 50 });
  assert.equal(result.source, "openrouter");
  assert.deepEqual(result.logs, ["anthropic délai dépassé"]);
});

test("un premier mot trop lent passe au fournisseur suivant sans attendre le délai total", async () => {
  const started = Date.now();
  const result = await run((url, init) => (url.includes("anthropic.com")
    ? new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))))
    : Promise.resolve(sseResponse(openAiSse(["Non, pas de fièvre."])))), { firstTokenTimeoutMs: 50 });
  assert.equal(result.source, "openrouter");
  assert.ok(Date.now() - started < 1_000, "la bascule doit suivre le délai de premier mot, pas le délai total");
});

test("une synthèse déjà faite n'est pas repayée, une autre oui", async () => {
  const config = { apiKey: "k", voiceId: "v-cache", modelId: "eleven_flash_v2_5" };
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return new Response(new Uint8Array([calls])); };
  const first = await synthesizeSpeech(config, "Phrase mise en cache.", { fetchImpl });
  const second = await synthesizeSpeech(config, "Phrase mise en cache.", { fetchImpl });
  assert.deepEqual([...second], [...first]);
  assert.equal(calls, 1, "même texte, même voix : un seul appel ElevenLabs");
  await synthesizeSpeech(config, "Autre phrase.", { fetchImpl });
  assert.equal(calls, 2);
});

test("une description glissée par le modèle n'est ni dite ni enregistrée", async () => {
  const result = await run(async () => sseResponse(anthropicSse(["M. Favre : *Anxi", "eux, se tient la poi", "trine* J’ai une douleur ", "très forte. (grimace) ", "Ça serre."])), {
    speakers: ["M. Favre", "Favre"],
  });
  assert.equal(result.reply, "J’ai une douleur très forte. Ça serre.");
  assert.deepEqual(result.segments, ["J’ai une douleur très forte.", "Ça serre."]);
});

test("le raisonnement de Groq n'est ni dit ni enregistré", async () => {
  const result = await run(async () => sseResponse(openAiSse(["<think>Le patient doit", " dire non.</think>", "Non, je ne fume pas."])), {
    chain: [{ provider: "groq", apiKey: "g", model: "qwen/qwen3-32b" }],
  });
  assert.equal(result.reply, "Non, je ne fume pas.");
  assert.deepEqual(result.segments, ["Non, je ne fume pas."]);
});

test("une réponse trop longue est coupée à la limite", async () => {
  const result = await run(async () => sseResponse(anthropicSse(Array.from({ length: 80 }, () => "Phrase répétée du patient. "))));
  assert.equal(result.reply.length <= 1_200, true);
  assert.equal(result.segments.join(" ").length <= 1_201, true);
});

test("les événements de réponse se relisent à l'identique, même coupés", async () => {
  const events = [
    { type: "start", voice: true },
    { type: "segment", index: 0, text: "J’ai mal. « Ça serre » — 8/10." },
    { type: "audio", index: 0, audio: "SUQz" },
    { type: "done", reply: "J’ai mal.", source: "anthropic" },
  ];
  const bytes = new Uint8Array(events.flatMap((event) => [...encodeChatEvent(event)]));
  const stream = new ReadableStream({
    start(controller) {
      for (let offset = 0; offset < bytes.length; offset += 5) controller.enqueue(bytes.slice(offset, offset + 5));
      controller.enqueue(encoder.encode("pas du json\n{\"type\":\"inconnu\"}\n"));
      controller.close();
    },
  });
  const received = [];
  await readChatEvents(stream, (event) => received.push(event));
  assert.deepEqual(received, events);
});

test("la synthèse distingue les refus définitifs des pannes passagères", async () => {
  const config = { apiKey: "k", voiceId: "v", modelId: "eleven_flash_v2_5" };
  const audio = await synthesizeSpeech(config, "Bonjour.", { fetchImpl: async () => new Response(new Uint8Array([1, 2, 3])) });
  assert.deepEqual([...audio], [1, 2, 3]);
  await assert.rejects(
    synthesizeSpeech(config, "Clé refusée.", { fetchImpl: async () => new Response(JSON.stringify({ detail: { status: "invalid_api_key", message: "Invalid API key" } }), { status: 401 }) }),
    (error) => error instanceof VoiceProviderError && error.permanent && error.message === "401 — invalid_api_key : Invalid API key",
  );
  await assert.rejects(
    synthesizeSpeech(config, "Trop de demandes.", { fetchImpl: async () => new Response("{}", { status: 429 }) }),
    (error) => error instanceof VoiceProviderError && !error.permanent,
  );
  await assert.rejects(
    synthesizeSpeech(config, "Réseau coupé.", { fetchImpl: async () => { throw new TypeError("fetch failed"); } }),
    (error) => error instanceof VoiceProviderError && !error.permanent,
  );
  for (const status of [400, 401, 403, 404]) assert.equal(isPermanentVoiceFailure(status), true);
  for (const status of [429, 500, 503]) assert.equal(isPermanentVoiceFailure(status), false);
});

test("la route de discussion contrôle tout avant de répondre en flux", async () => {
  const [route, station, vercel] = await Promise.all([
    read("../app/api/ecos/chat/route.ts"),
    read("../components/ecos/EcosStation.tsx"),
    read("../vercel.json"),
  ]);
  // Session, quota, synthèse et historique : en parallèle, avant tout appel au modèle.
  assert.match(route, /await Promise\.all\(\[\s*enforceRateLimit\(admin, user\.id, "ecos-chat", 30, 60\),[\s\S]+synthesisStarted\(admin, sessionId, user\.id\),[\s\S]+\]\);[\s\S]+new ReadableStream/);
  assert.match(route, /sessionDeadline\(session\.mode, session\.started_at\)[\s\S]+new ReadableStream/);
  assert.match(route, /"content-type": "application\/x-ndjson; charset=utf-8"/);
  // La voix réaliste n'est synthétisée que si le navigateur la demande et que le quota du jour le permet.
  assert.match(route, /const voice = wantsVoice && voiceWithinQuota \? speechConfig\(scenario\) : null;/);
  // La question est enregistrée avant la réponse, et « done » part en dernier.
  assert.match(route, /studentSaved\.then\(async \(\) => \{[\s\S]+p_role: "patient"/);
  assert.match(route, /await Promise\.all\(\[audioSent, saved\]\);[\s\S]+send\(\{ type: "done"/);
  assert.match(route, /silent: isExaminerLine/);
  assert.match(route, /speakers: speakerLabels\(scenario\)/);
  // Ni la clé ni le motif d'un refus n'atteignent le navigateur.
  assert.doesNotMatch(route, /send\(\{[^}]*(reason|apiKey|\.message)/);
  assert.equal(JSON.parse(vercel).functions["app/api/ecos/chat/route.ts"].maxDuration, 30);
  // Le navigateur lit le flux et ne demande l'audio que s'il peut le jouer.
  assert.match(station, /await readChatEvents\(response\.body,/);
  assert.match(station, /voice: Boolean\(player\?\.serverVoice\)/);
});
