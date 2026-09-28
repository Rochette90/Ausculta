/**
 * Only accept the exact storage path written by `POST /api/profile/avatar`.
 * A prefix check alone would let `<uid>/../<other-uid>/avatar.png` reach
 * another user's object once the path is resolved by the storage client.
 */
export function isOwnAvatarPath(userId: string, path: string) {
  const [owner, file, ...rest] = path.split("/");
  return owner === userId && rest.length === 0 && /^avatar-\d{1,16}\.(?:jpg|png|webp)$/.test(file ?? "");
}
