import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth/require-user";
import { safeRedirectPath } from "../../lib/auth/safe-redirect";
import { AuthForm } from "./AuthForm";

export async function AuthPage({ mode, searchParams }: { mode: "login" | "signup"; searchParams: Promise<{ next?: string }> }) {
  const requestedNext = safeRedirectPath((await searchParams).next);
  const nextPath = mode === "signup"
    ? `/onboarding?next=${encodeURIComponent(requestedNext)}`
    : requestedNext;
  if (await getCurrentUser()) redirect(nextPath);
  return <main className="auth-page"><AuthForm nextPath={nextPath} switchNextPath={requestedNext} mode={mode} /></main>;
}
