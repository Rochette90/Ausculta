import { initialsFrom, profileAvatarUrl } from "@/lib/profile/presentation";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ConnectedNavigation } from "@/components/navigation/ConnectedNavigation";
import { requireUser } from "@/lib/auth/require-user";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { getProfileSummary } from "@/lib/profile/queries";
import { getOnboardingMetadata } from "@/lib/onboarding/metadata";
import { PATHNAME_HEADER } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function ConnectedLayout({ children }: { children: React.ReactNode }) {
  const requestedPath = (await headers()).get(PATHNAME_HEADER);
  const returnTo = safeRedirectPath(requestedPath);
  const user = await requireUser(returnTo);
  const profile = await getProfileSummary(user.id);
  const onboarding = getOnboardingMetadata(user);

  // Un compte qui n'a ni terminé ni explicitement passé l'onboarding est
  // renvoyé vers celui-ci avant d'accéder au reste de l'espace connecté.
  // L'admin garde toujours accès à son back-office.
  const onboardingDone = Boolean(
    profile?.onboarding_completed_at
    || profile?.onboarding_skipped_at
    || onboarding.completedAt
    || onboarding.skippedAt,
  );
  if (!onboardingDone && profile?.role !== "admin" && !returnTo.startsWith("/admin")) {
    redirect(`/onboarding?next=${encodeURIComponent(returnTo)}`);
  }

  const identity: string = profile?.full_name?.trim() || user.email?.split("@")[0] || "Étudiant";
  const initials = initialsFrom(identity);
  const avatarUrl = profileAvatarUrl(user.id, profile);
  return <div className="app-shell"><ConnectedNavigation avatarUrl={avatarUrl} initials={initials} isAdmin={profile?.role === "admin"} streak={profile?.streak ?? 0} /><div id="learning-content" tabIndex={-1}>{children}</div></div>;
}
