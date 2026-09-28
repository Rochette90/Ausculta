import "server-only";

import type { Difficulty, QuestionReviewStatus, QuestionType } from "../../types/content";
import { createAdminClient } from "../supabase/server";
import { selectAllPages } from "../supabase/select-all";

export type AdminQuestionListItem = {
  id: string; text: string; specialtyName: string; pathologyTitle: string | null;
  difficulty: Difficulty; reviewStatus: QuestionReviewStatus; isPublished: boolean;
  version: number; updatedAt: string;
};

export type AdminQuestionDetails = {
  id: string; specialtyId: string; pathologyId: string | null; text: string;
  clinicalVignette: string | null; learningObjective: string | null; explanation: string | null;
  difficulty: Difficulty; xpReward: number; questionType: QuestionType;
  reviewStatus: QuestionReviewStatus; isPublished: boolean; examDomain: string | null;
  sourceTitle: string | null; sourceUrl: string | null; sourceYear: number | null;
  imageUrl: string | null; imageAlt: string | null;
  estimatedSeconds: number; topicIds: string[]; version: number; updatedAt: string;
  options: Array<{ id: string; text: string; isCorrect: boolean; orderIndex: number; explanation: string | null }>;
};

export type AdminQuestionFormOptions = {
  specialties: Array<{ id: string; name: string }>;
  pathologies: Array<{ id: string; specialtyId: string; title: string }>;
  topics: Array<{ id: string; specialtyId: string | null; name: string }>;
};

type QuestionRow = {
  id: string; specialty_id: string | null; pathology_id: string | null; question_text: string;
  difficulty: Difficulty; review_status: QuestionReviewStatus; is_published: boolean; version: number; updated_at: string;
};

export async function getAdminQuestions(): Promise<AdminQuestionListItem[]> {
  const admin = createAdminClient();
  const [questionsResult, specialtiesResult, pathologiesResult] = await Promise.all([
    selectAllPages((from, to) => admin.from("questions").select("id, specialty_id, pathology_id, question_text, difficulty, review_status, is_published, version, updated_at").order("updated_at", { ascending: false }).order("id").range(from, to)),
    admin.from("specialties").select("id, name"),
    admin.from("pathologies").select("id, title"),
  ]);
  if (questionsResult.error) throw questionsResult.error;
  if (specialtiesResult.error) throw specialtiesResult.error;
  if (pathologiesResult.error) throw pathologiesResult.error;
  const specialties = new Map((specialtiesResult.data ?? []).map((row) => [row.id, row.name]));
  const pathologies = new Map((pathologiesResult.data ?? []).map((row) => [row.id, row.title]));
  return ((questionsResult.data ?? []) as QuestionRow[]).map((row) => ({
    id: row.id, text: row.question_text, specialtyName: specialties.get(row.specialty_id ?? "") ?? "Sans spécialité",
    pathologyTitle: row.pathology_id ? pathologies.get(row.pathology_id) ?? null : null,
    difficulty: row.difficulty, reviewStatus: row.review_status, isPublished: row.is_published,
    version: row.version, updatedAt: row.updated_at,
  }));
}

export async function getAdminQuestion(id: string): Promise<AdminQuestionDetails | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("questions").select("id, specialty_id, pathology_id, question_text, clinical_vignette, learning_objective, explanation, difficulty, xp_reward, question_type, review_status, is_published, exam_domain, source_title, source_url, source_year, estimated_seconds, image_url, image_alt, version, updated_at").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [optionsResult, topicsResult] = await Promise.all([
    admin.from("question_options").select("id, option_text, is_correct, order_index, explanation").eq("question_id", id).order("order_index"),
    admin.from("question_topic_links").select("topic_id").eq("question_id", id),
  ]);
  if (optionsResult.error) throw optionsResult.error;
  if (topicsResult.error) throw topicsResult.error;
  return {
    id: data.id, specialtyId: data.specialty_id, pathologyId: data.pathology_id,
    text: data.question_text, clinicalVignette: data.clinical_vignette,
    learningObjective: data.learning_objective, explanation: data.explanation,
    difficulty: data.difficulty, xpReward: data.xp_reward, questionType: data.question_type,
    reviewStatus: data.review_status, isPublished: data.is_published, examDomain: data.exam_domain,
    sourceTitle: data.source_title, sourceUrl: data.source_url, sourceYear: data.source_year,
    imageUrl: data.image_url, imageAlt: data.image_alt,
    estimatedSeconds: data.estimated_seconds, version: data.version, updatedAt: data.updated_at,
    topicIds: (topicsResult.data ?? []).map((row) => row.topic_id),
    options: (optionsResult.data ?? []).map((option) => ({
      id: option.id, text: option.option_text, isCorrect: option.is_correct,
      orderIndex: option.order_index, explanation: option.explanation,
    })),
  } as AdminQuestionDetails;
}

export async function getAdminQuestionFormOptions(): Promise<AdminQuestionFormOptions> {
  const admin = createAdminClient();
  const [specialtiesResult, pathologiesResult, topicsResult] = await Promise.all([
    admin.from("specialties").select("id, name").order("order_index").order("name"),
    admin.from("pathologies").select("id, specialty_id, title").order("title"),
    admin.from("question_topics").select("id, specialty_id, name").order("order_index").order("name"),
  ]);
  if (specialtiesResult.error) throw specialtiesResult.error;
  if (pathologiesResult.error) throw pathologiesResult.error;
  if (topicsResult.error) throw topicsResult.error;
  return {
    specialties: specialtiesResult.data ?? [],
    pathologies: (pathologiesResult.data ?? []).map((row) => ({ id: row.id, specialtyId: row.specialty_id, title: row.title })),
    topics: (topicsResult.data ?? []).map((row) => ({ id: row.id, specialtyId: row.specialty_id, name: row.name })),
  };
}
