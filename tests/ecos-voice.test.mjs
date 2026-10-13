import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { elevenLabsSpeechRequest, SPEECH_MAX_CHARACTERS, SPEECH_SYNTHESIS_MAX_CHARACTERS, speakerSex, speechConfig, speechRequestBody } from "../lib/ecos/voice.ts";
import { ECOS_SCENARIOS } from "../lib/ecos/stations/index.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const env = {
  ELEVENLABS_API_KEY: "key",
  ELEVENLABS_VOICE_FEMALE: "female",
  ELEVENLABS_VOICE_MALE: "male",
};
const woman = { patient: { name: "Mme Test", age: 60, sex: "F" } };
const youngMan = { patient: { name: "M. Test", age: 19, sex: "M" } };

test("sans clé ou sans voix, la voix réaliste est désactivée", () => {
  assert.equal(speechConfig(woman, {}), null);
  assert.equal(speechConfig(woman, { ELEVENLABS_API_KEY: "key" }), null);
  assert.equal(speechConfig(woman, { ...env, ELEVENLABS_API_KEY: "  " }), null);
  assert.equal(speechConfig(woman, { ...env, ELEVENLABS_VOICE_FEMALE: "" }), null);
});

test("la voix suit le sexe et l'âge de la personne qui parle", () => {
  assert.deepEqual(speechConfig(woman, env), { apiKey: "key", voiceId: "female", modelId: "eleven_flash_v2_5" });
  assert.equal(speechConfig(youngMan, env).voiceId, "male");
  const withYoung = { ...env, ELEVENLABS_VOICE_MALE_YOUNG: "young-male", ELEVENLABS_VOICE_FEMALE_YOUNG: "young-female" };
  assert.equal(speechConfig(youngMan, withYoung).voiceId, "young-male");
  assert.equal(speechConfig(woman, withYoung).voiceId, "female");
  assert.equal(speechConfig(woman, { ...env, ELEVENLABS_MODEL: "eleven_v4_turbo" }).modelId, "eleven_v4_turbo");
});

test("quand un proche répond, c'est sa voix qui est choisie", () => {
  const relative = { patient: { name: "Mme Test", age: 30, sex: "F" }, voiceSex: "M" };
  assert.equal(speakerSex(relative), "M");
  // L'âge du proche est inconnu : pas de voix « jeune » déduite de l'âge de la patiente.
  assert.equal(speechConfig(relative, { ...env, ELEVENLABS_VOICE_MALE_YOUNG: "young-male" }).voiceId, "male");
  // Toute station où un proche répond précise le sexe de sa voix.
  for (const scenario of ECOS_SCENARIOS) {
    if (scenario.proxy) assert.ok(scenario.voiceSex, `${scenario.slug} : voiceSex manquant`);
  }
});

test("la requête force le français sauf pour le modèle qui le refuse", () => {
  assert.deepEqual(speechRequestBody("Bonjour", "eleven_flash_v2_5"), { text: "Bonjour", model_id: "eleven_flash_v2_5", language_code: "fr" });
  assert.deepEqual(speechRequestBody("Bonjour", "eleven_multilingual_v2"), { text: "Bonjour", model_id: "eleven_multilingual_v2" });
  assert.ok(SPEECH_MAX_CHARACTERS >= 1_200, "une réponse du patient (1 200 caractères au plus) doit pouvoir être lue");
});

