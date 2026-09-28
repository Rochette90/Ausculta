import { UUID_PATTERN } from "@/lib/validation";
import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  readJsonObject,
  requireAuthenticatedUser,
} from "../../lib/api-security";
import { enforceRateLimit } from "../../lib/rate-limit";
import { createAdminClient } from "../../../lib/supabase/server";


function requiredInteger(value: unknown, minimum: number, maximum: number, label: string) {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new ApiError(400, "invalid_profile", `${label} doit être compris entre ${minimum} et ${maximum}.`);
  }
  return value as number;
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireAuthenticatedUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "profile-update", 20, 60);

    const body = await readJsonObject(request, 4_096);
    if (typeof body.fullName !== "string") {
      throw new ApiError(400, "invalid_profile", "Le nom est obligatoire.");
    }

    const fullName = body.fullName.trim().replace(/\s+/g, " ");
    const containsControlCharacter = [...fullName]
      .some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
    if (fullName.length < 2 || fullName.length > 80 || containsControlCharacter) {
      throw new ApiError(400, "invalid_profile", "Le nom doit contenir entre 2 et 80 caractères.");
    }

    const dailyQuestions = requiredInteger(body.dailyQuestions, 1, 200, "L’objectif quotidien");
    const weeklyQuestions = requiredInteger(body.weeklyQuestions, 1, 1_000, "L’objectif hebdomadaire");
    if (weeklyQuestions < dailyQuestions) {
      throw new ApiError(400, "invalid_profile", "L’objectif hebdomadaire doit être supérieur à l’objectif quotidien.");
    }

    const targetSpecialtyId = body.targetSpecialtyId === null || body.targetSpecialtyId === ""
      ? null
      : body.targetSpecialtyId;
    if (targetSpecialtyId !== null && (typeof targetSpecialtyId !== "string" || !UUID_PATTERN.test(targetSpecialtyId))) {
      throw new ApiError(400, "invalid_profile", "La spécialité sélectionnée est invalide.");
    }

    if (targetSpecialtyId) {
      const { data: specialty, error } = await admin
        .from("specialties")
        .select("id")
        .eq("id", targetSpecialtyId)
        .maybeSingle();
      if (error) throw error;
      if (!specialty) throw new ApiError(400, "invalid_profile", "La spécialité sélectionnée n’existe pas.");
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (profileError) throw profileError;

    const { error: goalError } = await admin.from("user_learning_goals").upsert({
      user_id: user.id,
      daily_questions: dailyQuestions,
      weekly_questions: weeklyQuestions,
      target_specialty_id: targetSpecialtyId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (goalError) throw goalError;

    // Keep authentication metadata aligned for the few screens that greet the
    // user before loading the public profile row.
    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, full_name: fullName },
    });
    if (authError) throw authError;

    return apiJson({
      ok: true,
      profile: { fullName, dailyQuestions, weeklyQuestions, targetSpecialtyId },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
