import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import {
  BRAND_DOMAIN,
  BRAND_EMAIL_FROM,
  BRAND_NAME,
  BRAND_NAME_UPPER,
  BRAND_PLAN_LABEL,
  BRAND_PRO_PLAN,
  BRAND_STAGE,
  BRAND_TITLE,
  LEGACY_ONBOARDING_METADATA_KEY,
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
  assert.equal(BRAND_PRO_PLAN, `${BRAND_NAME} ${BRAND_PLAN_LABEL}`);
  // « Pro » est réservé à un futur produit pour les soignants.
  assert.notEqual(BRAND_PLAN_LABEL, "Pro");
  assert.equal(pageTitle("Tableau de bord"), `Tableau de bord — ${BRAND_TITLE}`);
  // Pendant la phase de test, la mention suit le nom ; au lancement, BRAND_STAGE vaut null.
  assert.equal(BRAND_TITLE, BRAND_STAGE ? `${BRAND_NAME} ${BRAND_STAGE}` : BRAND_NAME);
});

test("le nom de marque n'apparaît en dur nulle part ailleurs que dans la configuration", async () => {
  const files = await sourceFiles(["app", "components", "lib", "types", "scripts"]);
  const offenders = [];
  for (const file of files) {
    if (file.pathname.endsWith(CONFIG)) continue;
    const source = await readFile(file, "utf8");
    const needles = [BRAND_NAME, BRAND_NAME_UPPER, BRAND_DOMAIN];
    for (const needle of needles) {
      // Mot entier uniquement : le nom est aussi le début d'un terme médical
      // courant (« auscultation », « auscultatoire »), légitime dans les stations.
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, "iu").exec(source);
      if (match) offenders.push(`${file.pathname} : ${source.slice(match.index, match.index + 60)}`);
    }
  }
  assert.deepEqual(offenders, [], `marque en dur :\n${offenders.join("\n")}`);
});

test("les identifiants techniques sont figés et l'ancien onboarding reste lisible", async () => {
  // Écrits en dur : les modifier réinitialise le thème et l'onboarding enregistrés.
  assert.equal(THEME_STORAGE_KEY, "ausculta-theme");
  assert.equal(PROGRESS_EVENT_NAME, "ausculta:progress");
  assert.equal(PATHNAME_HEADER, "x-ausculta-pathname");
  assert.equal(ONBOARDING_METADATA_KEY, "ausculta_onboarding");
  // Les comptes créés sous l'ancien nom ne repassent pas par l'onboarding.
  assert.equal(LEGACY_ONBOARDING_METADATA_KEY, "medtrain_onboarding");
  const metadata = await readFile(new URL("../lib/onboarding/metadata.ts", import.meta.url), "utf8");
  assert.match(metadata, /\[ONBOARDING_METADATA_KEY\] \?\? user\.user_metadata\?\.\[LEGACY_ONBOARDING_METADATA_KEY\]/);
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
