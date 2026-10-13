import "server-only";

import type { GridContent } from "../grids/types";
import { createAdminClient } from "../supabase/server";

/** Théorie et grilles côté administration : brouillons compris, lus avec service_role. */
export type AdminTrainingListItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  position: number;
  isPublished: boolean;
  version: number;
  updatedAt: string;
};

export type AdminTheoryFiche = Omit<AdminTrainingListItem, "subtitle"> & { summary: string; content: string };
export type AdminPracticeGrid = Omit<AdminTrainingListItem, "subtitle"> & { themes: string; content: GridContent };

type Row = { id: string; slug: string; title: string; position: number; is_published: boolean; version: number; updated_at: string };
const base = (row: Row) => ({ id: row.id, slug: row.slug, title: row.title, position: row.position, isPublished: row.is_published, version: row.version, updatedAt: row.updated_at });
const COLUMNS = "id, slug, title, position, is_published, version, updated_at";

export async function getAdminTheoryFiches(): Promise<AdminTrainingListItem[]> {
  const { data, error } = await createAdminClient().from("theory_fiches").select(`${COLUMNS}, summary`).order("position").order("title");
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...base(row), subtitle: row.summary }));
}

export async function getAdminTheoryFiche(id: string): Promise<AdminTheoryFiche | null> {
  const { data, error } = await createAdminClient().from("theory_fiches").select(`${COLUMNS}, summary, content`).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? { ...base(data), summary: data.summary, content: data.content } : null;
}

export async function getAdminPracticeGrids(): Promise<AdminTrainingListItem[]> {
  const { data, error } = await createAdminClient().from("practice_grids").select(`${COLUMNS}, themes`).order("position").order("title");
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...base(row), subtitle: row.themes }));
}

/** Le JSON est rendu tel quel à l'éditeur : c'est lui qui le revalide avant d'enregistrer. */
export async function getAdminPracticeGrid(id: string): Promise<AdminPracticeGrid | null> {
  const { data, error } = await createAdminClient().from("practice_grids").select(`${COLUMNS}, themes, content`).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? { ...base(data), themes: data.themes, content: data.content as GridContent } : null;
}
