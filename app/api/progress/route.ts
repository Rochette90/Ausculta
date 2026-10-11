import {
  ApiError,
  apiJson,
  assertSameOrigin,
  handleApiError,
  readJsonObject,
  requireAuthenticatedUser,
} from "../../lib/api-security";
import { gradeTutorial } from "@/lib/tutorials/questions";
import { calculateActivityReward } from "../../lib/ecos";
import { enforceRateLimit } from "../../lib/rate-limit";
import { createAdminClient } from "../../../lib/supabase/server";

type Progress = {
  totalXp: number;
  level: number;
  levelXp: number;
  nextLevelXp: number;
  streak: number;
  completedActivities: number;
  averageScore: number;
};

const EMPTY_PROGRESS: Progress = {
  totalXp: 0,
  level: 1,
  levelXp: 0,
  nextLevelXp: 100,
  streak: 0,
  completedActivities: 0,
  averageScore: 0,
};

async function getProgress(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data, error } = await admin.rpc("get_user_progress", { p_user_id: userId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return EMPTY_PROGRESS;
  const value = row as Record<string, unknown>;
  const totalXp = Number(value.total_xp ?? 0);
  return {
    totalXp,
    level: Math.floor(totalXp / 100) + 1,
    levelXp: totalXp % 100,
    nextLevelXp: 100,
    streak: Number(value.streak ?? 0),
    completedActivities: Number(value.completed_activities ?? 0),
    averageScore: Math.round(Number(value.average_score ?? 0)),
  } satisfies Progress;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    assertSameOrigin(request);
    const body = await readJsonObject(request, 4_096);
    const activityType = typeof body.activityType === "string"
      ? body.activityType.trim().slice(0, 40)
      : "";
    const activityId = typeof body.activityId === "string"
      ? body.activityId.trim().slice(0, 100)
      : "";
    if (!activityType || !/^[a-z0-9][a-z0-9-]{0,39}$/i.test(activityType)) {
      throw new ApiError(400, "invalid_activity", "Activité invalide");
    }
    if (!activityId || !/^[a-z0-9à-ÿ][a-z0-9à-ÿ-]{0,99}$/i.test(activityId)) {
      throw new ApiError(400, "invalid_activity", "Activité invalide");
    }

    // Other product activities have their own server-validated actions.
    const verifiedScore = activityType === "tutorial" ? gradeTutorial(activityId, body.answers) : null;
    if (verifiedScore === null) throw new ApiError(400, "unsupported_activity", "Activité ou réponses invalides");
    const reward = calculateActivityReward("tutorial", verifiedScore)!;

    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "progress-write", 60, 60);
    const { error } = await admin.rpc("record_activity", {
      p_user_id: user.id,
      p_activity_type: activityType,
      p_activity_id: activityId,
      p_score: reward.score,
      p_xp: reward.xp,
    });
    if (error) throw error;
    return apiJson(await getProgress(admin, user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
