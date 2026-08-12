"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "../lib/api-security";
import { enforceRateLimit } from "../lib/rate-limit";
import { createAdminClient, createClient } from "../../lib/supabase/server";

export type MarkPathologyAsReadResult = {
  success: boolean;
  xpEarned: number;
  newTotalXp?: number;
  newLevel?: number;
  newStreak?: number;
  alreadyCompleted?: boolean;
  error?: string;
};

type MarkPathologyRow = {
  awarded_xp: number;
  total_xp: number;
  current_level: number;
  current_streak: number;
  already_completed: boolean;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failure(error: string): MarkPathologyAsReadResult {
  return { success: false, xpEarned: 0, error };
}

export async function markPathologyAsRead(
  pathologyId: string,
): Promise<MarkPathologyAsReadResult> {
  if (!UUID_PATTERN.test(pathologyId)) return failure("Fiche invalide");

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return failure("Non authentifié");

    const admin = createAdminClient();
    await enforceRateLimit(admin, user.id, "pathology-read", 30, 60);
    const { data, error } = await admin.rpc("mark_pathology_as_read", {
      p_user_id: user.id,
      p_pathology_id: pathologyId,
      p_xp_reward: 5,
    });

    if (error) {
      if (error.message.includes("pathology not found")) {
        return failure("Fiche introuvable");
      }
      console.error("MedTrain markPathologyAsRead RPC error", error);
      return failure("Erreur lors de l’enregistrement");
    }

    const row = (Array.isArray(data) ? data[0] : data) as MarkPathologyRow | null;
    if (!row) return failure("Progression indisponible");

    revalidatePath("/dashboard");
    revalidatePath("/specialties");
    revalidatePath("/pathologies/[slug]", "page");
    revalidatePath("/profil");

    return {
      success: true,
      xpEarned: row.awarded_xp,
      newTotalXp: row.total_xp,
      newLevel: row.current_level,
      newStreak: row.current_streak,
      alreadyCompleted: row.already_completed,
    };
  } catch (error) {
    if (error instanceof ApiError) return failure(error.message);
    console.error("MedTrain markPathologyAsRead error", error);
    return failure("Service momentanément indisponible");
  }
}
