import { requireAdminUser } from "../../../lib/auth/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser("/admin");
  return children;
}
