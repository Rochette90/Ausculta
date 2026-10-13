import { notFound } from "next/navigation";
import { EcosStation, type CompletionResponse } from "@/components/ecos/EcosStation";
import { requireUser } from "@/lib/auth/require-user";
import { getSessionReport } from "@/lib/ecos/history";
import { transcriptionConfig } from "@/lib/ecos/transcription";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Bilan d’une station") };

/** Un bilan enregistré, rouvert tel quel ; « Rejouer » relance la même station. */
export default async function HistoryReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/historique/${encodeURIComponent(id)}`);
  const saved = await getSessionReport(user.id, id);
  if (!saved) notFound();
  return (
    <EcosStation
      station={saved.view}
      serverTranscription={transcriptionConfig() !== null}
      savedReport={{ sessionId: id, mode: saved.mode, report: saved.report as unknown as CompletionResponse }}
    />
  );
}
