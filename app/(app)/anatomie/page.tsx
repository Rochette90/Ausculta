import { AnatomyExplorer } from "@/components/anatomy/AnatomyExplorer";
import { anatomyModules } from "@/lib/anatomy/catalog";
import { getAnatomyProgress } from "@/lib/anatomy/progress";
import { requireUser } from "@/lib/auth/require-user";
import { pageTitle } from "@/lib/brand";

export const metadata = { title: pageTitle("Anatomie clinique") };
export default async function AnatomyPage() {
  const user = await requireUser("/anatomie");
  const progress = await getAnatomyProgress(user.id);
  const modules = anatomyModules.map(({ slug, title, region, subtitle, minutes, structures }) => ({ slug, title, region, subtitle, minutes, structures: structures.length }));
  return <main className="learning-page page-enter"><header className="learning-page-head"><p className="learning-eyebrow">ANATOMIE CLINIQUE</p><h1>Comprendre le corps.<br /><em>Mieux raisonner.</em></h1><p>Relie les structures, leurs fonctions et les situations que tu rencontreras en clinique.</p></header><AnatomyExplorer modules={modules} attempts={progress.attempts} available={progress.available} /></main>;
}
