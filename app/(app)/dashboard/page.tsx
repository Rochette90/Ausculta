import { UserDashboard } from "../../../components/dashboard/UserDashboard";
import { requireUser } from "../../../lib/auth/require-user";
import { getDashboardData } from "../../../lib/dashboard/queries";
import { getClinicalCaseCatalog } from "../../../lib/ecos/cases";
import { FEATURES } from "../../../lib/features";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Tableau de bord") };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  // Le catalogue des stations alimente l'accueil ; son échec ne doit pas
  // rendre le tableau de bord indisponible.
  const [data, stations] = await Promise.all([
    getDashboardData(user.id),
    FEATURES.ecos ? getClinicalCaseCatalog().catch(() => []) : [],
  ]);
  const firstName = data.profile.full_name?.trim().split(/\s+/)[0] ?? null;
  return <UserDashboard data={data} firstName={firstName} stations={stations} />;
}
