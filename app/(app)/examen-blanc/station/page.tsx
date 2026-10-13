import { notFound } from "next/navigation";
import { EcosStation } from "@/components/ecos/EcosStation";
import { requireUser } from "@/lib/auth/require-user";
import { parseMockPlan, parseMockSessions } from "@/lib/ecos/mock-exam";
import { ecosDoorNote, ecosStationView, resolveMockStation } from "@/lib/ecos/stations";
import { transcriptionConfig } from "@/lib/ecos/transcription";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Examen blanc") };

type PageProps = { searchParams: Promise<{ plan?: string; step?: string; sessions?: string }> };

/** Une station du circuit, en mode examen imposé ; le plan et l'étape sont revérifiés. */
export default async function MockExamStationPage({ searchParams }: PageProps) {
  await requireUser("/examen-blanc");
  const query = await searchParams;
  const plan = parseMockPlan(query.plan);
  const step = Number(query.step);
  if (!plan || !Number.isInteger(step) || step < 0 || step >= plan.length) notFound();
  // Stations réservées à l'examen blanc, jamais celles de l'entraînement.
  const scenario = resolveMockStation(plan[step]);
  if (!scenario) notFound();
  const view = ecosStationView(scenario, { candidateTitle: ecosDoorNote(scenario), specialty: null });
  return (
    <EcosStation
      key={`${plan[step]}-${step}`}
      station={view}
      serverTranscription={transcriptionConfig() !== null}
      circuit={{ plan, step, sessions: parseMockSessions(query.sessions).slice(0, step) }}
    />
  );
}
