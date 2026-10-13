import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { isPlausibleEmail, isRecentRecoverySession, passwordProblem, PASSWORD_MIN_LENGTH } from "../lib/auth/password.ts";
import { buildContentSecurityPolicy, createNonce } from "../lib/security/csp.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("password rules reject short, long, control-character and blank passwords", () => {
  assert.equal(passwordProblem("a".repeat(PASSWORD_MIN_LENGTH)), null);
  assert.match(passwordProblem("court"), /au moins/);
  assert.match(passwordProblem("x".repeat(129)), /dépasser/);
  assert.match(passwordProblem("motdepasse\u0000"), /non autorisés/);
  assert.match(passwordProblem("        "), /espaces/);
  assert.match(passwordProblem(undefined), /obligatoire/);
});

test("recovery sessions are only trusted when recent and recovery-based", () => {
  const now = 1_800_000_000;
  assert.equal(isRecentRecoverySession([{ method: "recovery", timestamp: now - 600 }], now), true);
  assert.equal(isRecentRecoverySession([{ method: "recovery", timestamp: now - 3_601 }], now), false);
  assert.equal(isRecentRecoverySession([{ method: "password", timestamp: now }], now), false);
  assert.equal(isRecentRecoverySession([{ method: "password", timestamp: now }, { method: "recovery", timestamp: now }], now), false);
  assert.equal(isRecentRecoverySession([{ method: "recovery" }], now), false);
  assert.equal(isRecentRecoverySession([], now), false);
  assert.equal(isRecentRecoverySession(undefined, now), false);
});

test("email plausibility check is strict enough for rate-limit keys", () => {
  assert.equal(isPlausibleEmail("prenom.nom@unil.ch"), true);
  assert.equal(isPlausibleEmail("sans-arobase"), false);
  assert.equal(isPlausibleEmail("deux@@unil.ch"), false);
  assert.equal(isPlausibleEmail(`${"a".repeat(250)}@x.ch`), false);
  assert.equal(isPlausibleEmail(42), false);
});

test("content security policy uses a nonce with strict-dynamic when provided", () => {
  const nonce = createNonce();
  assert.match(nonce, /^[A-Za-z0-9+/]{22}==$/);
  assert.notEqual(nonce, createNonce());
  const withNonce = buildContentSecurityPolicy({ nonce });
  assert.match(withNonce, new RegExp(`script-src 'self' 'nonce-${nonce.replace(/[+/]/g, "\\$&")}' 'strict-dynamic'`));
  assert.match(withNonce, /frame-ancestors 'none'/);
  assert.match(withNonce, /upgrade-insecure-requests/);
  assert.doesNotMatch(withNonce, /unsafe-eval/);
  const fallback = buildContentSecurityPolicy({ isDevelopment: true });
  assert.doesNotMatch(fallback, /nonce-/);
  assert.match(fallback, /'unsafe-eval'/);
  assert.doesNotMatch(fallback, /upgrade-insecure-requests/);
});

test("proxy issues a per-request nonce and next.config keeps the fallback policy", async () => {
  const [proxy, nextConfig] = await Promise.all([read("../proxy.ts"), read("../next.config.ts")]);
  assert.match(proxy, /createNonce\(\)/);
  assert.match(proxy, /"content-security-policy": contentSecurityPolicy/);
  assert.match(proxy, /response\.headers\.set\("Content-Security-Policy"/);
  assert.match(nextConfig, /buildContentSecurityPolicy\(\{ isDevelopment \}\)/);
});

test("password routes are guarded and never leak account existence", async () => {
  const [reset, update] = await Promise.all([
    read("../app/api/auth/password-reset/route.ts"),
    read("../app/api/account/password/route.ts"),
  ]);
  assert.match(reset, /assertSameOrigin\(request\)/);
  assert.match(reset, /enforceAnonymousRateLimit\(admin, request, "password-reset"/);
  assert.match(reset, /check_anonymous_rate_limit/);
  assert.match(reset, /createHash\("sha256"\)\.update\(`email:\$\{email\}`\)/);
  assert.match(reset, /return apiJson\(\{ ok: true \}\)/);
  assert.doesNotMatch(reset, /throw error/);
  assert.match(reset, /\/auth\/callback\?next=/);

  assert.match(update, /assertSameOrigin\(request\)/);
  assert.match(update, /requireAuthenticatedUser\(\)/);
  assert.match(update, /enforceRateLimit\(admin, user\.id, "password-update"/);
  assert.match(update, /isRecentRecoverySession\(claimsData\?\.claims\?\.amr\)/);
  assert.match(update, /signInWithPassword\(\{ email: user\.email, password: body\.currentPassword \}\)/);
  assert.match(update, /signOut\(\{ scope: "others" \}\)/);
  assert.match(update, /persistSession: false/);
});

test("account hardening migration removes client storage writes and sanitises signup metadata", async () => {
  const migration = await read("../supabase/migrations/20261012130000_account_hardening.sql");
  for (const policy of ["avatars_insert_own", "avatars_update_own", "avatars_delete_own", "question_images_insert_admin", "question_images_update_admin", "question_images_delete_admin", "profiles_update_own"]) {
    assert.match(migration, new RegExp(`drop policy if exists "${policy}"`));
  }
  assert.match(migration, /create or replace function public\.handle_new_user\(\)/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /left\(/);
  assert.match(migration, /\^https:\/\//);
  assert.match(migration, /on_auth_user_email_changed/);
});

test("auth and legal pages exist and are linked", async () => {
  const [authForm, footer, login, profile, brand] = await Promise.all([
    read("../components/auth/AuthForm.tsx"),
    read("../components/marketing/MarketingFooter.tsx"),
    read("../components/auth/AuthPage.tsx"),
    read("../app/(app)/profil/page.tsx"),
    read("../lib/brand.ts"),
  ]);
  assert.match(authForm, /href="\/mot-de-passe-oublie"/);
  assert.match(authForm, /href="\/cgu"/);
  assert.match(authForm, /href="\/confidentialite"/);
  for (const href of ["/mentions-legales", "/cgu", "/confidentialite"]) assert.match(footer, new RegExp(`href: "${href}"`));
  assert.match(login, /CALLBACK_ERRORS/);
  assert.match(profile, /<ChangePasswordForm \/>/);
  assert.match(brand, /export const BRAND_LEGAL/);
  for (const page of ["mentions-legales", "cgu", "confidentialite"]) {
    const source = await read(`../app/(marketing)/${page}/page.tsx`);
    assert.match(source, /<LegalPage/);
    assert.doesNotMatch(source, /Ausculta/);
  }
  for (const page of ["mot-de-passe-oublie", "reinitialiser-mot-de-passe"]) {
    assert.match(await read(`../app/(auth)/${page}/page.tsx`), /<AuthShell>/);
  }
});
