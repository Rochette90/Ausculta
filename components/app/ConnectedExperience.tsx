import { MedTrainApp, type Screen } from "../../app/MedTrainApp";
import { requireUser, userPresentation } from "../../lib/auth/require-user";

export async function ConnectedExperience({ returnTo, screen }: { returnTo: string; screen: Screen }) {
  const user = await requireUser(returnTo);
  return <MedTrainApp firstName={userPresentation(user).firstName} initialScreen={screen} />;
}
