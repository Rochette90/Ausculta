import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Supabase environment variables are required");

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const readJson = async (relativePath) => JSON.parse(await readFile(path.resolve(relativePath), "utf8"));

const { data: specialties, error: specialtiesError } = await supabase.from("specialties").select("id, name");
if (specialtiesError) throw specialtiesError;
const specialtyIds = new Map(specialties.map((item) => [item.name, item.id]));

const pathologyCatalog = await readJson("content/pathologies/index.json");
for (const item of pathologyCatalog) {
  const specialtyId = specialtyIds.get(item.specialty);
  if (!specialtyId) throw new Error(`Unknown specialty: ${item.specialty}`);
  let content = null;
  if (item.status === "ready") {
    try { content = await readFile(path.resolve("content/pathologies", `${item.slug}.md`), "utf8"); } catch { content = null; }
  }
  const { error } = await supabase.from("pathologies").upsert({
    specialty_id: specialtyId,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    content,
    difficulty: "moyen",
    criticality: item.criticality === "urgent" ? "urgent" : "important",
    status: item.status === "ready" ? "published" : "draft",
    is_published: item.status === "ready",
    published_at: item.status === "ready" ? new Date().toISOString() : null,
  }, { onConflict: "slug" });
  if (error) throw error;
}

const questionCatalog = await readJson("content/questions/index.json");
const seededQuestionIds = [];
for (const item of questionCatalog) {
  const { data: question, error } = await supabase.from("questions").upsert({
    slug: item.slug,
    specialty_id: specialtyIds.get(item.specialty),
    prompt: item.question,
    question_text: item.question,
    explanation: item.explanation,
    difficulty: "moyen",
    xp_reward: 10,
    status: "published",
    is_published: true,
  }, { onConflict: "slug" }).select("id").single();
  if (error) throw error;
  seededQuestionIds.push(question.id);
  const { error: deleteError } = await supabase.from("question_options").delete().eq("question_id", question.id);
  if (deleteError) throw deleteError;
  const { error: optionError } = await supabase.from("question_options").insert(item.options.map((label, position) => ({
    question_id: question.id,
    label,
    option_text: label,
    position,
    order_index: position,
    is_correct: position === item.answer,
  })));
  if (optionError) throw optionError;
}

if (seededQuestionIds[0]) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(new Date());
  const { error: dailyQuizError } = await supabase.from("daily_quizzes").upsert({
    question_id: seededQuestionIds[0],
    quiz_date: today,
  }, { onConflict: "quiz_date" });
  if (dailyQuizError) throw dailyQuizError;
}

const caseCatalog = await readJson("content/cases/index.json");
for (const item of caseCatalog) {
  const { error } = await supabase.from("clinical_cases").upsert({
    specialty_id: specialtyIds.get(item.specialty),
    slug: item.slug,
    title: item.title,
    patient: { label: item.patient },
    scenario: { setting: item.setting, duration: item.duration, tags: item.tags, source_file: item.sourceFile },
    evaluation_grid: [],
    difficulty: item.difficulty === "Facile" ? "easy" : item.difficulty === "Difficile" ? "hard" : "medium",
    status: item.interactive ? "published" : "draft",
  }, { onConflict: "slug" });
  if (error) throw error;
}

console.log(JSON.stringify({
  specialties: specialtyIds.size,
  pathologies: pathologyCatalog.length,
  questions: questionCatalog.length,
  dailyQuizzes: seededQuestionIds.length > 0 ? 1 : 0,
  clinicalCases: caseCatalog.length,
}, null, 2));
