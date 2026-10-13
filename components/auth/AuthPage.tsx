import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/require-user";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { AuthForm } from "./AuthForm";
import { AuthShell } from "./AuthShell";

const CALLBACK_ERRORS: Record<string, string> = {
  callback: "Le lien est invalide ou a expiré. Connectez-vous ou demandez un nouveau lien.",
  recovery: "Le lien de réinitialisation a expiré ou a déjà été utilisé. Demandez-en un nouveau via « Mot de passe oublié ? ».",
};

export async function AuthPage({ mode, searchParams }: { mode: "login" | "signup"; searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const requestedNext = safeRedirectPath(params.next);
  const nextPath = mode === "signup"
    ? `/onboarding?next=${encodeURIComponent(requestedNext)}`
    : requestedNext;
  if (await getCurrentUser()) redirect(nextPath);
  const initialStatus = typeof params.error === "string" ? CALLBACK_ERRORS[params.error] ?? null : null;
  return (
    <AuthShell>
      <AuthForm initialStatus={initialStatus} nextPath={nextPath} switchNextPath={requestedNext} mode={mode} />
    </AuthShell>
  );
}
