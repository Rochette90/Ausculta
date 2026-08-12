import { AuthPage } from "../../../components/auth/AuthPage";

export const dynamic = "force-dynamic";
export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthPage mode="login" searchParams={searchParams} />;
}
