import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DEFAULT_ECOS_QUOTAS, ecosQuotas, sessionIsFull } from "../lib/ecos/quotas.ts";

test("les quotas ont des valeurs par défaut et se règlent par variable d'environnement", () => {
  assert.deepEqual(ecosQuotas({}), DEFAULT_ECOS_QUOTAS);
  assert.equal(ecosQuotas({ ECOS_DAILY_SESSIONS: "5" }).dailySessions, 5);
  assert.equal(ecosQuotas({ ECOS_DAILY_MESSAGES: " 150 " }).dailyMessages, 150);
});

test("une valeur invalide ne désactive jamais un quota", () => {
  for (const value of ["0", "-3", "abc", "", "1.5"]) {
    assert.equal(ecosQuotas({ ECOS_DAILY_VOICE_REPLIES: value }).dailyVoiceReplies, DEFAULT_ECOS_QUOTAS.dailyVoiceReplies, value);
  }
});

test("une station est pleine quand son dernier message atteint le plafond", () => {
  const quotas = { ...DEFAULT_ECOS_QUOTAS, sessionMessages: 10 };
  assert.equal(sessionIsFull(undefined, quotas), false);
  assert.equal(sessionIsFull(0, quotas), false);
  assert.equal(sessionIsFull(8, quotas), false);
  assert.equal(sessionIsFull(9, quotas), true);
  assert.equal(sessionIsFull(42, quotas), true);
});

test("les routes ECOS appliquent les quotas du jour", async () => {
  const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
  const [session, chat, speech] = await Promise.all([
    read("../app/api/ecos/session/route.ts"),
    read("../app/api/ecos/chat/route.ts"),
    read("../app/api/ecos/speech/route.ts"),
  ]);
  assert.match(session, /enforceDailyQuota\(admin, user\.id, "ecos-session-day"/);
  assert.match(session, /update\(\{ status: "abandoned" \}\)/);
  assert.match(chat, /enforceDailyQuota\(admin, user\.id, "ecos-chat-day"/);
  assert.match(chat, /sessionIsFull\(/);
  assert.match(chat, /wantsVoice && voiceWithinQuota/);
  assert.match(speech, /"ecos-voice-day"/);
});
