import { CaseCatalog } from "@/components/ecos/CaseCatalog";
import { requireUser } from "@/lib/auth/require-user";
import { getClinicalCaseCatalog } from "@/lib/ecos/cases";
import { pageTitle } from "@/lib/brand";
import { FEATURES } from "@/lib/features";
import { EXAM_DURATION_SECONDS } from "@/lib/ecos/timing";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle(FEATURES.anatomy ? "Cas cliniques & ECOS" : "Stations ECOS") };
export default async function CasPage() {
  await requireUser("/cas");
  const cases = await getClinicalCaseCatalog();
  // Les mini-cas de raisonnement appartiennent au module d'anatomie.
  const reasoning = !FEATURES.anatomy ? [] : (await import("@/lib/anatomy/catalog")).anatomyModules.map((module) => ({ slug: module.slug, title: module.case.title, region: module.region, moduleTitle: module.title }));
  const examMinutes = Math.round(EXAM_DURATION_SECONDS / 60);
  return (
    <main className="learning-page">
      <header className="learning-page-head">
        {FEATURES.anatomy
          ? <><h1>Cas cliniques et ECOS</h1><p className="dash-greeting voice">Du savoir au raisonnement.</p><p>Localise une lésion dans un mini-cas, ou mène un entretien avec un patient simulé. Choisis ton format, puis apprends de ta correction.</p></>
          : <><h1>Stations ECOS</h1><p className="dash-greeting voice">Ton prochain patient t’attend.</p><p>Mène l’entretien, examine, conclus. Chaque station se termine par ta grille corrigée et un débriefing.</p></>}
      </header>
      <dl className="catalog-modes">
        {FEATURES.anatomy
          ? <><div><dt>ECOS</dt><dd>Entretien chronométré, au clavier ou à la voix, en mode entraînement ou examen.</dd></div><div><dt>Raisonnement</dt><dd>Vignettes anatomocliniques courtes et correction expliquée.</dd></div></>
          : <><div><dt>Entraînement</dt><dd>Sans chronomètre, à ton rythme.</dd></div><div><dt>Examen</dt><dd>{examMinutes} minutes pour toute la station. Grille et score au bilan, à la fin.</dd></div><div><dt>À la voix</dt><dd>Parle au patient, il te répond. Le clavier reste disponible.</dd></div></>}
      </dl>
      <CaseCatalog cases={cases} reasoning={reasoning} />
    </main>
  );
}
