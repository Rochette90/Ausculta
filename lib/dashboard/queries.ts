import { zurichDate } from "@/lib/dates";
import "server-only";

import { cache } from "react";
import { getDailyQuiz, getDailyQuizAttempt, type DailyQuiz } from "../quiz/daily";
import { featuredStudySession } from "../study-sessions/catalog";
import { getStudySessionProgress } from "../study-sessions/progress";
import { createClient } from "../supabase/server";
import { getOnboardingMetadata } from "../onboarding/metadata";
import { BRAND_NAME } from "@/lib/brand";

type SpecialtyRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

type PathologyRow = {
  id: string;
  specialty_id: string;
  title: string;
  slug: string;
  difficulty: "facile" | "moyen" | "difficile";
};

type QuestionRow = { id: string; specialty_id: string | null };

type ProgressRow = {
  pathology_id: string | null;
  question_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  status: "started" | "completed" | "mastered";
  is_completed: boolean;
  is_correct: boolean | null;
  xp_earned: number;
  last_activity_at: string;
};

type ActivityEventRow = { completed_on: string; xp: number };
type XpEventRow = { created_at: string; amount: number };

type ProfileRow = {
  full_name: string | null;
  xp: number;
  level: number;
  streak: number;
  plan: "free" | "pro";
  learning_priority: "fiches" | "qcm" | "cas_cliniques" | "seances" | null;
  priority_specialty_ids: string[];
};

const dashboardProfileColumns =
  "full_name, xp, level, streak, plan";

function getDashboardProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  return supabase
    .from("profiles")
    .select(dashboardProfileColumns)
    .eq("id", userId)
    .single();
}

export type DashboardSpecialty = SpecialtyRow & {
  totalItems: number;
  completedItems: number;
  progressPercentage: number;
  xpEarned: number;
};

export type DashboardActivity = {
  id: string;
  label: string;
  detail: string;
  href: string;
  completedAt: string;
  kind: "pathology" | "question" | "clinical_case";
};

export type DashboardWeekDay = {
  date: string;
  label: string;
  xp: number;
  isToday: boolean;
};

export type DashboardData = {
  profile: ProfileRow;
  dailyQuiz: DailyQuiz | null;
  dailyQuizCompleted: boolean;
  stats: {
    levelProgress: number;
    completedPathologies: number;
    successfulQuestions: number;
    completedClinicalCases: number;
    totalContent: number;
    completedContent: number;
    overallProgress: number;
  };
  specialties: DashboardSpecialty[];
  recommendedPathology: PathologyRow | null;
  recentActivity: DashboardActivity[];
  weeklyActivity: DashboardWeekDay[];
  todayGoal: { earnedXp: number; targetXp: number; percentage: number };
  featuredStudySessionCompletedStepIds: string[];
};


