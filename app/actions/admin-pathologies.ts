"use server";

import { SLUG_PATTERN, UUID_PATTERN } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import type { Difficulty } from "../../types/content";
import { AdminAccessError, assertAdminUser } from "../../lib/auth/admin";
import { createAdminClient } from "../../lib/supabase/server";
import { enforceRateLimit } from "../lib/rate-limit";
import { BRAND_NAME } from "@/lib/brand";

export type AdminPathologyUpdateInput = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  isPublished: boolean;
  content: string;
};

export type CreateAdminPathologyInput = Omit<AdminPathologyUpdateInput, "id"> & {
  specialtyId: string;
  summary: string;
};

export type AdminPathologyActionResult = {
  success: boolean;
  error?: string;
  pathologyId?: string;
  reviewerName?: string;
  reviewedAt?: string;
};


function validatePathologyContent(input: CreateAdminPathologyInput): string | null {
  if (input.title.trim().length < 3 || input.title.length > 200
    || input.slug.length < 3 || input.slug.length > 180 || !SLUG_PATTERN.test(input.slug)
    || !["facile", "moyen", "difficile"].includes(input.difficulty)) {
    return "Titre, slug ou difficulté invalide";
  }
  if (input.summary.trim().length < 10 || input.summary.length > 2_000) {
    return "Le résumé doit contenir entre 10 et 2000 caractères";
  }
  if (input.content.trim().length < 1 || input.content.length > 100_000) {
    return "Le contenu Markdown est vide ou dépasse la taille autorisée";
  }
  return null;
}

export async function createAdminPathology(input: CreateAdminPathologyInput): Promise<AdminPathologyActionResult> {
  const validationError = validatePathologyContent(input);
  if (!UUID_PATTERN.test(input.specialtyId) || validationError) {
    return { success: false, error: validationError ?? "Spécialité invalide" };
  }

  try {
    const user = await assertAdminUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "admin-pathology-create", 60, 3600);
    const { data, error } = await admin.rpc("admin_create_pathology", {
      p_admin_user_id: user.id,
      p_specialty_id: input.specialtyId,
      p_title: input.title,
      p_slug: input.slug,
      p_summary: input.summary,
      p_content: input.content,
      p_difficulty: input.difficulty,
      p_is_published: input.isPublished,
    });
    if (error) throw error;
    if (typeof data !== "string" || !UUID_PATTERN.test(data)) throw new Error("Invalid pathology identifier");
    revalidatePath("/admin/pathologies");
    revalidatePath("/specialties");
    revalidatePath("/dashboard");
    return { success: true, pathologyId: data };
  } catch (error) {
    if (error instanceof AdminAccessError) return { success: false, error: error.message };
    console.error(`${BRAND_NAME} admin pathology creation error`, error);
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return { success: false, error: message.includes("slug") || message.includes("duplicate")
      ? "Ce slug est déjà utilisé par une autre fiche"
      : "Impossible de créer la fiche" };
  }
}

export async function updateAdminPathology(input: AdminPathologyUpdateInput): Promise<AdminPathologyActionResult> {
  if (!UUID_PATTERN.test(input.id)
    || input.title.trim().length < 3 || input.title.length > 200
    || !SLUG_PATTERN.test(input.slug)
    || !["facile", "moyen", "difficile"].includes(input.difficulty)
    || input.content.trim().length < 1 || input.content.length > 100_000) {
    return { success: false, error: "Le titre ou le contenu Markdown est invalide" };
  }

  try {
    const user = await assertAdminUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "admin-pathology-update", 120, 3600);
    const { error } = await admin.rpc("admin_update_pathology", {
      p_admin_user_id: user.id,
      p_pathology_id: input.id,
      p_title: input.title,
      p_content: input.content,
      p_difficulty: input.difficulty,
      p_is_published: input.isPublished,
    });
    if (error) throw error;
    revalidatePath("/admin/pathologies");
    revalidatePath(`/admin/pathologies/${input.id}`);
    revalidatePath(`/pathologies/${input.slug}`);
    revalidatePath("/specialties");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof AdminAccessError) return { success: false, error: error.message };
    console.error(`${BRAND_NAME} admin pathology update error`, error);
    return { success: false, error: "Impossible d’enregistrer la fiche" };
  }
}

export async function reviewAdminPathology(input: { id: string; slug: string }): Promise<AdminPathologyActionResult> {
  if (!UUID_PATTERN.test(input.id) || !SLUG_PATTERN.test(input.slug)) {
    return { success: false, error: "Fiche invalide" };
  }

  try {
    const user = await assertAdminUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "admin-pathology-review", 120, 3600);
    const { data, error } = await admin.rpc("admin_review_pathology", {
      p_admin_user_id: user.id,
      p_pathology_id: input.id,
    });
    if (error) throw error;
    const signature = Array.isArray(data) ? data[0] : data;
    if (!signature?.reviewer_name || !signature?.reviewed_at) throw new Error("Missing review signature");
    revalidatePath("/admin/pathologies");
    revalidatePath(`/admin/pathologies/${input.id}`);
    revalidatePath(`/pathologies/${input.slug}`);
    return {
      success: true,
      reviewerName: signature.reviewer_name,
      reviewedAt: signature.reviewed_at,
    };
  } catch (error) {
    if (error instanceof AdminAccessError) return { success: false, error: error.message };
    console.error(`${BRAND_NAME} admin pathology review error`, error);
    return { success: false, error: "Impossible de signer la révision" };
  }
}
