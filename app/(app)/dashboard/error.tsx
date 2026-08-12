"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../../../components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("MedTrain dashboard rendering error", error);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[65vh] w-full max-w-3xl place-items-center px-4 pb-28 pt-10 text-center">
      <div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-sm sm:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-700"><AlertTriangle size={25} /></span>
        <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-[0.16em] text-rose-700">Connexion momentanément interrompue</p>
        <h1 className="m-0 !text-3xl">Impossible de charger votre progression</h1>
        <p className="mx-auto mt-4 max-w-lg text-slate-600">Vos données sont conservées. Relancez simplement le chargement du tableau de bord.</p>
        <Button className="mt-6" onClick={reset}><RotateCcw size={17} /> Réessayer</Button>
      </div>
    </main>
  );
}
