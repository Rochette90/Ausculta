"use server";

import { UUID_PATTERN } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import type { Difficulty, QuestionReviewStatus, QuestionType } from "@/types/content";
import { AdminAccessError, assertAdminUser } from "@/lib/auth/admin";
import { csvRecords } from "@/lib/admin/question-csv";
import { createAdminClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/app/lib/rate-limit";
import { BRAND_NAME } from "@/lib/brand";

const difficulties: Difficulty[] = ["facile", "moyen", "difficile"];
const reviewStatuses: QuestionReviewStatus[] = ["draft", "in_review", "approved", "rejected"];
const questionTypes: QuestionType[] = ["single_best_answer", "multiple_choice", "long_menu"];

export type AdminQuestionInput = {
  id?: string | null; specialtyId: string; pathologyId?: string | null; text: string;
  clinicalVignette: string; learningObjective: string; explanation: string;
  difficulty: Difficulty; xpReward: number; questionType: QuestionType;
  reviewStatus: QuestionReviewStatus; isPublished: boolean; examDomain: string;
  sourceTitle: string; sourceUrl: string; sourceYear?: number | null;
  estimatedSeconds: number; topicIds: string[]; imageUrl: string; imageAlt: string;
  options: Array<{ text: string; isCorrect: boolean; orderIndex: number; explanation: string }>;
};

export type AdminQuestionActionResult = { success: boolean; questionId?: string; error?: string };

function validate(input: AdminQuestionInput): string | null {
  if ((input.id && !UUID_PATTERN.test(input.id)) || !UUID_PATTERN.test(input.specialtyId)
    || (input.pathologyId && !UUID_PATTERN.test(input.pathologyId))
    || input.topicIds.some((id) => !UUID_PATTERN.test(id))
    || input.text.trim().length < 10 || input.text.length > 5000
    || input.explanation.length > 10000 || !difficulties.includes(input.difficulty)
    || !questionTypes.includes(input.questionType) || !reviewStatuses.includes(input.reviewStatus)
    || !Number.isInteger(input.xpReward) || input.xpReward < 0 || input.xpReward > 100
    || !Number.isInteger(input.estimatedSeconds) || input.estimatedSeconds < 15 || input.estimatedSeconds > 900
    || (input.sourceYear != null && (!Number.isInteger(input.sourceYear) || input.sourceYear < 1900 || input.sourceYear > 2100))
    || (input.imageUrl.trim().length > 0 && (input.imageUrl.length > 2048 || !/^https?:\/\//.test(input.imageUrl)))
    || input.imageAlt.length > 500
    || input.options.length < 2 || input.options.length > 12
    || input.options.some((option) => !option.text.trim() || option.text.length > 2000)
    || input.options.filter((option) => option.isCorrect).length !== 1) return "Contenu de question invalide";
  if (input.isPublished && (input.reviewStatus !== "approved" || input.explanation.trim().length < 20 || input.sourceTitle.trim().length < 3)) {
    return "Une question publiée doit être approuvée, expliquée et sourcée";
  }
  return null;
}

async function upsertWithAdmin(admin: ReturnType<typeof createAdminClient>, userId: string, input: AdminQuestionInput) {
  return admin.rpc("admin_upsert_question", {
    p_admin_user_id: userId, p_question_id: input.id ?? null, p_specialty_id: input.specialtyId,
    p_pathology_id: input.pathologyId ?? null, p_question_text: input.text,
    p_clinical_vignette: input.clinicalVignette, p_learning_objective: input.learningObjective,
    p_explanation: input.explanation, p_difficulty: input.difficulty, p_xp_reward: input.xpReward,
    p_question_type: input.questionType, p_review_status: input.reviewStatus,
    p_is_published: input.isPublished, p_exam_domain: input.examDomain,
    p_source_title: input.sourceTitle, p_source_url: input.sourceUrl,
    p_source_year: input.sourceYear ?? null, p_estimated_seconds: input.estimatedSeconds,
    p_topic_ids: input.topicIds, p_options: input.options,
    p_image_url: input.imageUrl || null, p_image_alt: input.imageAlt || null,
  });
}

export async function saveAdminQuestion(input: AdminQuestionInput): Promise<AdminQuestionActionResult> {
  const validationError = validate(input);
  if (validationError) return { success: false, error: validationError };
  try {
    const user = await assertAdminUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "admin-question-write", 120, 3600);
    const { data, error } = await upsertWithAdmin(admin, user.id, input);
    if (error) throw error;
    if (typeof data !== "string" || !UUID_PATTERN.test(data)) throw new Error("Invalid question id");
    revalidatePath("/admin/questions");
    revalidatePath("/quiz", "layout");
    return { success: true, questionId: data };
  } catch (error) {
    if (error instanceof AdminAccessError) return { success: false, error: error.message };
    console.error(`${BRAND_NAME} admin question save error`, error);
    return { success: false, error: "Impossible d’enregistrer la question" };
  }
}

export type QuestionImportResult = { success: boolean; batchId?: string; imported: number; failed: number; error?: string };

export async function importAdminQuestionsCsv(csv: string, filename?: string): Promise<QuestionImportResult> {
  if (new TextEncoder().encode(csv).byteLength > 1_000_000) return { success: false, imported: 0, failed: 0, error: "Fichier limité à 1 Mo" };
  try {
    const user = await assertAdminUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "admin-question-import", 5, 3600);
    const records = csvRecords(csv);
    if (records.length < 1 || records.length > 250) return { success: false, imported: 0, failed: 0, error: "Le fichier doit contenir entre 1 et 250 questions" };
    const [specialtiesResult, pathologiesResult] = await Promise.all([
      admin.from("specialties").select("id, slug"), admin.from("pathologies").select("id, slug, specialty_id"),
    ]);
    if (specialtiesResult.error) throw specialtiesResult.error;
    if (pathologiesResult.error) throw pathologiesResult.error;
    const specialties = new Map((specialtiesResult.data ?? []).map((row) => [row.slug, row.id]));
    const pathologies = new Map((pathologiesResult.data ?? []).map((row) => [row.slug, row]));
    const { data: batch, error: batchError } = await admin.from("question_import_batches").insert({
      created_by: user.id, filename: filename?.slice(0, 255) || null, total_rows: records.length,
    }).select("id").single();
    if (batchError) throw batchError;
    let imported = 0;
    const errors: Array<{ batch_id: string; row_number: number; message: string; payload: Record<string, string> }> = [];
    for (const [index, record] of records.entries()) {
      try {
        const specialtyId = specialties.get(record.specialty_slug ?? "");
        if (!specialtyId) throw new Error("Spécialité inconnue");
        const pathology = record.pathology_slug ? pathologies.get(record.pathology_slug) : null;
        if (pathology && pathology.specialty_id !== specialtyId) throw new Error("Fiche et spécialité incompatibles");
        const correct = (record.correct_option ?? "").toUpperCase();
        const optionKeys = ["option_a", "option_b", "option_c", "option_d", "option_e", "option_f"];
        const options = optionKeys.flatMap((key, optionIndex) => record[key] ? [{
          text: record[key], isCorrect: correct === String.fromCharCode(65 + optionIndex), orderIndex: optionIndex, explanation: "",
        }] : []);
        const input: AdminQuestionInput = {
          specialtyId, pathologyId: pathology?.id ?? null, text: record.question_text ?? "",
          clinicalVignette: record.clinical_vignette ?? "", learningObjective: record.learning_objective ?? "",
          explanation: record.explanation ?? "", difficulty: (record.difficulty || "moyen") as Difficulty,
          xpReward: Number(record.xp_reward || 10), questionType: "single_best_answer",
          reviewStatus: (record.review_status || "draft") as QuestionReviewStatus,
          isPublished: record.is_published?.toLowerCase() === "true", examDomain: record.exam_domain ?? "",
          sourceTitle: record.source_title ?? "", sourceUrl: record.source_url ?? "",
          sourceYear: record.source_year ? Number(record.source_year) : null,
          estimatedSeconds: Number(record.estimated_seconds || 90), topicIds: [], options,
          imageUrl: record.image_url ?? "", imageAlt: record.image_alt ?? "",
        };
        const validationError = validate(input);
        if (validationError) throw new Error(validationError);
        const { error } = await upsertWithAdmin(admin, user.id, input);
        if (error) throw error;
        imported += 1;
      } catch (error) {
        errors.push({ batch_id: batch.id, row_number: index + 2, message: error instanceof Error ? error.message.slice(0, 500) : "Erreur inconnue", payload: record });
      }
    }
    if (errors.length) {
      const { error } = await admin.from("question_import_errors").insert(errors);
      if (error) throw error;
    }
    const failed = errors.length;
    await admin.from("question_import_batches").update({
      status: failed === 0 ? "completed" : imported === 0 ? "failed" : "partial",
      imported_rows: imported, failed_rows: failed, completed_at: new Date().toISOString(),
    }).eq("id", batch.id);
    revalidatePath("/admin/questions");
    revalidatePath("/quiz", "layout");
    return { success: true, batchId: batch.id, imported, failed };
  } catch (error) {
    if (error instanceof AdminAccessError) return { success: false, imported: 0, failed: 0, error: error.message };
    console.error(`${BRAND_NAME} question CSV import error`, error);
    return { success: false, imported: 0, failed: 0, error: "Import impossible" };
  }
}
