import type { User } from "@supabase/supabase-js";
import { ONBOARDING_METADATA_KEY } from "@/lib/brand";

export type OnboardingMetadata = {
  university: string | null;
  studyYear: string | null;
  examDate: string | null;
  learningPriority: "fiches" | "qcm" | "cas_cliniques" | "seances" | null;
  prioritySpecialtyIds: string[];
  completedAt: string | null;
  skippedAt: string | null;
};

const EMPTY_ONBOARDING: OnboardingMetadata = {
  university: null,
  studyYear: null,
  examDate: null,
  learningPriority: null,
  prioritySpecialtyIds: [],
  completedAt: null,
  skippedAt: null,
};

export function getOnboardingMetadata(user: Pick<User, "user_metadata">): OnboardingMetadata {
  const raw = user.user_metadata?.[ONBOARDING_METADATA_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return EMPTY_ONBOARDING;
  const value = raw as Record<string, unknown>;
  const learningPriority = ["fiches", "qcm", "cas_cliniques", "seances"].includes(String(value.learningPriority))
    ? value.learningPriority as OnboardingMetadata["learningPriority"]
    : null;
  return {
    university: typeof value.university === "string" ? value.university : null,
    studyYear: typeof value.studyYear === "string" ? value.studyYear : null,
    examDate: typeof value.examDate === "string" ? value.examDate : null,
    learningPriority,
    prioritySpecialtyIds: Array.isArray(value.prioritySpecialtyIds)
      ? value.prioritySpecialtyIds.filter((id): id is string => typeof id === "string")
      : [],
    completedAt: typeof value.completedAt === "string" ? value.completedAt : null,
    skippedAt: typeof value.skippedAt === "string" ? value.skippedAt : null,
  };
}

export function isMissingOnboardingColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42703"
    || error.code === "PGRST204"
    || /column profiles\.(university|study_year|exam_date|learning_priority|priority_specialty_ids|onboarding_)/i.test(error.message ?? "");
}
