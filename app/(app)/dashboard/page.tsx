import { UserDashboard } from "../../../components/dashboard/UserDashboard";
import { requireUser, userPresentation } from "../../../lib/auth/require-user";
import { getDashboardData } from "../../../lib/dashboard/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tableau de bord — MedTrain" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const data = await getDashboardData(user.id);
  return <UserDashboard data={data} firstName={userPresentation(user).firstName} />;
}
