import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "./require-user";
import { createClient } from "../supabase/server";

export class AdminAccessError extends Error {}

export const getAdminContext = cache(async (): Promise<{ user: User | null; isAdmin: boolean }> => {
  const user = await getCurrentUser();
  if (!user) return { user: null, isAdmin: false };
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { user, isAdmin: data?.role === "admin" };
});

export async function requireAdminUser(returnTo = "/admin"): Promise<User> {
  const context = await getAdminContext();
  if (!context.user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (!context.isAdmin) redirect("/dashboard");
  return context.user;
}

export async function assertAdminUser(): Promise<User> {
  const context = await getAdminContext();
  if (!context.user) throw new AdminAccessError("Non authentifié");
  if (!context.isAdmin) throw new AdminAccessError("Accès administrateur requis");
  return context.user;
}
