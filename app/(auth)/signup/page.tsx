import { AuthPage } from "../../../components/auth/AuthPage";

export const dynamic = "force-dynamic";
export default function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthPage mode="signup" searchParams={searchParams} />;
}
