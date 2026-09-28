"use server";

import { revalidatePath } from "next/cache";
import { UUID_PATTERN } from "@/lib/validation";
import { AdminAccessError, assertAdminUser } from "../../lib/auth/admin";
import { resolveAdminContactMessage } from "../../lib/admin/queries";
import { BRAND_NAME } from "@/lib/brand";

export async function resolveContactMessage(id: string): Promise<{ success: boolean; error?: string }> {
  if (!UUID_PATTERN.test(id)) return { success: false, error: "Message invalide" };
  try {
    await assertAdminUser();
    await resolveAdminContactMessage(id);
    revalidatePath("/admin/contact");
    return { success: true };
  } catch (error) {
    if (error instanceof AdminAccessError) return { success: false, error: error.message };
    console.error(`${BRAND_NAME} resolve contact message error`, error);
    return { success: false, error: "Impossible de mettre à jour le message" };
  }
}
