"use server";

import { revalidatePath } from "next/cache";
import { AdminAccessError, assertAdminUser } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/app/lib/rate-limit";
import { BRAND_NAME } from "@/lib/brand";
import type { GridContent } from "@/lib/grids/types";
import { emptyGridContent, validateGridContent } from "@/lib/grids/validate";
import { createAdminClient } from "@/lib/supabase/server";
import { SLUG_PATTERN, UUID_PATTERN } from "@/lib/validation";

/**
 * Fiches de théorie et grilles d'entraînement (ADR-013). Sans `id`, l'action
 * crée ; avec, elle met à jour la version attendue, et refuse si un autre
 * enregistrement est passé entre-temps.
 */
export type AdminTrainingResult = { success: boolean; error?: string; id?: string; version?: number };

type Common = { id?: string; version?: number; slug: string; title: string; position: number; isPublished: boolean };
export type AdminTheoryInput = Common & { summary: string; content: string };
export type AdminGridInput = Common & { themes: string; content: GridContent };

const NEW_THEORY_CONTENT = "## En bref\n\nÀ compléter.\n\n## Trame\n\nÀ compléter.\n\n## Pièges\n\nÀ compléter.";

function commonError(input: Common, minTitle: number): string | null {
  if (input.id !== undefined && (!UUID_PATTERN.test(input.id) || !Number.isInteger(input.version))) return "Identifiant invalide";
  if (!SLUG_PATTERN.test(input.slug) || input.slug.length < 2 || input.slug.length > 120) return "Adresse invalide : minuscules, chiffres et tirets";
  if (input.title.trim().length < minTitle || input.title.length > 200) return "Titre trop court ou trop long";
  if (!Number.isInteger(input.position) || input.position < 0 || input.position > 10_000) return "Position invalide";
  return null;
}

function failure(error: unknown, label: string): AdminTrainingResult {
  if (error instanceof AdminAccessError) return { success: false, error: error.message };
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("version conflict")) return { success: false, error: "Un autre enregistrement est passé entre-temps : recharge la page avant de continuer." };
  if (message.includes("duplicate") || message.includes("unique")) return { success: false, error: "Cette adresse est déjà utilisée" };
  console.error(`${BRAND_NAME} admin ${label} error`, error);
  return { success: false, error: "Enregistrement impossible" };
}

export async function saveAdminTheoryFiche(input: AdminTheoryInput): Promise<AdminTrainingResult> {
  const content = input.id ? input.content : NEW_THEORY_CONTENT;
  const invalid = commonError(input, 3)
    ?? (input.summary.trim().length < 10 || input.summary.length > 500 ? "Le résumé doit contenir entre 10 et 500 caractères" : null)
    ?? (!content.trim() || content.length > 100_000 ? "Le contenu Markdown est vide ou trop long" : null);
  if (invalid) return { success: false, error: invalid };

  try {
    const user = await assertAdminUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "admin-training-save", 240, 3600);
    const { data, error } = await admin.rpc("admin_save_theory_fiche", {
      p_admin_user_id: user.id,
      p_id: input.id ?? null,
      p_expected_version: input.version ?? null,
      p_slug: input.slug,
      p_title: input.title,
      p_summary: input.summary,
      p_content: content,
      p_position: input.position,
      p_is_published: input.isPublished,
    });
    if (error) throw error;
    revalidatePath("/admin/theorie");
    revalidatePath("/theorie");
    revalidatePath(`/theorie/${input.slug}`);
    return { success: true, id: String(data), version: (input.version ?? 0) + 1 };
  } catch (error) {
    return failure(error, "theory");
  }
}

export async function saveAdminPracticeGrid(input: AdminGridInput): Promise<AdminTrainingResult> {
  const checked = validateGridContent(input.id ? input.content : emptyGridContent());
  if (!checked.ok) return { success: false, error: checked.errors.slice(0, 3).join(" · ") };
  const invalid = commonError(input, 2) ?? (input.themes.length > 300 ? "Thèmes trop longs" : null);
  if (invalid) return { success: false, error: invalid };

  try {
    const user = await assertAdminUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "admin-training-save", 240, 3600);
    const { data, error } = await admin.rpc("admin_save_practice_grid", {
      p_admin_user_id: user.id,
      p_id: input.id ?? null,
      p_expected_version: input.version ?? null,
      p_slug: input.slug,
      p_title: input.title,
      p_themes: input.themes,
      p_content: checked.content,
      p_position: input.position,
      p_is_published: input.isPublished,
    });
    if (error) throw error;
    revalidatePath("/admin/grilles");
    revalidatePath("/grilles");
    revalidatePath(`/grilles/${input.slug}`);
    revalidatePath("/dashboard");
    return { success: true, id: String(data), version: (input.version ?? 0) + 1 };
  } catch (error) {
    return failure(error, "grid");
  }
}
