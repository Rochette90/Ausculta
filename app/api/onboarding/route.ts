import { zurichDate } from "@/lib/dates";
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
import { getOnboardingMetadata, isMissingOnboardingColumn } from "../../../lib/onboarding/metadata";
import { ONBOARDING_METADATA_KEY } from "@/lib/brand";
import { ONBOARDING_ASKS_SPECIALTIES } from "@/lib/features";

const UNIVERSITIES = new Set(["lausanne", "geneve", "fribourg", "berne", "bale", "zurich", "autre"]);
const STUDY_YEARS = new Set(["b1", "b2", "b3", "m1", "m2", "m3", "autre"]);
const LEARNING_PRIORITIES = new Set(["fiches", "qcm", "cas_cliniques", "seances"]);

function requiredChoice(value: unknown, allowed: Set<string>, label: string) {
  if (typeof value !== "string" || !allowed.has(value)) {
    throw new ApiError(400, "invalid_onboarding", `${label} est invalide.`);
  }
  return value;
}

function optionalExamDate(value: unknown) {
  if (value === null || value === "" || value === undefined) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, "invalid_onboarding", "La date d’examen est invalide.");
  }
  // Dates du calendrier suisse : entre minuit et 2 h, le jour UTC est encore la veille.
  const parsed = new Date(`${value}T12:00:00Z`);
  const today = zurichDate();
  const maximum = `${Number(today.slice(0, 4)) + 10}${today.slice(4)}`;
  const isRealDate = !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  if (!isRealDate || value < today || value > maximum) {
    throw new ApiError(400, "invalid_onboarding", "Choisis une date d’examen à venir.");
  }
  return value;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireAuthenticatedUser();
    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "onboarding-update", 12, 60);
    const body = await readJsonObject(request, 8_192);

    if (body.mode === "skip") {
      const now = new Date().toISOString();
      const { error: profileError } = await admin
        .from("profiles")
        .update({ onboarding_skipped_at: now })
        .eq("id", user.id);
      if (profileError && !isMissingOnboardingColumn(profileError)) throw profileError;
      const current = getOnboardingMetadata(user);
      const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          [ONBOARDING_METADATA_KEY]: { ...current, completedAt: null, skippedAt: now },
        },
      });
      if (authError) throw authError;
      return apiJson({ ok: true, skipped: true });
    }

    if (body.mode !== "complete") {
      throw new ApiError(400, "invalid_onboarding", "Action d’onboarding invalide.");
    }

    const university = requiredChoice(body.university, UNIVERSITIES, "L’université");
    const studyYear = requiredChoice(body.studyYear, STUDY_YEARS, "L’année d’études");
    const learningPriority = requiredChoice(body.learningPriority, LEARNING_PRIORITIES, "La priorité d’apprentissage");
    const examDate = optionalExamDate(body.examDate);
    const specialtyIds = Array.isArray(body.specialtyIds) ? [...new Set(body.specialtyIds)] : [];

    // Les spécialités ne sont exigées que si l'onboarding les demande (lib/features.ts).
    const minimumSpecialties = ONBOARDING_ASKS_SPECIALTIES ? 2 : 0;
    if (specialtyIds.length < minimumSpecialties || specialtyIds.length > 3 || specialtyIds.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))) {
      throw new ApiError(400, "invalid_onboarding", "Choisis deux ou trois spécialités prioritaires.");
    }

    if (specialtyIds.length > 0) {
      const { data: specialties, error: specialtiesError } = await admin
        .from("specialties")
        .select("id")
        .in("id", specialtyIds as string[]);
      if (specialtiesError) throw specialtiesError;
      if ((specialties ?? []).length !== specialtyIds.length) {
        throw new ApiError(400, "invalid_onboarding", "Une spécialité sélectionnée n’existe pas.");
      }
    }

    const now = new Date().toISOString();
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        university,
        study_year: studyYear,
        exam_date: examDate,
        learning_priority: learningPriority,
        priority_specialty_ids: specialtyIds,
        onboarding_completed_at: now,
        onboarding_skipped_at: null,
      })
      .eq("id", user.id);
    if (profileError && !isMissingOnboardingColumn(profileError)) throw profileError;

    const { error: goalError } = await admin.from("user_learning_goals").upsert({
      user_id: user.id,
      target_specialty_id: specialtyIds[0] ?? null,
      updated_at: now,
    }, { onConflict: "user_id" });
    if (goalError) throw goalError;

    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        [ONBOARDING_METADATA_KEY]: {
          university,
          studyYear,
          examDate,
          learningPriority,
          prioritySpecialtyIds: specialtyIds,
          completedAt: now,
          skippedAt: null,
        },
      },
    });
    if (authError) throw authError;

    return apiJson({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
