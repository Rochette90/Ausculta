export function initialsFrom(identity: string): string {
  return identity
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr-CH") ?? "")
    .join("");
}

export function profileAvatarUrl(
  userId: string,
  profile: { avatar_url: string | null; updated_at?: string | null } | null,
): string | null {
  if (!profile?.avatar_url?.startsWith(`${userId}/`)) return null;
  return `/api/profile/avatar?v=${encodeURIComponent(profile.updated_at ?? profile.avatar_url)}`;
}
