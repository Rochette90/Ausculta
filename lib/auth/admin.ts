import "server-only";

import type { User } from "@supabase/supabase-js";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "./require-user";
import { adminAccessDenial, isAdminRole, type AdminDenial } from "./admin-access";
import { createClient } from "../supabase/server";

export class AdminAccessError extends Error {
  constructor(
    message: string,
    public readonly status: AdminDenial["status"] = 403,
    public readonly code: AdminDenial["code"] = "admin_access_required",
  ) {
    super(message);
  }
}

/**
 * Le rôle est toujours relu depuis la base pour l'utilisateur de la session
 * courante : aucune valeur envoyée par le client n'entre dans cette décision.
 */
export const getAdminContext = cache(async (): Promise<{ user: User | null; isAdmin: boolean }> => {
  const user = await getCurrentUser();
  if (!user) return { user: null, isAdmin: false };
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { user, isAdmin: isAdminRole(data?.role) };
});

async function resolveDenial() {
  const context = await getAdminContext();
  return {
    context,
    denial: adminAccessDenial({
      userId: context.user?.id ?? null,
      role: context.isAdmin ? "admin" : null,
    }),
  };
}

/**
 * Garde des pages `/admin`. Un visiteur anonyme est renvoyé vers la connexion,
 * un compte authentifié sans le rôle admin reçoit un vrai 403 (`forbidden()`),
 * pas une redirection silencieuse.
 */
export async function requireAdminUser(returnTo = "/admin"): Promise<User> {
  const { context, denial } = await resolveDenial();
  if (denial?.status === 401) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (denial) forbidden();
  return context.user as User;
}

/** Garde des actions serveur et des endpoints d'API `/admin`. */
export async function assertAdminUser(): Promise<User> {
  const { context, denial } = await resolveDenial();
  if (denial) throw new AdminAccessError(denial.message, denial.status, denial.code);
  return context.user as User;
}
