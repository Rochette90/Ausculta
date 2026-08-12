import { ConnectedExperience } from "../../../components/app/ConnectedExperience";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cas cliniques — MedTrain" };

export default async function CasPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const screen = (await searchParams).mode === "lab" ? "lab" : "stations";
  return <ConnectedExperience returnTo="/cas" screen={screen} />;
}
