import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clinicalQuestionSpecs } from "./quiz-bank-clinical.mjs";
import { BRAND_NAME } from "../lib/brand.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pathologyCatalogPath = path.join(projectRoot, "content/pathologies/index.json");
const questionCatalogPath = path.join(projectRoot, "content/questions/index.json");
const pathologies = JSON.parse(await readFile(pathologyCatalogPath, "utf8"));
const pathologyBySlug = new Map(pathologies.map((pathology) => [pathology.slug, pathology]));

const questions = clinicalQuestionSpecs.map((spec) => {
  const pathology = pathologyBySlug.get(spec.pathologySlug);
  if (!pathology) throw new Error(`Unknown pathology: ${spec.pathologySlug}`);
  if (pathology.specialty !== spec.specialty) {
    throw new Error(`Specialty mismatch for ${spec.slug}: expected ${pathology.specialty}, got ${spec.specialty}`);
  }
  if (spec.options.length !== 4 || new Set(spec.options).size !== 4) {
    throw new Error(`Question ${spec.slug} must have four unique options`);
  }
  if (!Number.isInteger(spec.answer) || spec.answer < 0 || spec.answer >= spec.options.length) {
    throw new Error(`Question ${spec.slug} has an invalid answer index`);
  }
  return {
    slug: spec.slug,
    specialty: spec.specialty,
    pathologySlug: spec.pathologySlug,
    questionType: "single_best_answer",
    reviewStatus: "in_review",
    isPublished: true,
    examDomain: "Bachelor 3–4 · Suisse",
    learningObjective: `Raisonner devant une situation clinique liée à ${pathology.title.toLocaleLowerCase("fr-CH")}.`,
    sourceTitle: `Banque clinique ${BRAND_NAME} — ${pathology.title}`,
    difficulty: spec.difficulty,
    xpReward: spec.difficulty === "difficile" ? 20 : spec.difficulty === "moyen" ? 15 : 10,
    estimatedSeconds: spec.difficulty === "difficile" ? 120 : spec.difficulty === "moyen" ? 75 : 45,
    clinicalVignette: spec.question,
    question: spec.question,
    options: spec.options,
    answer: spec.answer,
    explanation: spec.explanation,
    imageUrl: spec.imageUrl ?? null,
    imageAlt: spec.imageAlt ?? null,
  };
});

if (new Set(questions.map((question) => question.slug)).size !== questions.length) {
  throw new Error("Question slugs must be unique");
}

await writeFile(questionCatalogPath, `${JSON.stringify(questions, null, 2)}\n`, "utf8");

const counts = Object.fromEntries(
  Object.entries(Object.groupBy(questions, (question) => question.specialty))
    .map(([specialty, specialtyQuestions]) => [specialty, {
      total: specialtyQuestions.length,
      facile: specialtyQuestions.filter((question) => question.difficulty === "facile").length,
      moyen: specialtyQuestions.filter((question) => question.difficulty === "moyen").length,
      difficile: specialtyQuestions.filter((question) => question.difficulty === "difficile").length,
    }]),
);
console.log(JSON.stringify({ questions: questions.length, specialties: counts }, null, 2));
