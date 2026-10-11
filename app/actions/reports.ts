"use server";

import { UUID_PATTERN } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import type { PathologySectionKey } from "../../types/content";
import { AdminAccessError, assertAdminUser } from "../../lib/auth/admin";
import { getCurrentUser } from "../../lib/auth/require-user";
import { createAdminClient } from "../../lib/supabase/server";
import { enforceRateLimit } from "../lib/rate-limit";
import { BRAND_NAME } from "@/lib/brand";
import { ficheIsAccessible } from "@/lib/content/fiche-access";

type ActionResult = { success: boolean; error?: string; reportId?: string };

export type CreatePathologyReportInput = {
  pathologyId: string;
  sectionKey: PathologySectionKey;
  selectedText: string;
  contextBefore: string;
  contextAfter: string;
  comment: string;
};

export type ReviewPathologyReportInput = {
  reportId: string;
  status: "reviewing" | "resolved" | "rejected";
  adminNote: string;
};

const SECTION_KEYS = new Set<PathologySectionKey>([
  "definition", "pathophysiology", "symptoms", "risk_factors",
  "complementary_exams", "differential_diagnosis", "treatments",
  "complications", "monitoring",
]);

export async function createPathologyReport(input: CreatePathologyReportInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifié" };
  const selectedText = input.selectedText.trim();
  const comment = input.comment.trim();
  if (!UUID_PATTERN.test(input.pathologyId) || !SECTION_KEYS.has(input.sectionKey)
    || selectedText.length < 1 || selectedText.length > 2000
    || comment.length < 5 || comment.length > 2000) {
    return { success: false, error: "Signalement invalide" };
  }

  try {
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "pathology-report", 10, 3600);
    if (!(await ficheIsAccessible(admin, input.pathologyId))) return { success: false, error: "Signalement invalide" };
    const { data, error } = await admin.rpc("create_pathology_report", {
      p_user_id: user.id,
      p_pathology_id: input.pathologyId,
      p_section_key: input.sectionKey,
      p_selected_text: selectedText,
      p_context_before: input.contextBefore.slice(-500),
      p_context_after: input.contextAfter.slice(0, 500),
      p_comment: comment,
    });
    if (error) {
      console.error(`${BRAND_NAME} create pathology report error`, error);
      return { success: false, error: /selected text (?:mismatch|not found)|report section not found/.test(error.message) ? "Le passage sélectionné n’est plus à jour" : "Impossible d’envoyer le signalement" };
    }
    return { success: true, reportId: typeof data === "string" ? data : undefined };
  } catch (error) {
    console.error(`${BRAND_NAME} pathology report action error`, error);
    return { success: false, error: "Service momentanément indisponible" };
  }
}

export async function reviewPathologyReport(input: ReviewPathologyReportInput): Promise<ActionResult> {
  if (!UUID_PATTERN.test(input.reportId) || !["reviewing", "resolved", "rejected"].includes(input.status)
    || input.adminNote.length > 2000) {
    return { success: false, error: "Mise à jour invalide" };
  }
  try {
    const user = await assertAdminUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "admin-report-review", 120, 3600);
    const { error } = await admin.rpc("admin_review_pathology_report", {
      p_admin_user_id: user.id,
      p_report_id: input.reportId,
      p_status: input.status,
      p_admin_note: input.adminNote.trim() || null,
    });
    if (error) throw error;
    revalidatePath("/admin/reports");
    return { success: true };
  } catch (error) {
    if (error instanceof AdminAccessError) return { success: false, error: error.message };
    console.error(`${BRAND_NAME} review pathology report error`, error);
    return { success: false, error: "Impossible de mettre à jour le signalement" };
  }
}
