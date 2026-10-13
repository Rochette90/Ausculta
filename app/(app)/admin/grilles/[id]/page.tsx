import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminSectionNav } from "@/components/admin/AdminSectionNav";
import { GridEditor } from "@/components/admin/GridEditor";
import { getAdminPracticeGrid } from "@/lib/admin/training-content";
import { requireAdminUser } from "@/lib/auth/admin";
import { pageTitle } from "@/lib/brand";
import { UUID_PATTERN } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Modifier · Grilles") };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminUser(`/admin/grilles/${id}`);
  if (!UUID_PATTERN.test(id)) notFound();
  const entry = await getAdminPracticeGrid(id);
  if (!entry) notFound();
  return (
    <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <AdminSectionNav />
      <Link className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600" href="/admin/grilles"><ArrowLeft size={16} /> Grilles ECOS</Link>
      <header className="mb-5">
        <h1 className="m-0 !text-3xl">{entry.title}</h1>
        <p className="m-0 mt-1 text-sm text-slate-500"><code>/grilles/{entry.slug}</code> · version {entry.version}</p>
      </header>
      <GridEditor grid={entry} />
    </main>
  );
}
