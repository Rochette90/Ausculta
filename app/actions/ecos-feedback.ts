"use server";

import { revalidatePath } from "next/cache";
import { UUID_PATTERN } from "@/lib/validation";
import { AdminAccessError, assertAdminUser } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/app/lib/rate-limit";
import { recordAppError } from "@/lib/monitoring/errors";
import { BRAND_NAME } from "@/lib/brand";
import { ECOS_FEEDBACK_CATEGORIES, type EcosFeedbackCategory } from "@/lib/ecos/feedback";

type ActionResult = { success: boolean; error?: string };

export type EcosFeedbackInput = {
  sessionId: string;
  rating: number;
  category: EcosFeedbackCategory;
  comment: string;
};

const CATEGORY_KEYS = new Set<string>(ECOS_FEEDBACK_CATEGORIES.map((item) => item.key));

export async function submitEcosFeedback(input: EcosFeedbackInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifié" };
  const comment = input.comment.trim();
  if (!UUID_PATTERN.test(input.sessionId) || !Number.isInteger(input.rating)
    || input.rating < 1 || input.rating > 5 || !CATEGORY_KEYS.has(input.category) || comment.length > 2000) {
    return { success: false, error: "Avis invalide" };
  }

  try {
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "ecos-feedback", 20, 3600);
    const { error } = await admin.rpc("submit_ecos_feedback", {
      p_user_id: user.id,
      p_session_id: input.sessionId,
      p_rating: input.rating,
      p_category: input.category,
      p_comment: comment,
    });
    if (error) {
      console.error(`${BRAND_NAME} ecos feedback failed`, error.message);
      return { success: false, error: "L’avis n’a pas pu être enregistré." };
    }
    revalidatePath("/admin/stations");
    return { success: true };
  } catch (error) {
    console.error(`${BRAND_NAME} ecos feedback failed`, error instanceof Error ? error.message : error);
    return { success: false, error: "L’avis n’a pas pu être enregistré." };
  }
}

export async function setEcosFeedbackStatus(id: string, status: "open" | "resolved"): Promise<ActionResult> {
  if (!UUID_PATTERN.test(id) || (status !== "open" && status !== "resolved")) return { success: false, error: "Requête invalide" };
  try {
    const user = await assertAdminUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "admin-ecos-feedback", 240, 3600);
    const { error } = await admin.rpc("admin_set_ecos_feedback_status", { p_admin_user_id: user.id, p_id: id, p_status: status });
    if (error) throw error;
    revalidatePath("/admin/stations");
    return { success: true };
  } catch (error) {
    if (error instanceof AdminAccessError) return { success: false, error: error.message };
    console.error(`${BRAND_NAME} ecos feedback status failed`, error instanceof Error ? error.message : error);
    return { success: false, error: "Le statut n’a pas pu être modifié." };
  }
}

/** Erreur attrapée par une page d'erreur côté navigateur. Comptes connectés seulement. */
export async function reportClientError(input: { path: string; message: string; digest?: string }): Promise<void> {
  const user = await getCurrentUser();
  if (!user || typeof input?.message !== "string" || typeof input.path !== "string") return;
  try {
    await enforceRateLimit(createAdminClient(), user.id, "client-error", 20, 3600);
  } catch {
    return;
  }
  await recordAppError({
    source: "client",
    path: input.path,
    message: input.message,
    digest: typeof input.digest === "string" ? input.digest : undefined,
    userId: user.id,
  });
}
