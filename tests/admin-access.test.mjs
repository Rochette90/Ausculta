import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { adminAccessDenial } from "../lib/auth/admin-access.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("un utilisateur standard authentifié se voit refuser l'accès admin avec un 403", () => {
  const denial = adminAccessDenial({ userId: "user-standard", role: "student" });
  assert.deepEqual(denial, {
    status: 403,
    code: "admin_access_required",
    message: "Accès administrateur requis",
  });
  // Le refus ne transporte aucune donnée d'administration.
  assert.deepEqual(Object.keys(denial).sort(), ["code", "message", "status"]);
});

test("un rôle absent ou inconnu ne donne jamais l'accès admin", () => {
  for (const role of [null, undefined, "", "student", "editor", "Admin", "ADMIN", "admin "]) {
    const denial = adminAccessDenial({ userId: "user-standard", role: role ?? null });
    assert.equal(denial?.status, 403, `le rôle ${JSON.stringify(role)} ne doit pas être admin`);
  }
});

test("un visiteur anonyme reçoit un 401, un administrateur passe", () => {
  assert.equal(adminAccessDenial({ userId: null, role: "admin" })?.status, 401);
  assert.equal(adminAccessDenial({ userId: "user-admin", role: "admin" }), null);
});

test("toutes les surfaces /admin passent par la garde serveur", async () => {
  const [adminGuard, layout, imageRoute, nextConfig] = await Promise.all([
    read("../lib/auth/admin.ts"),
    read("../app/(app)/admin/layout.tsx"),
    read("../app/api/admin/questions/image/route.ts"),
    read("../next.config.ts"),
  ]);

  // Le rôle est relu depuis la session côté serveur, jamais reçu du client.
  assert.match(adminGuard, /getCurrentUser\(\)/);
  assert.match(adminGuard, /from\("profiles"\)\.select\("role"\)\.eq\("id", user\.id\)/);
  assert.match(adminGuard, /adminAccessDenial/);

  // Page : 403 réel via forbidden(), et non une redirection silencieuse.
  assert.match(adminGuard, /forbidden\(\)/);
  assert.match(nextConfig, /authInterrupts:\s*true/);
  assert.match(layout, /await requireAdminUser\(/);
  // L'UI 403 vit au-dessus du segment /admin, sinon le throw du layout admin
  // remonte à la frontière parente et Next rend son écran par défaut.
  await readFile(new URL("../app/(app)/forbidden.tsx", import.meta.url), "utf8");

  // API : le statut et le code du refus sont propagés tels quels.
  assert.match(imageRoute, /await assertAdminUser\(\)/);
  assert.match(imageRoute, /new ApiError\(error\.status, error\.code, error\.message\)/);

  const actions = await readdir(new URL("../app/actions", import.meta.url));
  const adminActions = actions.filter((file) => file.startsWith("admin-"));
  assert.ok(adminActions.length > 0);
  for (const file of adminActions) {
    const source = await read(`../app/actions/${file}`);
    assert.match(source, /await assertAdminUser\(\)/, `${file} doit appeler assertAdminUser`);
  }
});

test("aucune page /admin ne lit de données avant la garde", async () => {
  const root = new URL("../app/(app)/admin/", import.meta.url);
  const pages = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
      if (entry.isDirectory()) await walk(child);
      else if (entry.name === "page.tsx") pages.push(child);
    }
  }
  await walk(root);
  assert.ok(pages.length > 0);
  for (const page of pages) {
    const source = await readFile(page, "utf8");
    // Une page qui ne fait que rediriger n'expose rien.
    if (/^\s*redirect\(/m.test(source) && !/await get/.test(source)) continue;
    assert.match(source, /await requireAdminUser\(/, `${page.pathname} doit appeler requireAdminUser`);
    const body = source.slice(source.indexOf("export default"));
    const guardAt = body.indexOf("await requireAdminUser(");
    const firstFetch = body.search(/await (?:Promise\.all\(\[)?\s*get[A-Z]/);
    assert.ok(
      guardAt >= 0 && (firstFetch < 0 || guardAt < firstFetch),
      `${page.pathname} lit des données avant la garde admin`,
    );
  }
});

test("chaque route handler sous /api/admin appelle la garde admin", async () => {
  const root = new URL("../app/api/admin/", import.meta.url);
  const routes = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
      if (entry.isDirectory()) await walk(child);
      else if (entry.name === "route.ts") routes.push(child);
    }
  }
  await walk(root);
  assert.ok(routes.length > 0, "aucune route admin trouvée");
  for (const route of routes) {
    const source = await readFile(route, "utf8");
    assert.match(source, /assertAdminUser\(\)/, `${route.pathname} doit appeler assertAdminUser`);
  }
});
