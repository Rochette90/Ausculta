import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { requireUser } from "@/lib/auth/require-user";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getClinicalCaseCatalog } from "@/lib/ecos/cases";
import { ecos3Parcours } from "@/lib/ecos/curriculum";
import { getEcosProgress } from "@/lib/ecos/progress";
import { getPracticeGrids } from "@/lib/grids/queries";
import { FEATURES } from "@/lib/features";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Tableau de bord") };

/**
 * Prochain patient conseillé : un type de l'ECOS de 3ᵉ année encore jamais
 * rencontré, sinon une station pas encore jouée, sinon n'importe laquelle.
 */
function nextPatient(done: ReadonlySet<string>): { code: string; typeLabel: string } | null {
  const types = ecos3Parcours().filter((type) => type.codes.length > 0);
  const unmet = types.find((type) => !type.codes.some((code) => done.has(code)));
  const pick = (type: (typeof types)[number], codes: string[]) => ({ code: codes[Math.floor(Math.random() * codes.length)], typeLabel: type.label });
  if (unmet) return pick(unmet, unmet.codes);
  const fresh = types.find((type) => type.codes.some((code) => !done.has(code)));
  if (fresh) return pick(fresh, fresh.codes.filter((code) => !done.has(code)));
  return types.length ? pick(types[0], types[0].codes) : null;
}

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  // Les catalogues des stations et des grilles alimentent l'accueil ; leur
  // échec ne doit pas rendre le tableau de bord indisponible.
  const [data, stations, grids, progress] = await Promise.all([
    getDashboardData(user.id),
    FEATURES.ecos ? getClinicalCaseCatalog().catch(() => []) : [],
    FEATURES.grilles ? getPracticeGrids().catch(() => []) : [],
    FEATURES.ecos ? getEcosProgress(user.id).catch(() => null) : null,
  ]);
  const firstName = data.profile.full_name?.trim().split(/\s+/)[0] ?? null;
  const suggestion = FEATURES.ecos && progress ? nextPatient(new Set(Object.keys(progress.best))) : null;
  return <UserDashboard data={data} firstName={firstName} stations={stations} grids={grids} progress={progress} suggestion={suggestion} />;
}
