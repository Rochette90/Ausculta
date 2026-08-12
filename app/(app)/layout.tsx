import { headers } from "next/headers";
import { ConnectedNavigation } from "../../components/navigation/ConnectedNavigation";
import { requireUser, userPresentation } from "../../lib/auth/require-user";
import { getProfileSummary } from "../../lib/profile/queries";

export const dynamic = "force-dynamic";

export default async function ConnectedLayout({ children }: { children: React.ReactNode }) {
  const requestedPath = (await headers()).get("x-medtrain-pathname");
  const returnTo = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/dashboard";
  const user = await requireUser(returnTo);
  const profile = await getProfileSummary(user.id);
  return <div className="app-shell"><ConnectedNavigation initials={userPresentation(user).initials} isAdmin={profile?.role === "admin"} streak={profile?.streak ?? 0} />{children}</div>;
}
