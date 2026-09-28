import "server-only";

import type { Difficulty, PathologyReviewStatus, PathologySectionKey } from "../../types/content";
import { createAdminClient } from "../supabase/server";

export type AdminPathologyListItem = {
  id: string;
  specialtyId: string;
  specialtyName: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  isPublished: boolean;
  reviewStatus: PathologyReviewStatus;
  reviewerName: string | null;
  reviewedAt: string | null;
  version: number;
  updatedAt: string;
};

export type AdminPathologyDetails = AdminPathologyListItem & {
  content: string;
};

export type AdminPathologyReport = {
  id: string;
  pathologyId: string;
  pathologyTitle: string;
  pathologySlug: string;
  reporterName: string;
  reporterEmail: string;
  sectionKey: PathologySectionKey;
  selectedText: string;
  contextBefore: string | null;
  contextAfter: string | null;
  comment: string;
  status: "open" | "reviewing" | "resolved" | "rejected";
  adminNote: string | null;
  createdAt: string;
};

type SpecialtyRow = { id: string; name: string };
type PathologyListRow = { id: string; specialty_id: string; title: string; slug: string; difficulty: Difficulty; is_published: boolean; review_status: PathologyReviewStatus; reviewer_name: string | null; reviewed_at: string | null; version: number; updated_at: string };
type ReportRow = { id: string; user_id: string; pathology_id: string; section_key: PathologySectionKey; selected_text: string; context_before: string | null; context_after: string | null; comment: string; status: AdminPathologyReport["status"]; admin_note: string | null; created_at: string };

export type AdminSpecialtyOption = SpecialtyRow;

export async function getAdminSpecialties(): Promise<AdminSpecialtyOption[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("specialties").select("id, name").order("order_index", { ascending: true }).order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SpecialtyRow[];
}

export async function getAdminPathologies(): Promise<AdminPathologyListItem[]> {
  const admin = createAdminClient();
  const [pathologiesResult, specialtiesResult] = await Promise.all([
    admin.from("pathologies").select("id, specialty_id, title, slug, difficulty, is_published, review_status, reviewer_name, reviewed_at, version, updated_at").order("updated_at", { ascending: false }),
    admin.from("specialties").select("id, name"),
  ]);
  if (pathologiesResult.error) throw pathologiesResult.error;
  if (specialtiesResult.error) throw specialtiesResult.error;
  const specialties = new Map(((specialtiesResult.data ?? []) as SpecialtyRow[]).map((row) => [row.id, row.name]));
  return ((pathologiesResult.data ?? []) as PathologyListRow[]).map((row) => ({
    id: row.id,
    specialtyId: row.specialty_id,
    specialtyName: specialties.get(row.specialty_id) ?? "Médecine",
    title: row.title,
    slug: row.slug,
    difficulty: row.difficulty,
    isPublished: row.is_published,
    reviewStatus: row.review_status,
    reviewerName: row.reviewer_name,
    reviewedAt: row.reviewed_at,
    version: row.version,
    updatedAt: row.updated_at,
  }));
}

export async function getAdminPathology(id: string): Promise<AdminPathologyDetails | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("pathologies").select("id, specialty_id, title, slug, difficulty, is_published, review_status, reviewer_name, reviewed_at, version, updated_at, content").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: specialty } = await admin.from("specialties").select("name").eq("id", data.specialty_id).maybeSingle();
  return {
    id: data.id, specialtyId: data.specialty_id, specialtyName: specialty?.name ?? "Médecine",
    title: data.title, slug: data.slug, difficulty: data.difficulty, isPublished: data.is_published,
    reviewStatus: data.review_status, reviewerName: data.reviewer_name, reviewedAt: data.reviewed_at,
    version: data.version, updatedAt: data.updated_at, content: data.content ?? "",
  } as AdminPathologyDetails;
}

export async function getAdminPathologyReports(): Promise<AdminPathologyReport[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("pathology_reports").select("id, user_id, pathology_id, section_key, selected_text, context_before, context_after, comment, status, admin_note, created_at").order("created_at", { ascending: false });
  if (error) throw error;
  const reports = (data ?? []) as ReportRow[];
  if (reports.length === 0) return [];
  const [pathologiesResult, profilesResult] = await Promise.all([
    admin.from("pathologies").select("id, title, slug").in("id", [...new Set(reports.map((row) => row.pathology_id))]),
    admin.from("profiles").select("id, full_name, email").in("id", [...new Set(reports.map((row) => row.user_id))]),
  ]);
  if (pathologiesResult.error) throw pathologiesResult.error;
  if (profilesResult.error) throw profilesResult.error;
  const pathologies = new Map((pathologiesResult.data ?? []).map((row) => [row.id, row]));
  const profiles = new Map((profilesResult.data ?? []).map((row) => [row.id, row]));
  return reports.map((row) => {
    const pathology = pathologies.get(row.pathology_id);
    const reporter = profiles.get(row.user_id);
    return {
      id: row.id, pathologyId: row.pathology_id, pathologyTitle: pathology?.title ?? "Fiche supprimée",
      pathologySlug: pathology?.slug ?? "", reporterName: reporter?.full_name ?? "Utilisateur",
      reporterEmail: reporter?.email ?? "", sectionKey: row.section_key, selectedText: row.selected_text,
      contextBefore: row.context_before, contextAfter: row.context_after, comment: row.comment,
      status: row.status, adminNote: row.admin_note, createdAt: row.created_at,
    };
  });
}

export type AdminContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
};

type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: AdminContactMessage["status"];
  created_at: string;
};

export async function getAdminContactMessages(): Promise<AdminContactMessage[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contact_messages")
    .select("id, name, email, topic, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as ContactMessageRow[]).map((row) => ({
    id: row.id, name: row.name, email: row.email, topic: row.topic,
    message: row.message, status: row.status, createdAt: row.created_at,
  }));
}

export async function resolveAdminContactMessage(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("contact_messages").update({ status: "resolved" }).eq("id", id);
  if (error) throw error;
}
