import { AdminSectionNav } from "../../../../components/admin/AdminSectionNav";
import { AdminContactMessages } from "../../../../components/admin/AdminContactMessages";
import { getAdminContactMessages } from "../../../../lib/admin/queries";
import { pageTitle } from "@/lib/brand";
import { requireAdminUser } from "../../../../lib/auth/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Messages de contact") };

export default async function AdminContactPage() {
  // La garde précède toute lecture : un compte non-admin n'exécute
  // aucune requête et son payload ne contient aucune donnée d'administration.
  await requireAdminUser("/admin/contact");
  const messages = await getAdminContactMessages();
  return (
    <main className="page-enter mx-auto w-full max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <AdminSectionNav />
      <header>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Support</p>
        <h1 className="m-0 !text-4xl">Messages de contact</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Chaque envoi du formulaire public est enregistré ici, indépendamment du client e-mail de l&apos;expéditeur.</p>
      </header>
      <AdminContactMessages messages={messages} />
    </main>
  );
}
