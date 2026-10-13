/**
 * Décision d'accès administrateur, isolée de Supabase et de Next pour être
 * testable et partagée par toutes les surfaces `/admin` (pages, actions
 * serveur, endpoints d'API).
 *
 * Le rôle vient toujours de la session lue côté serveur — jamais d'un champ
 * envoyé par le client.
 */
export type AdminContext = {
  userId: string | null;
  role: string | null;
};

export type AdminDenial = {
  status: 401 | 403;
  code: "authentication_required" | "admin_access_required";
  message: string;
};

const ADMIN_ROLE = "admin";

/** Renvoie le refus à appliquer, ou `null` si l'accès est autorisé. */
export function adminAccessDenial(context: AdminContext): AdminDenial | null {
  if (!context.userId) {
    return {
      status: 401,
      code: "authentication_required",
      message: "Connexion requise",
    };
  }
  if (context.role !== ADMIN_ROLE) {
    return {
      status: 403,
      code: "admin_access_required",
      message: "Accès administrateur requis",
    };
  }
  return null;
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === ADMIN_ROLE;
}
