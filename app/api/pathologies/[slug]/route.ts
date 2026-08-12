import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import pathologyCatalog from "../../../../content/pathologies/index.json";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const publishedSlugs = new Set(
  pathologyCatalog.filter((item) => item.status === "ready").map((item) => item.slug),
);

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!SLUG_PATTERN.test(slug) || !publishedSlugs.has(slug)) {
    return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });
  }
  try {
    const content = await readFile(path.join(process.cwd(), "content", "pathologies", `${slug}.md`), "utf8");
    return new NextResponse(content, {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });
  }
}
