import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Liens reçus par e-mail (confirmation d'inscription, réinitialisation, changement
 * d'adresse…). Les gabarits `supabase/templates/*.html` pointent vers
 * `/auth/callback?token_hash=…&type=…` : le jeton est vérifié côté serveur, sans
 * dépendre d'un cookie du navigateur d'origine. Le lien fonctionne donc même ouvert
 * sur un autre appareil (inscription sur le téléphone, lien ouvert sur l'ordinateur).
 */
const EMAIL_LINK_DESTINATIONS: Record<EmailOtpType, string> = {
  signup: "/onboarding",
  invite: "/onboarding",
  email: "/dashboard",
  magiclink: "/dashboard",
  recovery: "/reinitialiser-mot-de-passe",
  email_change: "/profil",
};

export function parseEmailLinkType(value: unknown): EmailOtpType | null {
  return typeof value === "string" && Object.hasOwn(EMAIL_LINK_DESTINATIONS, value) ? (value as EmailOtpType) : null;
}

/** Page où déposer l'étudiant une fois la session ouverte par un lien de ce type. */
export function emailLinkDefaultPath(type: EmailOtpType): string {
  return EMAIL_LINK_DESTINATIONS[type];
}

/** Paramètre `error` de `/login` quand un lien e-mail est invalide ou expiré. */
export function emailLinkErrorCode(type: EmailOtpType): "recovery" | "callback" {
  return type === "recovery" ? "recovery" : "callback";
}
