import { notFound, redirect } from "next/navigation";
import { EcosStation } from "@/components/ecos/EcosStation";
import { requireUser } from "@/lib/auth/require-user";
import { getPublishedClinicalCase } from "@/lib/ecos/cases";
import { ecosStationView, resolveEcosStation } from "@/lib/ecos/stations";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";

// The URL segment is a neutral public code (`/cas/station-04`). Old links that
// still use the internal slug are redirected so the address never names the
// diagnosis.
export default async function CasStationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: identifier } = await params;
  const station = resolveEcosStation(identifier);
  await requireUser(`/cas/${encodeURIComponent(station?.code ?? identifier)}`);
  if (!station) notFound();
  if (station.legacy) redirect(`/cas/${station.code}`);
  const clinicalCase = await getPublishedClinicalCase(station.scenario.slug);
  if (!clinicalCase) notFound();
  // Only the public part of the station reaches the browser: no patient facts,
  // no results, no diagnosis before the server has graded the transcript.
  const view = ecosStationView(station.scenario, { candidateTitle: clinicalCase.candidateTitle, specialty: clinicalCase.specialty });
  return <EcosStation station={view} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: identifier } = await params;
  const station = resolveEcosStation(identifier);
  const clinicalCase = station ? await getPublishedClinicalCase(station.scenario.slug).catch(() => null) : null;
  return { title: pageTitle(clinicalCase?.candidateTitle ?? "Cas clinique") };
}
