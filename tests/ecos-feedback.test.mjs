import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ECOS_FEEDBACK_CATEGORIES } from "../lib/ecos/feedback.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const MIGRATION = "../supabase/migrations/20261012170000_ecos_feedback_and_errors.sql";

test("feedback categories match the SQL constraint", async () => {
  const sql = await read(MIGRATION);
  const keys = ECOS_FEEDBACK_CATEGORIES.map((item) => item.key);
  for (const key of keys) assert.match(sql, new RegExp(`category in \\([^)]*'${key}'`));
  assert.equal(new Set(keys).size, keys.length);
});

test("feedback and error tables stay behind service_role", async () => {
  const sql = await read(MIGRATION);
  assert.match(sql, /alter table public\.ecos_feedback enable row level security;/);
  assert.match(sql, /alter table public\.app_errors enable row level security;/);
  assert.match(sql, /revoke all on public\.ecos_feedback, public\.app_errors from anon, authenticated;/);
  assert.doesNotMatch(sql, /grant (select|insert|update|delete)[^;]*to (anon|authenticated)/);
  for (const fn of ["submit_ecos_feedback", "admin_set_ecos_feedback_status", "log_app_error", "admin_ecos_station_stats"]) {
    assert.match(sql, new RegExp(`function public\\.${fn}\\([\\s\\S]*?security definer\\s+set search_path = ''`), fn);
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}\\([^)]*\\) from public, anon, authenticated;`), fn);
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to service_role;`), fn);
  }
  // Un avis ne vise qu'une session terminée de son auteur ; les RPC admin revérifient le rôle.
  assert.match(sql, /where id = p_session_id and user_id = p_user_id and status = 'completed'/);
  assert.equal(sql.match(/role = 'admin'\) then\s+raise exception 'admin access required'/g)?.length, 2);
});

test("feedback actions authenticate, validate and rate limit", async () => {
  const source = await read("../app/actions/ecos-feedback.ts");
  assert.match(source, /^"use server";/);
  assert.match(source, /getCurrentUser\(\);\s+if \(!user\) return \{ success: false/);
  assert.match(source, /enforceRateLimit\(admin, user\.id, "ecos-feedback"/);
  assert.match(source, /assertAdminUser\(\)/);
  assert.match(source, /enforceRateLimit\(createAdminClient\(\), user\.id, "client-error"/);
  const page = await read("../app/(app)/admin/stations/page.tsx");
  assert.ok(page.indexOf("requireAdminUser(") < page.indexOf("getAdminStationStats("));
});

test("server errors are recorded from the Node runtime only", async () => {
  const source = await read("../instrumentation.ts");
  assert.match(source, /export const onRequestError/);
  assert.match(source, /NEXT_RUNTIME !== "nodejs"\) return;/);
  const logger = await read("../lib/monitoring/errors.ts");
  assert.match(logger, /^import "server-only";/);
});

