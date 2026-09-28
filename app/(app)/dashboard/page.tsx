import { UserDashboard } from "../../../components/dashboard/UserDashboard";
import { requireUser } from "../../../lib/auth/require-user";
import { getDashboardData } from "../../../lib/dashboard/queries";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Tableau de bord") };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const data = await getDashboardData(user.id);
  const firstName = data.profile.full_name?.trim().split(/\s+/)[0] ?? null;
  return <UserDashboard data={data} firstName={firstName} />;
}
