import { notFound } from "next/navigation";
import { EcosStation } from "@/components/ecos/EcosStation";
import { requireUser } from "@/lib/auth/require-user";
import { getPublishedClinicalCase } from "@/lib/ecos/cases";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function CasStationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireUser(`/cas/${encodeURIComponent(slug)}`);
  const clinicalCase = await getPublishedClinicalCase(slug);
  if (!clinicalCase) notFound();
  return <EcosStation clinicalCase={clinicalCase} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clinicalCase = await getPublishedClinicalCase(slug);
  return { title: pageTitle(clinicalCase?.candidateTitle ?? "Cas clinique") };
}
