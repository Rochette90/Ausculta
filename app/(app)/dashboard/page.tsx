import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { requireUser } from "@/lib/auth/require-user";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getClinicalCaseCatalog } from "@/lib/ecos/cases";
import { getPracticeGrids } from "@/lib/grids/queries";
import { FEATURES } from "@/lib/features";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Tableau de bord") };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  // Les catalogues des stations et des grilles alimentent l'accueil ; leur
  // échec ne doit pas rendre le tableau de bord indisponible.
  const [data, stations, grids] = await Promise.all([
    getDashboardData(user.id),
    FEATURES.ecos ? getClinicalCaseCatalog().catch(() => []) : [],
    FEATURES.grilles ? getPracticeGrids().catch(() => []) : [],
  ]);
  const firstName = data.profile.full_name?.trim().split(/\s+/)[0] ?? null;
  return <UserDashboard data={data} firstName={firstName} stations={stations} grids={grids} />;
}
