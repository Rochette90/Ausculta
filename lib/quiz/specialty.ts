import "server-only";

import { randomInt } from "node:crypto";
import { createAdminClient } from "../supabase/server";

export type SpecialtyQuizCatalogItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  questionCount: number;
  masteredCount: number;
};

export type SpecialtyQuizQuestion = {
  id: string;
  text: string;
  difficulty: "facile" | "moyen" | "difficile";
  xpReward: number;
  options: Array<{ id: string; text: string; orderIndex: number }>;
};

export type SpecialtyQuiz = {
  specialty: Pick<SpecialtyQuizCatalogItem, "id" | "name" | "slug" | "description" | "icon" | "color">;
  questions: SpecialtyQuizQuestion[];
};

type SpecialtyRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
};

type QuestionRow = {
  id: string;
  specialty_id: string;
  question_text: string;
  difficulty: "facile" | "moyen" | "difficile";
  xp_reward: number;
};

type OptionRow = { id: string; question_id: string; option_text: string; order_index: number };

function shuffled<T>(values: T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export async function getSpecialtyQuizCatalog(userId: string): Promise<SpecialtyQuizCatalogItem[]> {
  const admin = createAdminClient();
  const [specialtiesResult, questionsResult, progressResult] = await Promise.all([
    admin
      .from("specialties")
      .select("id, name, slug, description, icon, color")
      .order("order_index", { ascending: true }),
    admin.from("questions").select("id, specialty_id").eq("is_published", true),
    admin
      .from("user_progress")
      .select("question_id")
      .eq("user_id", userId)
      .eq("is_correct", true)
      .not("question_id", "is", null),
  ]);
  if (specialtiesResult.error) throw specialtiesResult.error;
  if (questionsResult.error) throw questionsResult.error;
  if (progressResult.error) throw progressResult.error;

  const questions = (questionsResult.data ?? []) as Array<{ id: string; specialty_id: string | null }>;
  const masteredIds = new Set(
    (progressResult.data ?? []).flatMap((row) => row.question_id ? [row.question_id] : []),
  );

  return ((specialtiesResult.data ?? []) as SpecialtyRow[]).map((specialty) => {
    const specialtyQuestions = questions.filter((question) => question.specialty_id === specialty.id);
    return {
      ...specialty,
      questionCount: specialtyQuestions.length,
      masteredCount: specialtyQuestions.filter((question) => masteredIds.has(question.id)).length,
    };
  });
}

export async function getSpecialtyQuiz(userId: string, specialtySlug: string, limit = 10): Promise<SpecialtyQuiz | null> {
  const admin = createAdminClient();
  const specialtyResult = await admin
    .from("specialties")
    .select("id, name, slug, description, icon, color")
    .eq("slug", specialtySlug)
    .maybeSingle();
  if (specialtyResult.error) throw specialtyResult.error;
  if (!specialtyResult.data) return null;

  const specialty = specialtyResult.data as SpecialtyRow;
  const questionsResult = await admin
    .from("questions")
    .select("id, specialty_id, question_text, difficulty, xp_reward")
    .eq("specialty_id", specialty.id)
    .eq("is_published", true);
  if (questionsResult.error) throw questionsResult.error;

  const questions = (questionsResult.data ?? []) as QuestionRow[];
  if (questions.length === 0) return { specialty, questions: [] };

  const progressResult = await admin
    .from("user_progress")
    .select("question_id, is_correct")
    .eq("user_id", userId)
    .in("question_id", questions.map((question) => question.id));
  if (progressResult.error) throw progressResult.error;

  const masteredIds = new Set(
    (progressResult.data ?? []).flatMap((row) => row.is_correct && row.question_id ? [row.question_id] : []),
  );
  const selectedQuestions = [
    ...shuffled(questions.filter((question) => !masteredIds.has(question.id))),
    ...shuffled(questions.filter((question) => masteredIds.has(question.id))),
  ].slice(0, Math.max(1, Math.min(limit, 20)));

  const optionsResult = await admin
    .from("question_options")
    .select("id, question_id, option_text, order_index")
    .in("question_id", selectedQuestions.map((question) => question.id))
    .order("order_index", { ascending: true });
  if (optionsResult.error) throw optionsResult.error;
  const options = (optionsResult.data ?? []) as OptionRow[];

  return {
    specialty,
    questions: selectedQuestions.flatMap((question): SpecialtyQuizQuestion[] => {
      const questionOptions = options.filter((option) => option.question_id === question.id);
      if (questionOptions.length < 2) return [];
      return [{
        id: question.id,
        text: question.question_text,
        difficulty: question.difficulty,
        xpReward: question.xp_reward,
        options: questionOptions.map((option) => ({
          id: option.id,
          text: option.option_text,
          orderIndex: option.order_index,
        })),
      }];
    }),
  };
}
