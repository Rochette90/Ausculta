import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  requireAuthenticatedUser,
} from "../../../lib/api-security";
import { enforceRateLimit } from "../../../lib/rate-limit";
import { createAdminClient } from "../../../../lib/supabase/server";
import { isOwnAvatarPath } from "../../../../lib/profile/avatar-path";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

function isSupportedImage(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((value, index) => bytes[index] === value);
  }
  if (mimeType === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

async function currentAvatarPath(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();
  if (error) throw error;
  const path = typeof data.avatar_url === "string" ? data.avatar_url : null;
  return path && isOwnAvatarPath(userId, path) ? path : null;
}


export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const path = await currentAvatarPath(user.id);
    if (!path) throw new ApiError(404, "avatar_not_found", "Photo de profil introuvable");

    const admin = createAdminClient();
    const { data, error } = await admin.storage.from("avatars").download(path);
    if (error || !data) throw new ApiError(404, "avatar_not_found", "Photo de profil introuvable");

    return new Response(await data.arrayBuffer(), {
      headers: {
        "cache-control": "private, no-store, max-age=0",
        "content-type": data.type || "application/octet-stream",
        "content-security-policy": "default-src 'none'",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireAuthenticatedUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "avatar-update", 10, 60);

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_AVATAR_BYTES + 64_000) {
      throw new ApiError(413, "avatar_too_large", "La photo ne doit pas dépasser 2 Mo.");
    }

    const form = await request.formData();
    const avatar = form.get("avatar");
    if (!(avatar instanceof File)) {
      throw new ApiError(400, "avatar_required", "Sélectionnez une photo.");
    }
    if (avatar.size === 0 || avatar.size > MAX_AVATAR_BYTES) {
      throw new ApiError(413, "avatar_too_large", "La photo ne doit pas dépasser 2 Mo.");
    }

    const extension = MIME_EXTENSIONS[avatar.type as keyof typeof MIME_EXTENSIONS];
    const buffer = await avatar.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (!extension || !isSupportedImage(bytes, avatar.type)) {
      throw new ApiError(415, "unsupported_avatar", "Utilisez une image JPG, PNG ou WebP valide.");
    }

    const previousPath = await currentAvatarPath(user.id);
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await admin.storage.from("avatars").upload(path, buffer, {
      contentType: avatar.type,
      cacheControl: "0",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { error: profileError } = await admin
      .from("profiles")
      .update({ avatar_url: path, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (profileError) {
      await admin.storage.from("avatars").remove([path]);
      throw profileError;
    }

    if (previousPath && previousPath !== path) {
      await admin.storage.from("avatars").remove([previousPath]);
    }

    return apiJson({ ok: true, avatarUrl: `/api/profile/avatar?v=${Date.now()}` });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireAuthenticatedUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "avatar-delete", 10, 60);

    const path = await currentAvatarPath(user.id);
    const { error: profileError } = await admin
      .from("profiles")
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (profileError) throw profileError;
    if (path) await admin.storage.from("avatars").remove([path]);

    return apiJson({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
