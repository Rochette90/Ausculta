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
  return <main className="learning-page page-enter"><header className="learning-page-head">{FEATURES.anatomy
    ? <><p className="learning-eyebrow">CAS CLINIQUES & ECOS</p><h1>Du savoir<br /><em>au raisonnement.</em></h1><p>Localise une lésion dans un mini-cas, ou mène un entretien avec un patient simulé. Choisis ton format, puis apprends de ta correction.</p></>
    : <><p className="learning-eyebrow">STATIONS ECOS</p><h1>Ton prochain patient<br /><em>t’attend.</em></h1><p>Mène l’entretien avec un patient simulé, examine, conclus. Chaque station se termine par ta grille corrigée et un débriefing.</p></>}</header><div className="learning-callout">{FEATURES.anatomy
    ? <><p className="learning-eyebrow">DEUX FAÇONS DE S’ENTRAÎNER</p><p className="m-0 text-sm text-[var(--ink-secondary)]"><strong>ECOS :</strong> entretien chronométré, au clavier ou à la voix, en mode entraînement ou examen. <strong>Raisonnement :</strong> vignettes anatomocliniques courtes et correction expliquée.</p></>
    : <><p className="learning-eyebrow">DEUX MODES</p><p className="m-0 text-sm text-[var(--ink-secondary)]"><strong>Entraînement :</strong> sans chronomètre. <strong>Examen :</strong> {Math.round(EXAM_DURATION_SECONDS / 60)} minutes pour toute la station. Grille et score au bilan, à la fin. Au clavier ou à la voix.</p></>}</div><CaseCatalog cases={cases} reasoning={reasoning} /></main>;
}
