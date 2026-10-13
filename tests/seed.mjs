// Lit le contenu initial (seed) de la migration Théorie et Grilles : depuis l'ADR-013,
// la base est la référence et la migration est la seule copie versionnée du contenu de départ.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TRAINING_MIGRATION = path.join(root, "supabase/migrations/20261012150000_theory_and_grids.sql");

const ROW = /\(\$seed\$([\s\S]*?)\$seed\$, \$seed\$([\s\S]*?)\$seed\$, \$seed\$([\s\S]*?)\$seed\$, \$seed\$([\s\S]*?)\$seed\$(?:::jsonb)?, (\d+), (true|false)\)/g;

export function readSeed(table) {
  const sql = readFileSync(TRAINING_MIGRATION, "utf8");
  const start = sql.indexOf(`insert into public.${table} (slug`, sql.indexOf("-- Contenu initial") + 1);
  const next = sql.indexOf("\ninsert into", start + 1);
  const end = next === -1 ? sql.length : next;
  return [...sql.slice(start, end).matchAll(ROW)].map(([, slug, title, detail, content, position, published]) => ({
    slug, title, detail, content, position: Number(position), isPublished: published === "true",
  }));
}
