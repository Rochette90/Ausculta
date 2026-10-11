import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FEATURES } from "@/lib/features";

/**
 * Module masqué (lib/features.ts) : ses pages n'existent pas. proxy.ts redirige
 * déjà ces adresses ; cette garde tient même si le proxy est contourné.
 */
export default function Layout({ children }: { children: ReactNode }) {
  if (!FEATURES.sessions) notFound();
  return children;
}
