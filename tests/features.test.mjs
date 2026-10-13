import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  FEATURES,
  LEARNING_PRIORITY_FEATURES,
  UPCOMING_FEATURE_LABELS,
  disabledRouteFallback,
  isLearningPriorityAvailable,
} from "../lib/features.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const ROUTES = {
  theorie: ["/theorie", "/theorie/anamnese-classique"],
  grilles: ["/grilles", "/grilles/cardio-pulmonaire"],
  fiches: ["/specialties", "/fiches", "/catalogue", "/qualite"],
  quiz: ["/quiz", "/quiz/cardiologie"],
  anatomy: ["/anatomie", "/anatomie/thorax"],
  sessions: ["/sessions", "/sessions/douleur-thoracique"],
  tutorials: ["/tutoriels", "/tutoriels/ecg"],
  premium: ["/pricing"],
};

test("le produit est centré sur les stations ECOS", () => {
  assert.equal(FEATURES.ecos, true);
  assert.equal(disabledRouteFallback("/cas"), null);
  assert.equal(disabledRouteFallback("/cas/station-01"), null);
  assert.equal(disabledRouteFallback("/dashboard"), null);
  assert.equal(disabledRouteFallback("/"), null);
});

test("l'adresse d'un module suit son interrupteur", () => {
  for (const [feature, paths] of Object.entries(ROUTES)) {
    for (const path of paths) {
      const fallback = disabledRouteFallback(path);
      if (FEATURES[feature]) assert.equal(fallback, null, `${path} doit rester accessible`);
      else assert.match(fallback ?? "", /^\/(cas)?$/, `${path} doit rediriger vers l'accueil ou les stations`);
    }
  }
  // Un préfixe n'emporte pas les adresses voisines.
  assert.equal(disabledRouteFallback("/quizz"), null);
  assert.equal(disabledRouteFallback("/fiches-techniques"), null);
  // Les fiches individuelles sont arbitrées par leur page, pas par le proxy.
  assert.equal(disabledRouteFallback("/pathologies/asthme"), null);
});

test("les priorités d'onboarding suivent les modules actifs", () => {
  for (const [priority, feature] of Object.entries(LEARNING_PRIORITY_FEATURES)) {
    assert.equal(isLearningPriorityAvailable(priority), FEATURES[feature]);
  }
  assert.equal(isLearningPriorityAvailable("cas_cliniques"), true);
});

test("les modules annoncés « prochainement » existent", () => {
  for (const { feature, label } of UPCOMING_FEATURE_LABELS) {
    assert.ok(feature in FEATURES, feature);
    assert.ok(label.length > 0);
  }
});

test("la navigation, le proxy et le tableau de bord consomment les interrupteurs", async () => {
  const [proxy, navigation, header, footer, dashboard, onboarding, casPage] = await Promise.all([
    read("../proxy.ts"),
    read("../components/navigation/ConnectedNavigation.tsx"),
    read("../components/ui/header-2.tsx"),
    read("../components/marketing/MarketingFooter.tsx"),
    read("../components/dashboard/UserDashboard.tsx"),
    read("../components/onboarding/OnboardingFlow.tsx"),
    read("../app/(app)/cas/page.tsx"),
  ]);
  assert.match(proxy, /disabledRouteFallback\(request\.nextUrl\.pathname\)/);
  assert.match(proxy, /NextResponse\.redirect/);
  for (const [name, source] of Object.entries({ navigation, header, footer })) {
    assert.match(source, /!\w+\.feature \|\| FEATURES\[\w+\.feature\]/, `${name} doit filtrer ses liens`);
  }
  for (const feature of ["theorie", "grilles", "fiches", "anatomy", "quiz", "sessions"]) {
    assert.match(navigation, new RegExp(`feature: "${feature}"`));
  }
  for (const flag of ["FEATURES.anatomy", "FEATURES.sessions", "FEATURES.quiz", "FEATURES.fiches"]) {
    assert.ok(dashboard.includes(flag), `le tableau de bord doit dépendre de ${flag}`);
  }
  assert.match(onboarding, /isLearningPriorityAvailable/);
  assert.match(casPage, /!FEATURES\.anatomy \? \[\]/);
});

test("catalogue masqué : seules les fiches liées à une station restent lisibles", async () => {
  const [page, registry, catalog] = await Promise.all([
    read("../app/(app)/pathologies/[slug]/page.tsx"),
    read("../lib/ecos/stations/index.ts"),
    read("../content/pathologies/index.json"),
  ]);
  assert.match(page, /if \(!FEATURES\.fiches && !STATION_FICHE_SLUGS\.has\(slug\)\) notFound\(\);/);
  assert.match(registry, /STATION_FICHE_SLUGS[\s\S]+debrief\.pathologySlugs/);
  const { STATION_FICHE_SLUGS } = await import("../lib/ecos/stations/index.ts");
  const published = new Set(JSON.parse(catalog).filter((item) => item.status === "ready").map((item) => item.slug));
  assert.ok(STATION_FICHE_SLUGS.size > 0);
  for (const slug of STATION_FICHE_SLUGS) assert.ok(published.has(slug), `fiche de débriefing absente du catalogue : ${slug}`);
});

test("un module masqué est fermé à tous les niveaux, pas seulement dans la navigation", async () => {
  const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
  // Pages : un layout par module répond « introuvable » si le proxy est contourné.
  const layouts = {
    "../app/(app)/theorie/layout.tsx": "theorie",
    "../app/(app)/grilles/layout.tsx": "grilles",
    "../app/(app)/quiz/layout.tsx": "quiz",
    "../app/(app)/anatomie/layout.tsx": "anatomy",
    "../app/(app)/sessions/layout.tsx": "sessions",
    "../app/(app)/specialties/layout.tsx": "fiches",
    "../app/(app)/fiches/layout.tsx": "fiches",
    "../app/(marketing)/catalogue/layout.tsx": "fiches",
    "../app/(marketing)/qualite/layout.tsx": "fiches",
    "../app/(marketing)/tutoriels/layout.tsx": "tutorials",
    "../app/(marketing)/pricing/layout.tsx": "premium",
  };
  for (const [path, feature] of Object.entries(layouts)) {
    assert.match(await read(path), new RegExp(`if \\(!FEATURES\\.${feature}\\) notFound\\(\\);`), path);
  }
  // API et actions serveur.
  assert.match(await read("../app/api/anatomy/[slug]/route.ts"), /if \(!FEATURES\.anatomy\) throw new ApiError\(404/);
  assert.match(await read("../app/api/progress/route.ts"), /if \(!FEATURES\.tutorials\) throw new ApiError\(404/);
  assert.match(await read("../app/api/billing/checkout/route.ts"), /if \(!FEATURES\.premium\) throw new ApiError\(404/);
  assert.match(await read("../app/actions/quiz.ts"), /if \(!FEATURES\.quiz\) return failure/);
  assert.match(await read("../app/actions/study-sessions.ts"), /if \(!FEATURES\.sessions\) return/);
  // Fiches : seules celles d'un débriefing restent accessibles.
  for (const path of ["../app/actions/pathologies.ts", "../app/actions/reports.ts"]) {
    assert.match(await read(path), /ficheIsAccessible\(admin, /, path);
  }
  // Tableau de bord : aucune requête ni écriture pour un module masqué.
  const dashboard = await read("../lib/dashboard/queries.ts");
  assert.match(dashboard, /FEATURES\.quiz \? getDailyQuiz\(\)/);
  assert.match(dashboard, /!FEATURES\.quiz \? none : selectAllPages/);
});
