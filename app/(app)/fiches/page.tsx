import { redirect } from "next/navigation";

// L'ancienne bibliothèque legacy est remplacée par le catalogue connecté.
export default function FichesPage() {
  redirect("/specialties");
}
