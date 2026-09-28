import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  readJsonObject,
} from "../../lib/api-security";
import { enforceAnonymousRateLimit } from "../../lib/rate-limit";
import { createAdminClient } from "../../../lib/supabase/server";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function readString(body: Record<string, unknown>, key: string, maxLength: number): string {
  const value = typeof body[key] === "string" ? body[key].trim() : "";
  return value.slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJsonObject(request, 8_192);
    const name = readString(body, "name", 200);
    const email = readString(body, "email", 320);
    const topic = readString(body, "topic", 120);
    const message = readString(body, "message", 4_000);

    if (!name || !email || !EMAIL_PATTERN.test(email) || !topic || message.length < 5) {
      throw new ApiError(400, "invalid_contact_message", "Merci de vérifier les champs du formulaire");
    }

    const admin = createAdminClient();
    await enforceAnonymousRateLimit(admin, request, "contact-message", 5, 3_600);

    const { data, error } = await admin.rpc("create_contact_message", {
      p_name: name,
      p_email: email,
      p_topic: topic,
      p_message: message,
    });
    if (error) throw error;

    return apiJson({ id: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
