"use client";
import { useEffect, useState } from "react";
import { BRAND_NAME } from "@/lib/brand";

const STORAGE_KEY = `${BRAND_NAME.toLocaleLowerCase("fr")}-jalons-vus`;

type Reached = { id: string; label: string; description: string };

/**
 * Jalons atteints depuis la dernière visite : un bandeau animé, une seule
 * fois par jalon (mémoire locale du navigateur, rien n'est envoyé).
 */
export function MilestoneCelebration({ reached }: { reached: Reached[] }) {
  const [fresh, setFresh] = useState<Reached[]>([]);
  useEffect(() => {
    let seen: string[] = [];
    try { seen = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as string[]; } catch { seen = []; }
    const unseen = reached.filter((item) => !seen.includes(item.id));
    // Marqués « vus » seulement quand le bandeau s'affiche : un effet annulé
    // (double montage en développement) ne doit pas les consommer.
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reached.map((item) => item.id))); } catch { /* navigation privée */ }
      setFresh(unseen.slice(0, 2));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reached]);
  if (!fresh.length) return null;
  return (
    <div className="milestone-celebration" role="status">
      <span className="milestone-burst" aria-hidden="true">✦</span>
      <div>
        <p>{fresh.length > 1 ? "Nouveaux jalons atteints" : "Nouveau jalon atteint"}</p>
        {fresh.map((item) => <strong key={item.id}>{item.label} <small>{item.description}</small></strong>)}
      </div>
      <button type="button" className="text-link" onClick={() => setFresh([])}>Fermer</button>
    </div>
  );
}
