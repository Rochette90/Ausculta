import { AuthShell } from "@/components/auth/AuthShell";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/require-user";
import { DEFAULT_AFTER_LOGIN_PATH } from "@/lib/auth/safe-redirect";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Nouveau mot de passe") };

/**
 * Cible du lien de réinitialisation : `/auth/callback` ouvre la session puis
 * redirige ici. Sans session (lien expiré ou déjà utilisé), retour à la
 * connexion avec un message qui pointe vers une nouvelle demande.
 */
export default async function ResetPasswordPage() {
  if (!(await getCurrentUser())) redirect("/login?error=recovery");
  return (
    <AuthShell>
      <NewPasswordForm nextPath={DEFAULT_AFTER_LOGIN_PATH} />
    </AuthShell>
  );
}
