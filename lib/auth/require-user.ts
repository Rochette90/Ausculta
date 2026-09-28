import { initialsFrom } from "@/lib/profile/presentation";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "../supabase/server";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    return error ? null : data.user;
  } catch {
    return null;
  }
});

export async function requireUser(returnTo: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

export function userPresentation(user: User) {
  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const identity = fullName ?? user.email?.split("@")[0] ?? "Étudiant";
  const initials = initialsFrom(identity);
  return { firstName: fullName?.split(/\s+/)[0] ?? null, initials };
}
