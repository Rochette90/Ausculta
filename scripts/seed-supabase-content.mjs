import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Supabase environment variables are required");

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const readJson = async (relativePath) => JSON.parse(await readFile(path.resolve(relativePath), "utf8"));
const questionsOnly = process.argv.includes("--questions-only");

const { data: specialties, error: specialtiesError } = await supabase.from("specialties").select("id, name");
if (specialtiesError) throw specialtiesError;
const specialtyIds = new Map(specialties.map((item) => [item.name, item.id]));
const { data: existingPathologies, error: existingPathologiesError } = await supabase
  .from("pathologies")
  .select("id, slug, content, difficulty");
if (existingPathologiesError) throw existingPathologiesError;
const existingContentBySlug = new Map(existingPathologies.map((item) => [item.slug, item.content]));
const existingDifficultyBySlug = new Map(existingPathologies.map((item) => [item.slug, item.difficulty]));
const pathologyIds = new Map(existingPathologies.map((item) => [item.slug, item.id]));

const pathologyCatalog = await readJson("content/pathologies/index.json");
for (const item of questionsOnly ? [] : pathologyCatalog) {
  const specialtyId = specialtyIds.get(item.specialty);
  if (!specialtyId) throw new Error(`Unknown specialty: ${item.specialty}`);
  let editorialContent = null;
  if (item.status === "ready") {
    try { editorialContent = await readFile(path.resolve("content/pathologies", `${item.slug}.md`), "utf8"); } catch { editorialContent = null; }
  }
  // Une réinitialisation du catalogue ne doit jamais écraser une correction
  // réalisée ensuite par un administrateur dans l'éditeur en production.
  const content = existingContentBySlug.get(item.slug) ?? editorialContent;
  const { data: pathology, error } = await supabase.from("pathologies").upsert({
    specialty_id: specialtyId,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    content,
    difficulty: existingDifficultyBySlug.get(item.slug) ?? "moyen",
    criticality: item.criticality,
    is_published: item.status === "ready",
  }, { onConflict: "slug" }).select("id, slug").single();
  if (error) throw error;
  pathologyIds.set(pathology.slug, pathology.id);
}

const questionCatalog = await readJson("content/questions/index.json");
const currentQuestionSlugs = new Set(questionCatalog.map((item) => item.slug));
const legacySeededQuestionSlugs = [
  "cardio-ecg-douleur-thoracique", "cardio-ic-gauche", "pneumo-ep-haut-risque",
  "pneumo-asthme-traitement", "infectio-purpura-priorite", "infectio-sepsis-prelevement",
  "neuro-deficit-imagerie", "neuro-syndrome-meninge", "gastro-angiocholite",
  "gastro-pancreatite-lipase", "endocrino-acidocetose-potassium", "endocrino-hyperthyroidie-bilan",
];
const [generatedQuestionsResult, legacyQuestionsResult] = await Promise.all([
  supabase.from("questions").select("id, slug").like("slug", "quiz-%"),
  supabase.from("questions").select("id, slug").in("slug", legacySeededQuestionSlugs),
]);
if (generatedQuestionsResult.error) throw generatedQuestionsResult.error;
if (legacyQuestionsResult.error) throw legacyQuestionsResult.error;
const obsoleteQuestionIds = [...(generatedQuestionsResult.data ?? []), ...(legacyQuestionsResult.data ?? [])]
  .filter((question) => !currentQuestionSlugs.has(question.slug))
  .map((question) => question.id);
for (let index = 0; index < obsoleteQuestionIds.length; index += 100) {
  const { error } = await supabase.from("questions").update({
    is_published: false,
    review_status: "rejected",
  }).in("id", obsoleteQuestionIds.slice(index, index + 100));
  if (error) throw error;
}

const seededQuestionIds = [];
for (const item of questionCatalog) {
  const specialtyId = specialtyIds.get(item.specialty);
  const pathologyId = pathologyIds.get(item.pathologySlug);
  if (!specialtyId) throw new Error(`Unknown specialty: ${item.specialty}`);
  if (!pathologyId) throw new Error(`Unknown pathology: ${item.pathologySlug}`);
  const { data: question, error } = await supabase.from("questions").upsert({
    slug: item.slug,
    specialty_id: specialtyId,
    pathology_id: pathologyId,
    question_text: item.question,
    clinical_vignette: item.clinicalVignette,
    learning_objective: item.learningObjective,
    explanation: item.explanation,
    difficulty: item.difficulty,
    xp_reward: item.xpReward,
    question_type: item.questionType,
    review_status: item.reviewStatus,
    exam_domain: item.examDomain,
    source_title: item.sourceTitle,
    estimated_seconds: item.estimatedSeconds,
    is_published: item.isPublished,
    image_url: item.imageUrl ?? null,
    image_alt: item.imageAlt ?? null,
  }, { onConflict: "slug" }).select("id").single();
  if (error) throw error;
  seededQuestionIds.push(question.id);
  const { error: deleteError } = await supabase.from("question_options").delete().eq("question_id", question.id);
  if (deleteError) throw deleteError;
  const { error: optionError } = await supabase.from("question_options").insert(item.options.map((optionText, orderIndex) => ({
    question_id: question.id,
    option_text: optionText,
    order_index: orderIndex,
    is_correct: orderIndex === item.answer,
    explanation: orderIndex === item.answer ? item.explanation : null,
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
for (const item of questionsOnly ? [] : caseCatalog) {
  const { error } = await supabase.from("clinical_cases").upsert({
    specialty_id: specialtyIds.get(item.specialty),
    slug: item.slug,
    title: item.title,
    patient: { label: item.patient },
    scenario: {
      setting: item.setting,
      duration: item.duration,
      tags: item.tags,
      candidate_title: item.candidateTitle,
      // Le diagnostic reste dans le dépôt (content/cases) et n'est jamais
      // stocké dans une colonne lisible par les comptes connectés.
    },
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
  archivedQuestions: obsoleteQuestionIds.length,
  dailyQuizzes: seededQuestionIds.length > 0 ? 1 : 0,
  clinicalCases: questionsOnly ? 0 : caseCatalog.length,
  mode: questionsOnly ? "questions-only" : "full",
}, null, 2));
