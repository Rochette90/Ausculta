import { CaseCatalog } from "@/components/ecos/CaseCatalog";
import { requireUser } from "@/lib/auth/require-user";
import { getClinicalCaseCatalog } from "@/lib/ecos/cases";
import { anatomyModules } from "@/lib/anatomy/catalog";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Cas cliniques & ECOS") };
export default async function CasPage() {
  await requireUser("/cas");
  const cases = await getClinicalCaseCatalog();
  const reasoning = anatomyModules.map((module) => ({ slug: module.slug, title: module.case.title, region: module.region, moduleTitle: module.title }));
  return <main className="learning-page page-enter"><header className="learning-page-head"><p className="learning-eyebrow">CAS CLINIQUES & ECOS</p><h1>Du savoir<br /><em>au raisonnement.</em></h1><p>Localise une lésion dans un mini-cas, ou mène un entretien avec un patient simulé. Choisis ton format, puis apprends de ta correction.</p></header><div className="anatomy-objectives"><p className="learning-eyebrow">DEUX FAÇONS DE S’ENTRAÎNER</p><p className="m-0 text-sm text-[var(--ink-secondary)]"><strong>ECOS :</strong> entretien chronométré, au clavier ou à la voix, en mode entraînement ou examen. <strong>Raisonnement :</strong> vignettes anatomocliniques courtes et correction expliquée.</p></div><CaseCatalog cases={cases} reasoning={reasoning} /></main>;
}