function lastSevenDates() {
  const today = zurichDate(new Date());
  const anchor = new Date(`${today}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchor.getTime() - (6 - index) * 86_400_000);
    return zurichDate(date);
  });
}

export const getDashboardData = cache(async (userId: string): Promise<DashboardData> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const onboarding = user ? getOnboardingMetadata(user) : null;
  const weekDates = lastSevenDates();
  const eventsSince = new Date(Date.now() - 8 * 86_400_000).toISOString();
  const [profileResult, specialtiesResult, pathologiesResult, questionsResult, progressResult, activityResult, ecosXpResult, dailyQuiz, featuredSessionProgress] = await Promise.all([
    getDashboardProfile(supabase, userId),
    supabase
      .from("specialties")
      .select("id, name, slug, icon, color")
      .order("order_index", { ascending: true }),
    supabase
      .from("pathologies")
      .select("id, specialty_id, title, slug, difficulty")
      .eq("is_published", true)
      .order("title", { ascending: true }),
    supabase
      .from("questions")
      .select("id, specialty_id")
      .eq("is_published", true),
    supabase
      .from("user_progress")
      .select("pathology_id, question_id, resource_type, resource_id, status, is_completed, is_correct, xp_earned, last_activity_at")
      .eq("user_id", userId)
      .order("last_activity_at", { ascending: false }),
    supabase
      .from("activity_events")
      .select("completed_on, xp")
      .eq("user_id", userId)
      .gte("completed_on", weekDates[0]),
    supabase
      .from("xp_events")
      .select("created_at, amount")
      .eq("user_id", userId)
      .gte("created_at", eventsSince),
    getDailyQuiz().catch(() => null),
    getStudySessionProgress(userId, featuredStudySession.slug).catch(() => []),
  ]);

  const firstError = [
    profileResult.error,
    specialtiesResult.error,
    pathologiesResult.error,
    questionsResult.error,
    progressResult.error,
    activityResult.error,
    ecosXpResult.error,
  ].find(Boolean);
  if (firstError) {
    console.error(`${BRAND_NAME} dashboard query error`, firstError);
    throw new Error("Le tableau de bord est momentanément indisponible.");
  }

  const profile = {
    ...profileResult.data,
    learning_priority: onboarding?.learningPriority ?? null,
    priority_specialty_ids: onboarding?.prioritySpecialtyIds ?? [],
  } as ProfileRow;
  const specialties = (specialtiesResult.data ?? []) as SpecialtyRow[];
  const pathologies = (pathologiesResult.data ?? []) as PathologyRow[];
  const questions = (questionsResult.data ?? []) as QuestionRow[];
  const progress = (progressResult.data ?? []) as ProgressRow[];
  const activityEvents = (activityResult.data ?? []) as ActivityEventRow[];
  const ecosXpEvents = (ecosXpResult.data ?? []) as XpEventRow[];
  const dailyQuizCompleted = dailyQuiz
    ? Boolean(await getDailyQuizAttempt(userId, dailyQuiz).catch(() => null))
    : false;

  const completedPathologyIds = new Set(
    progress
      .filter((row) => row.pathology_id && row.is_completed)
      .map((row) => row.pathology_id as string),
  );
  const successfulQuestionIds = new Set(
    progress
      .filter((row) => row.question_id && row.is_correct === true)
      .map((row) => row.question_id as string),
  );
  const progressByPathology = new Map(
    progress.filter((row) => row.pathology_id).map((row) => [row.pathology_id as string, row]),
  );
  const progressByQuestion = new Map(
    progress.filter((row) => row.question_id).map((row) => [row.question_id as string, row]),
  );

  const priorityOrder = new Map((profile.priority_specialty_ids ?? []).map((id, index) => [id, index]));
  const specialtyProgress = specialties.map((specialty) => {
    const specialtyPathologies = pathologies.filter((item) => item.specialty_id === specialty.id);
    const specialtyQuestions = questions.filter((item) => item.specialty_id === specialty.id);
    const completedItems = specialtyPathologies.filter((item) => completedPathologyIds.has(item.id)).length
      + specialtyQuestions.filter((item) => successfulQuestionIds.has(item.id)).length;
    const totalItems = specialtyPathologies.length + specialtyQuestions.length;
    const xpEarned = specialtyPathologies.reduce(
      (total, item) => total + (progressByPathology.get(item.id)?.xp_earned ?? 0),
      0,
    ) + specialtyQuestions.reduce(
      (total, item) => total + (progressByQuestion.get(item.id)?.xp_earned ?? 0),
      0,
    );

    return {
      ...specialty,
      totalItems,
      completedItems,
      progressPercentage: totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
      xpEarned,
    } satisfies DashboardSpecialty;
  }).sort((left, right) => {
    const leftPriority = priorityOrder.get(left.id);
    const rightPriority = priorityOrder.get(right.id);
    if (leftPriority === undefined && rightPriority === undefined) return 0;
    if (leftPriority === undefined) return 1;
    if (rightPriority === undefined) return -1;
    return leftPriority - rightPriority;
  });

  const pathologyById = new Map(pathologies.map((pathology) => [pathology.id, pathology]));
  const recentActivity = progress.flatMap((row): DashboardActivity[] => {
    if (row.pathology_id) {
      const pathology = pathologyById.get(row.pathology_id);
      if (!pathology) return [];
      return [{
        id: `pathology-${pathology.id}`,
        label: pathology.title,
        detail: "Fiche terminée",
        href: `/pathologies/${pathology.slug}`,
        completedAt: row.last_activity_at,
        kind: "pathology",
      }];
    }
    if (row.question_id) {
      return [{
        id: `question-${row.question_id}`,
        label: row.is_correct ? "Question réussie" : "Question à revoir",
        detail: row.is_correct ? `+${row.xp_earned} XP` : "Réessayez depuis le quiz",
        href: "/quiz",
        completedAt: row.last_activity_at,
        kind: "question",
      }];
    }
    if (row.resource_type === "clinical_case") {
      return [{
        id: `clinical-case-${row.resource_id ?? row.last_activity_at}`,
        label: "Station clinique terminée",
        detail: row.resource_id ? `Cas ${row.resource_id.replaceAll("-", " ")}` : "Entraînement ECOS",
        href: "/cas",
        completedAt: row.last_activity_at,
        kind: "clinical_case",
      }];
    }
    return [];
  }).slice(0, 4);

  const totalContent = pathologies.length + questions.length;
  const completedContent = completedPathologyIds.size + successfulQuestionIds.size;
  const completedClinicalCases = progress.filter(
    (row) => row.resource_type === "clinical_case" && row.status === "completed",
  ).length;
  const xpByDate = new Map(weekDates.map((date) => [date, 0]));
  activityEvents.forEach((event) => {
    if (xpByDate.has(event.completed_on)) {
      xpByDate.set(event.completed_on, (xpByDate.get(event.completed_on) ?? 0) + event.xp);
    }
  });
  ecosXpEvents.forEach((event) => {
    const date = zurichDate(new Date(event.created_at));
    if (xpByDate.has(date)) xpByDate.set(date, (xpByDate.get(date) ?? 0) + event.amount);
  });
  const today = weekDates.at(-1) ?? zurichDate(new Date());
  const weeklyActivity = weekDates.map((date) => ({
    date,
    label: new Intl.DateTimeFormat("fr-CH", { weekday: "short", timeZone: "Europe/Zurich" })
      .format(new Date(`${date}T12:00:00Z`))
      .replace(".", ""),
    xp: xpByDate.get(date) ?? 0,
    isToday: date === today,
  }));
  const todayXp = xpByDate.get(today) ?? 0;
  const dailyTargetXp = 30;
  const prioritizedPathologies = (profile.priority_specialty_ids ?? [])
    .flatMap((specialtyId) => pathologies.filter((pathology) => pathology.specialty_id === specialtyId));
  const recommendedPathology = [...prioritizedPathologies, ...pathologies]
    .find((pathology, index, candidates) => candidates.findIndex((candidate) => candidate.id === pathology.id) === index
      && !completedPathologyIds.has(pathology.id)) ?? null;

  return {
    profile,
    dailyQuiz,
    dailyQuizCompleted,
    stats: {
      levelProgress: profile.xp % 100,
      completedPathologies: completedPathologyIds.size,
      successfulQuestions: successfulQuestionIds.size,
      completedClinicalCases,
      totalContent,
      completedContent,
      overallProgress: totalContent === 0 ? 0 : Math.round((completedContent / totalContent) * 100),
    },
    specialties: specialtyProgress,
    recommendedPathology,
    recentActivity,
    weeklyActivity,
    todayGoal: {
      earnedXp: todayXp,
      targetXp: dailyTargetXp,
      percentage: Math.min(100, Math.round((todayXp / dailyTargetXp) * 100)),
    },
    featuredStudySessionCompletedStepIds: featuredSessionProgress.map((item) => item.stepId),
  };
});
