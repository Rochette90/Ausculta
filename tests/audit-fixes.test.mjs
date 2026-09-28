import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { safeRedirectPath } from "../lib/auth/safe-redirect.ts";
import { isOwnAvatarPath } from "../lib/profile/avatar-path.ts";
import { activeStreak, shiftIsoDate } from "../lib/progress/streak.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("post-login redirects stay on the same origin", () => {
  for (const hostile of [
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r\n/evil.com",
    "/%09/evil.com".replace("%09", "\t"),
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    null,
    undefined,
    42,
    `/${"a".repeat(3_000)}`,
  ]) {
    assert.equal(safeRedirectPath(hostile), "/dashboard", JSON.stringify(hostile));
  }
  assert.equal(safeRedirectPath("/cas/douleur-thoracique-aigue?mode=exam#top"), "/cas/douleur-thoracique-aigue?mode=exam#top");
  assert.equal(safeRedirectPath("/specialties"), "/specialties");
  assert.equal(safeRedirectPath("//evil.com", "/login"), "/login");
  // Dot segments are normalised but cannot leave the origin.
  assert.equal(safeRedirectPath("/../../etc"), "/etc");
});

test("avatar paths must match the exact shape written by the upload route", () => {
  const uid = "8d6b0c52-5f3a-4a54-9f2c-3b0d7a1e9c11";
  const other = "0f0e2a1b-1111-4222-8333-944455556666";
  assert.equal(isOwnAvatarPath(uid, `${uid}/avatar-1790589175123.png`), true);
  assert.equal(isOwnAvatarPath(uid, `${uid}/avatar-1.webp`), true);
  assert.equal(isOwnAvatarPath(uid, `${uid}/../${other}/avatar-1.png`), false);
  assert.equal(isOwnAvatarPath(uid, `${other}/avatar-1.png`), false);
  assert.equal(isOwnAvatarPath(uid, `${uid}/avatar-1.svg`), false);
  assert.equal(isOwnAvatarPath(uid, `${uid}/nested/avatar-1.png`), false);
  assert.equal(isOwnAvatarPath(uid, `${uid}/avatar-.png`), false);
});

test("a stored streak is only shown while it is still alive", () => {
  assert.equal(shiftIsoDate("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftIsoDate("2026-12-31", 1), "2027-01-01");
  assert.equal(activeStreak(5, "2026-09-28", "2026-09-28"), 5);
  assert.equal(activeStreak(5, "2026-09-27", "2026-09-28"), 5);
  assert.equal(activeStreak(5, "2026-09-26", "2026-09-28"), 0);
  assert.equal(activeStreak(5, null, "2026-09-28"), 0);
  assert.equal(activeStreak(null, "2026-09-28", "2026-09-28"), 0);
});

test("security migration closes the admin question RPC and fixes streak updates", async () => {
  const sql = await read("../supabase/migrations/20260928110000_security_and_streak_fixes.sql");
  const signature22 = /uuid, uuid, uuid, uuid, text, text, text, text, text, integer, text, text,\s+boolean, text, text, text, integer, integer, uuid\[\], jsonb, text, text\s*\)/;
  assert.match(sql, new RegExp(`revoke all on function public\\.admin_upsert_question\\(\\s+${signature22.source}\\s*from public, anon, authenticated`));
  assert.match(sql, new RegExp(`grant execute on function public\\.admin_upsert_question\\(\\s+${signature22.source}\\s*to service_role`));
  assert.match(sql, /drop function if exists public\.admin_upsert_question\(/);
  assert.match(sql, /revoke update on public\.profiles from anon, authenticated/);
  assert.match(sql, /when p\.last_activity_date = v_today - 1 then p\.streak \+ 1/);
  assert.match(sql, /when xp_amount = 0 then p\.streak/);
  assert.doesNotMatch(sql, /when not is_daily then p\.streak/);
  // Every SECURITY DEFINER function added by this project pins its search_path.
  assert.equal((sql.match(/security definer/g) ?? []).length, (sql.match(/set search_path = ''/g) ?? []).length);
});

test("the admin question action always calls the 22-parameter RPC", async () => {
  const source = await read("../app/actions/admin-questions.ts");
  assert.match(source, /p_image_url:/);
  assert.match(source, /p_image_alt:/);
});

test("paginated reads go past the 1 000-row PostgREST cap", async () => {
  const { selectAllPages } = await import("../lib/supabase/select-all.ts");
  const table = Array.from({ length: 2_345 }, (_, id) => ({ id }));
  const calls = [];
  const result = await selectAllPages(async (from, to) => {
    calls.push([from, to]);
    return { data: table.slice(from, to + 1), error: null };
  });
  assert.equal(result.error, null);
  assert.equal(result.data.length, 2_345);
  assert.deepEqual(calls, [[0, 999], [1_000, 1_999], [2_000, 2_999]]);

  const failure = new Error("boom");
  const failed = await selectAllPages(async (from) => ({ data: from === 0 ? table.slice(0, 1_000) : null, error: from === 0 ? null : failure }));
  assert.equal(failed.error, failure);
});

test("billing states: one live subscription at a time, every live one cancelled on deletion", async () => {
  const { blocksNewCheckout, grantsPro, needsCancellation } = await import("../app/lib/billing.ts");
  for (const status of ["active", "trialing", "past_due", "unpaid", "paused"]) assert.equal(blocksNewCheckout(status), true, status);
  for (const status of ["incomplete", "incomplete_expired", "canceled"]) assert.equal(blocksNewCheckout(status), false, status);
  assert.deepEqual(["active", "trialing", "past_due"].map(grantsPro), [true, true, false]);
  assert.deepEqual(["trialing", "past_due", "unpaid", "canceled", "incomplete_expired"].map(needsCancellation), [true, true, true, false, false]);

  const [checkout, account, webhook] = await Promise.all([
    read("../app/api/billing/checkout/route.ts"),
    read("../app/api/account/route.ts"),
    read("../app/api/billing/webhook/route.ts"),
  ]);
  assert.match(checkout, /blocksNewCheckout\(subscription\.status\)/);
  assert.match(checkout, /status: 409|ApiError\(409/);
  assert.match(checkout, /sessions\.expire\(/);
  assert.match(account, /status: "all"/);
  assert.doesNotMatch(account, /status: "active"/);
  assert.match(webhook, /subscriptions\.retrieve\(/);
  assert.match(webhook, /grantsPro\(/);
});