test("la route de synthèse ne lit que des répliques enregistrées et garde la clé côté serveur", async () => {
  const [route, station, player, envExample, vercel] = await Promise.all([
    read("../app/api/ecos/speech/route.ts"),
    read("../components/ecos/EcosStation.tsx"),
    read("../components/ecos/patient-voice.ts"),
    read("../.env.example"),
    read("../vercel.json"),
  ]);
  assert.match(route, /requireAuthenticatedUser\(\)/);
  assert.match(route, /assertSameOrigin\(request\)/);
  assert.match(route, /enforceRateLimit\(admin, user\.id, "ecos-speech"/);
  assert.match(route, /\.eq\("user_id", user\.id\)[\s\S]+\.eq\("role", "patient"\)/);
  assert.match(route, /unknown_line/);
  assert.match(route, /text\.startsWith\(EXAMINER_PREFIX\)/);
  assert.match(route, /new ApiError\(503, "speech_unavailable"/);
  // Une clé refusée désactive la voix réaliste pour la page au lieu d'échouer à chaque réplique.
  assert.match(route, /if \(isPermanentVoiceFailure\(upstream\.status\)\) \{\s*throw new ApiError\(503, "speech_unavailable"/);
  assert.match(station, /if \(response\.status === 503\) player\.serverVoice = false;/);
  // Le motif d'un refus du fournisseur est journalisé côté serveur, jamais renvoyé :
  // le navigateur ne reçoit qu'un message générique, et la clé n'est écrite nulle part.
  assert.match(route, /throw new ApiError\(502, "speech_failed", "Voix momentanément indisponible"\)/);
  assert.doesNotMatch(route, /ApiError\([^)]*reason/);
  assert.doesNotMatch(route, /console\.\w+\([^)]*apiKey/);
  for (const source of [station, player]) assert.doesNotMatch(source, /ELEVENLABS|xi-api-key|elevenlabs\.io/i);
  assert.match(station, /fetch\("\/api\/ecos\/speech"/);
  // Sans voix réaliste, la voix du navigateur lit le texte.
  assert.match(station, /player\.pushText\(reply, text\);\s*player\.end\(reply\);/);
  assert.match(envExample, /^ELEVENLABS_API_KEY=$/m);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_ELEVENLABS/);
  assert.match(vercel, /app\/api\/ecos\/speech\/route\.ts/);
});

test("la voix est rapide à démarrer, économe et ne reste jamais bloquée", async () => {
  const [chat, speech, station, player] = await Promise.all([
    read("../app/api/ecos/chat/route.ts"),
    read("../app/api/ecos/speech/route.ts"),
    read("../components/ecos/EcosStation.tsx"),
    read("../components/ecos/patient-voice.ts"),
  ]);
  // Format léger pour la parole et plafond de caractères facturés par réplique.
  assert.match(elevenLabsSpeechRequest({ apiKey: "k", voiceId: "v", modelId: "m" }, "Bonjour").url, /output_format=mp3_22050_32/);
  assert.ok(SPEECH_SYNTHESIS_MAX_CHARACTERS < SPEECH_MAX_CHARACTERS);
  assert.match(chat, /SPEECH_SYNTHESIS_MAX_CHARACTERS/);
  assert.match(chat, /firstTokenTimeoutMs: FIRST_TOKEN_TIMEOUT_MS/);
  // Une phrase déjà synthétisée est resservie sans appel payant.
  assert.match(speech, /cachedSpeech\(config, text\)/);
  assert.match(speech, /storeSpeech\(config, text, all\)/);
  // Audio trop lent : la voix du navigateur prend le relais sans attendre l'échec,
  // mais le seuil laisse à une synthèse normale (2 à 3 s) le temps d'arriver.
  assert.match(station, /VOICE_AUDIO_FALLBACK_MS = 4_000/);
  assert.match(station, /voiceSettled\.has\(index\)\) return;[\s\S]+player\.pushText\(spokenReply/);
  assert.match(station, /!voiceSettled\.has\(event\.index\)\) \{\s*settleVoice\(event\.index\);/);
  // Voix du navigateur connues de façon asynchrone, morceau suivant préchargé,
  // et garde-fou proportionné au texte si la fin de lecture n'arrive jamais.
  assert.match(player, /voiceschanged/);
  assert.match(player, /preloadNext\(\)/);
  assert.match(player, /standbyUrl === item\.url/);
  assert.match(player, /item\.text\.length \* 120/);
});

test("la conversation vocale ne rouvre jamais le micro pendant que le patient parle", async () => {
  const station = await read("../components/ecos/EcosStation.tsx");
  // « Le patient parle » est posé avant même la requête de la phrase d'ouverture : sans
  // cela le micro se rouvrirait pendant la préparation de la voix et transcrirait le patient.
  assert.match(station, /player\.begin\(\{ hold: true \}\);[\s\S]+fetch\("\/api\/ecos\/speech"/);
  // Pour une réponse, l'attente du flux (loading) puis la lecture (speaking) tiennent le micro fermé.
  assert.match(station, /finally \{\s*if \(player && reply !== null\) player\.end\(reply\);[\s\S]{0,120}setLoading\(false\);/);
  const idle = station.match(/const conversationIdle = ([^;]+);/)?.[1] ?? "";
  for (const condition of ["conversation", "!loading", "!speaking", "!listening", "chatPhase(phase)", "!timeOver"]) {
    assert.ok(idle.includes(condition), `condition manquante : ${condition}`);
  }
  assert.match(station, /if \(!conversationIdle\) return;[\s\S]+beginListening\(\)/);
  // Ouvrir le micro coupe d'abord le patient, y compris au clic manuel.
  assert.match(station, /function beginListening\(\) \{[\s\S]+?stopSpeaking\(\);[\s\S]+?new BrowserRecognition\(\)/);
  // Un garde-fou relâche l'état si la fin de lecture n'est jamais signalée.
  assert.match(station, /speakingWatchdog\.current = window\.setTimeout\(\(\) => setSpeaking\(false\)/);
});

test("la conversation vocale s'arrête proprement et explique pourquoi", async () => {
  const station = await read("../components/ecos/EcosStation.tsx");
  assert.match(station, /event\.error === "no-speech" \|\| event\.error === "aborted"\) return;/);
  assert.match(station, /event\.error === "not-allowed"[\s\S]+Le navigateur n’a pas accès au micro/);
  assert.match(station, /quickMicFailures\.current >= 4[\s\S]+stopConversation\(/);
  // La synthèse et la fin de la station ferment la conversation.
  assert.match(station, /setScreen\("report"\);\s*stopSpeaking\(\);[\s\S]{0,160}setConversation\(false\);/);
  assert.match(station, /if \(conversationRef\.current\) stopConversation\(\);/);
  // Le champ de saisie laisse la place à la scène vocale, l'échange écrit reste accessible.
  assert.match(station, /chatPhase\(phase\) && !conversation && \(/);
  assert.match(station, /Afficher l’échange écrit/);
  // Une question tapée au clavier n'est jamais effacée par une dictée muette.
  assert.match(station, /if \(showedInterim\) setInput\(""\);/);
});
