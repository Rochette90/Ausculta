import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
} from "@/app/lib/api-security";
import { enforceRateLimit } from "@/app/lib/rate-limit";
import { AdminAccessError, assertAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
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

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await assertAdminUser().catch((error) => {
      if (error instanceof AdminAccessError) throw new ApiError(error.status, error.code, error.message);
      throw error;
    });
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "admin-question-image-upload", 30, 3600);

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES + 64_000) {
      throw new ApiError(413, "image_too_large", "L’image ne doit pas dépasser 5 Mo.");
    }

    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) {
      throw new ApiError(400, "image_required", "Sélectionnez une image.");
    }
    if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
      throw new ApiError(413, "image_too_large", "L’image ne doit pas dépasser 5 Mo.");
    }

    const extension = MIME_EXTENSIONS[image.type as keyof typeof MIME_EXTENSIONS];
    const buffer = await image.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (!extension || !isSupportedImage(bytes, image.type)) {
      throw new ApiError(415, "unsupported_image", "Utilisez une image JPG, PNG ou WebP valide.");
    }

    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from("question-images").upload(path, buffer, {
      contentType: image.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data } = admin.storage.from("question-images").getPublicUrl(path);
    return apiJson({ ok: true, url: data.publicUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
