import { apiJson, handleApiError, requireAuthenticatedUser } from "../../../lib/api-security";
import { enforceRateLimit } from "../../../lib/rate-limit";
import { getDailyQuiz } from "../../../../lib/quiz/daily";
import { createAdminClient } from "../../../../lib/supabase/server";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    await enforceRateLimit(createAdminClient(), user.id, "daily-quiz-read", 60, 60);
    return apiJson(await getDailyQuiz());
  } catch (error) {
    return handleApiError(error);
  }
}
