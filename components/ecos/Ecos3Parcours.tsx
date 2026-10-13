"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import type { Ecos3Type } from "@/lib/ecos/curriculum";

/**
 * Parcours ECOS de 3ᵉ année : un type de station, un patient tiré au sort
 * (de préférence pas encore rencontré), comme le jour de l'examen.
 */
/** Patient tiré au sort pour un type, de préférence pas encore rencontré. */
function drawStation(codes: readonly string[], done: ReadonlySet<string>): string | undefined {
  const fresh = codes.filter((code) => !done.has(code));
  const pool = fresh.length ? fresh : codes;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function Ecos3Parcours({ types, completed, grids }: { types: Ecos3Type[]; completed: string[]; grids: boolean }) {
  const router = useRouter();
  const done = new Set(completed);
  function draw(codes: string[]) {
    const code = drawStation(codes, done);
    if (code) router.push(`/cas/${code}`);
  }
  return (
    <section className="learning-section ecos3" aria-labelledby="ecos3-title">
      <div className="learning-section-head">
        <h2 id="ecos3-title">Parcours ECOS de 3ᵉ année</h2>
        <Link className="button primary small" href="/examen-blanc">Lancer un examen blanc</Link>
      </div>
      <p className="learning-note">Les 8 stations de l’examen. Choisis un type : le patient est tiré au sort, comme le jour J.</p>
      <ul className="ecos3-grid">
        {types.map((type) => {
          const met = type.codes.filter((code) => done.has(code)).length;
          return (
            <li key={type.id}>
              <h3>{type.label}</h3>
              <p>{type.codes.length ? `${type.codes.length} patient${type.codes.length > 1 ? "s" : ""} simulé${type.codes.length > 1 ? "s" : ""} · ${met} rencontré${met > 1 ? "s" : ""}` : "Station pratique : en binôme avec la grille"}</p>
              <div className="ecos3-actions">
                {type.codes.length > 0 && <button className="button secondary small" type="button" onClick={() => draw(type.codes)}><Shuffle aria-hidden="true" size={15} /> Tirer un patient</button>}
                {grids && <Link className="text-link" href={`/grilles/${type.grid}`}>Grille en binôme</Link>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
