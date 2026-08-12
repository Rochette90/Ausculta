import { ConnectedExperience } from "../../../components/app/ConnectedExperience";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fiches pathologies — MedTrain" };

export default function FichesPage() {
  return <ConnectedExperience returnTo="/fiches" screen="fiches" />;
}
