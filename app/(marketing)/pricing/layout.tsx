import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FEATURES } from "@/lib/features";

/**
 * Formule payante masquée (lib/features.ts) : tant que tout est gratuit, la
 * page des tarifs n'existe pas. proxy.ts redirige déjà cette adresse ; cette
 * garde tient même si le proxy est contourné.
 */
export default function Layout({ children }: { children: ReactNode }) {
  if (!FEATURES.premium) notFound();
  return children;
}
