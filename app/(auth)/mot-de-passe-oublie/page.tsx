import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getCurrentUser } from "@/lib/auth/require-user";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Mot de passe oublié") };

export default async function ForgotPasswordPage() {
  // Un compte connecté change son mot de passe depuis le profil.
  if (await getCurrentUser()) redirect("/profil");
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
