import { Header } from "@/components/ui/header-2";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getCurrentUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]" id="top">
      <Header signedIn={Boolean(user)} />
      {children}
      <MarketingFooter />
    </div>
  );
}
