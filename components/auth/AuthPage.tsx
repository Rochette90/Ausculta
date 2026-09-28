import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth/require-user";
import { AuthForm } from "./AuthForm";

const safeNext = (value?: string) =>
  value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/dashboard";

export async function AuthPage({ mode, searchParams }: { mode: "login" | "signup"; searchParams: Promise<{ next?: string }> }) {
  const requestedNext = safeNext((await searchParams).next);
  const nextPath = mode === "signup"
    ? `/onboarding?next=${encodeURIComponent(requestedNext)}`
    : requestedNext;
  if (await getCurrentUser()) redirect(nextPath);
  return <main className="auth-page"><AuthForm nextPath={nextPath} switchNextPath={requestedNext} mode={mode} /></main>;
}
