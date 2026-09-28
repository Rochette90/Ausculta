import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FicheCatalog } from "@/components/content/FicheCatalog";
import { getSpecialtyCatalog } from "@/lib/content/queries";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Bibliothèque médicale") };
export default async function SpecialtiesPage() {
  const user = await requireUser("/specialties");
  const supabase = await createClient();
  const [specialties, { data, error }] = await Promise.all([getSpecialtyCatalog(), supabase.from("user_progress").select("pathology_id").eq("user_id", user.id).eq("is_completed", true)]);
  const published = new Set(specialties.flatMap((s) => s.pathologies.map((p) => p.id)));
  const completedIds = (data ?? []).map((row) => row.pathology_id as string).filter((id) => published.has(id));
  return <main className="learning-page page-enter"><header className="learning-page-head"><p className="learning-eyebrow">BIBLIOTHÈQUE MÉDICALE</p><h1>Trouver. Comprendre.<br /><em>Retenir l’essentiel.</em></h1><p>{published.size} fiches dans {specialties.length} spécialités. Recherche un sujet et reprends là où tu en es.</p><Link className="learning-inline-link" href="/anatomie">Revoir les bases anatomiques <ArrowUpRight size={16} /></Link></header>{error && <p className="learning-notice">L’état de lecture est indisponible pour le moment.</p>}<FicheCatalog specialties={specialties} completedIds={completedIds} /></main>;
}
