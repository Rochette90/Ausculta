import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import {
  BRAND_DOMAIN,
  BRAND_EMAIL_FROM,
  BRAND_NAME,
  BRAND_NAME_UPPER,
  BRAND_PRO_PLAN,
  ONBOARDING_METADATA_KEY,
  PATHNAME_HEADER,
  PROGRESS_EVENT_NAME,
  THEME_STORAGE_KEY,
  pageTitle,
} from "../lib/brand.ts";

const CONFIG = "lib/brand.ts";

async function sourceFiles(roots) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      // Un doublon non routé traîne dans le dépôt : hors périmètre.
      if (entry.name.includes(" 2.")) continue;
      const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
      if (entry.isDirectory()) await walk(child);
      else if (/\.(tsx?|mjs|css)$/.test(entry.name)) files.push(child);
    }
  }
  for (const root of roots) await walk(new URL(`../${root}/`, import.meta.url));
  return files;
}

test("la configuration de marque expose une identité cohérente", () => {
  assert.equal(BRAND_NAME_UPPER, BRAND_NAME.toLocaleUpperCase("fr-CH"));
  assert.ok(BRAND_EMAIL_FROM.endsWith(`@${BRAND_DOMAIN}`));
  assert.equal(BRAND_PRO_PLAN, `${BRAND_NAME} Pro`);
  assert.equal(pageTitle("Tableau de bord"), `Tableau de bord — ${BRAND_NAME}`);
});

test("le nom de marque n'apparaît en dur nulle part ailleurs que dans la configuration", async () => {
  const files = await sourceFiles(["app", "components", "lib", "types", "scripts"]);
  const offenders = [];
  for (const file of files) {
    if (file.pathname.endsWith(CONFIG)) continue;
    const source = await readFile(file, "utf8");
    const needles = [BRAND_NAME, BRAND_NAME_UPPER, BRAND_DOMAIN];
    for (const needle of needles) {
      const index = source.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
      if (index >= 0) offenders.push(`${file.pathname} : ${source.slice(index, index + 60)}`);
    }
  }
  assert.deepEqual(offenders, [], `marque en dur :\n${offenders.join("\n")}`);
});

test("les identifiants techniques persistés ne suivent pas le renommage", () => {
  // Changer ces clés invaliderait le thème et l'onboarding déjà enregistrés.
  assert.equal(THEME_STORAGE_KEY, "medtrain-theme");
  assert.equal(PROGRESS_EVENT_NAME, "medtrain:progress");
  assert.equal(PATHNAME_HEADER, "x-medtrain-pathname");
  assert.equal(ONBOARDING_METADATA_KEY, "medtrain_onboarding");
});

test("les surfaces de marque consomment la configuration", async () => {
  const [logo, footer, rootLayout, contact, stripe] = await Promise.all([
    readFile(new URL("../components/brand/BrandLogo.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/marketing/MarketingFooter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/marketing/ContactForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/stripe.ts", import.meta.url), "utf8"),
  ]);
  for (const [name, source] of Object.entries({ logo, footer, rootLayout, contact, stripe })) {
    assert.match(source, /from "@\/lib\/brand"/, `${name} doit importer la configuration de marque`);
  }
  // Le composant consomme l'asset officiel déclaré dans la configuration.
  assert.match(logo, /BRAND_LOGO_SRC/);
  const config = await readFile(new URL("../lib/brand.ts", import.meta.url), "utf8");
  assert.match(config, /BRAND_LOGO_SRC = "\/[^"]+\.(?:svg|png)"/);
});
