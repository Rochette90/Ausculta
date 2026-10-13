import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DEFAULT_ECOS_QUOTAS, ecosPlan, ecosQuotas, sessionIsFull } from "../lib/ecos/quotas.ts";

test("les quotas ont des valeurs par défaut et se règlent par variable d'environnement", () => {
  assert.deepEqual(ecosQuotas({}), DEFAULT_ECOS_QUOTAS.free);
  assert.deepEqual(ecosQuotas({}, "pro"), DEFAULT_ECOS_QUOTAS.pro);
  assert.equal(ecosQuotas({ ECOS_DAILY_SESSIONS: "5" }).dailySessions, 5);
  assert.equal(ecosQuotas({ ECOS_DAILY_MESSAGES: " 150 " }).dailyMessages, 150);
  // Les variables Premium ne touchent pas Découverte, et inversement.
  assert.equal(ecosQuotas({ ECOS_PRO_DAILY_VOICE_REPLIES: "40" }, "pro").dailyVoiceReplies, 40);
  assert.equal(ecosQuotas({ ECOS_PRO_DAILY_VOICE_REPLIES: "40" }, "free").dailyVoiceReplies, DEFAULT_ECOS_QUOTAS.free.dailyVoiceReplies);
  assert.equal(ecosQuotas({ ECOS_DAILY_VOICE_REPLIES: "40" }, "pro").dailyVoiceReplies, DEFAULT_ECOS_QUOTAS.pro.dailyVoiceReplies);
  assert.equal(ecosQuotas({ ECOS_GLOBAL_DAILY_MESSAGES: "1000" }).globalDailyMessages, 1000);
  assert.equal(ecosQuotas({ ECOS_GLOBAL_DAILY_VOICE_REPLIES: "50" }).globalDailyVoiceReplies, 50);
});

test("Premium offre plus que Découverte, et les plafonds globaux dépassent un seul compte Premium", () => {
  const { free, pro } = DEFAULT_ECOS_QUOTAS;
  for (const key of ["dailySessions", "dailyMessages", "dailyVoiceReplies"]) assert.ok(pro[key] > free[key], key);
  assert.equal(free.sessionMessages, pro.sessionMessages);
  assert.ok(pro.globalDailyMessages >= pro.dailyMessages);
  assert.ok(pro.globalDailyVoiceReplies >= pro.dailyVoiceReplies);
});

test("toute valeur de profil autre que « pro » vaut Découverte", () => {
  assert.equal(ecosPlan("pro"), "pro");
  for (const value of ["free", "", null, undefined, "PRO", 1]) assert.equal(ecosPlan(value), "free");
});

test("une valeur invalide ne désactive jamais un quota", () => {
  for (const value of ["0", "-3", "abc", "", "1.5"]) {
    assert.equal(ecosQuotas({ ECOS_DAILY_VOICE_REPLIES: value }).dailyVoiceReplies, DEFAULT_ECOS_QUOTAS.free.dailyVoiceReplies, value);
    assert.equal(ecosQuotas({ ECOS_GLOBAL_DAILY_VOICE_REPLIES: value }).globalDailyVoiceReplies, DEFAULT_ECOS_QUOTAS.free.globalDailyVoiceReplies, value);
  }
});

test("une station est pleine quand son dernier message atteint le plafond", () => {
  const quotas = { ...DEFAULT_ECOS_QUOTAS.free, sessionMessages: 10 };
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
  // Les quotas viennent de l'offre du compte (profiles.plan), jamais d'un réglage global.
  for (const [name, source] of Object.entries({ session, chat, speech })) {
    assert.match(source, /ecosQuotasForUser\(admin, user\.id\)/, name);
    assert.doesNotMatch(source, /ecosQuotas\(\)/, name);
  }
  assert.match(session, /enforceDailyQuota\(admin, user\.id, "ecos-session-day", quotas\.dailySessions/);
  assert.match(session, /update\(\{ status: "abandoned" \}\)/);
  assert.match(chat, /enforceDailyQuota\(admin, user\.id, "ecos-chat-day"/);
  assert.match(chat, /sessionIsFull\(/);
  assert.match(chat, /wantsVoice && voiceWithinQuota/);
  assert.match(speech, /"ecos-voice-day"/);
});

test("les routes ECOS appliquent les plafonds globaux avec repli local", async () => {
  const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
  const [chat, speech, rateLimit] = await Promise.all([
    read("../app/api/ecos/chat/route.ts"),
    read("../app/api/ecos/speech/route.ts"),
    read("../app/lib/rate-limit.ts"),
  ]);
  assert.match(rateLimit, /check_anonymous_rate_limit/);
  assert.match(rateLimit, /p_bucket_key: GLOBAL_BUCKET_KEY/);
  assert.match(chat, /withinGlobalLimit\(admin, "ecos-chat-day", quotas\.globalDailyMessages/);
  assert.match(chat, /withinGlobalLimit\(admin, "ecos-voice-day", quotas\.globalDailyVoiceReplies/);
  // Plafond atteint : aucun fournisseur appelé, le moteur local répond.
  assert.match(chat, /modelWithinGlobalQuota \? patientAiChain\(\) : \[\]/);
  assert.match(speech, /withinGlobalLimit\(admin, "ecos-voice-day", quotas\.globalDailyVoiceReplies/);
});

test("la page des tarifs affiche les quotas réels et n'ouvre l'achat que si Stripe est configuré", async () => {
  const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
  const [page, profile, actions, features] = await Promise.all([
    read("../app/(marketing)/pricing/page.tsx"),
    read("../app/(app)/profil/page.tsx"),
    read("../components/profile/BillingActions.tsx"),
    read("../lib/features.ts"),
  ]);
  assert.match(page, /ecosQuotas\(process\.env, "free"\)/);
  assert.match(page, /ecosQuotas\(process\.env, "pro"\)/);
  assert.match(page, /free\.dailyVoiceReplies/);
  assert.match(page, /pro\.dailyVoiceReplies/);
  assert.match(page, /premiumOnSale\(\)/);
  assert.match(profile, /canSubscribe=\{premiumOnSale\(\)\}/);
  assert.match(actions, /canSubscribe && !isPro/);
  assert.match(features, /env\.STRIPE_PRO_PRICE_ID\?\.startsWith\("price_"\)/);
});
