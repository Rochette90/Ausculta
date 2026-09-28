import "server-only";

import { randomInt } from "node:crypto";
import { createAdminClient } from "../supabase/server";
import { selectAllPages } from "../supabase/select-all";
import { isMissingQuestionImageColumns } from "./question-images";

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
  imageUrl: string | null;
  imageAlt: string | null;
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
  image_url: string | null;
  image_alt: string | null;
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

const DIFFICULTY_ROTATION: QuestionRow["difficulty"][] = ["facile", "difficile", "moyen"];

function interleavedByDifficulty(questions: QuestionRow[]): QuestionRow[] {
  const groups = DIFFICULTY_ROTATION.map((difficulty) => shuffled(questions.filter((question) => question.difficulty === difficulty)));
  // Une difficulté inattendue ne doit ni disparaître ni bloquer la boucle.
  const others = shuffled(questions.filter((question) => !DIFFICULTY_ROTATION.includes(question.difficulty)));
  const interleaved: QuestionRow[] = [];
  while (groups.some((group) => group.length > 0)) {
    for (const group of groups) {
      const question = group.shift();
      if (question) interleaved.push(question);
    }
  }
  return [...interleaved, ...others];
}

/** Every unmastered question comes first, each block alternating difficulties. */
function balancedByDifficulty(questions: QuestionRow[], masteredIds: Set<string>): QuestionRow[] {
  return [
    ...interleavedByDifficulty(questions.filter((question) => !masteredIds.has(question.id))),
    ...interleavedByDifficulty(questions.filter((question) => masteredIds.has(question.id))),
  ];
}

export async function getSpecialtyQuizCatalog(userId: string): Promise<SpecialtyQuizCatalogItem[]> {
  const admin = createAdminClient();
  const [specialtiesResult, questionsResult, progressResult] = await Promise.all([
    admin
      .from("specialties")
      .select("id, name, slug, description, icon, color")
      .order("order_index", { ascending: true }),
    selectAllPages((from, to) => admin
      .from("questions")
      .select("id, specialty_id")
      .eq("is_published", true)
      .order("id")
      .range(from, to)),
    selectAllPages((from, to) => admin
      .from("user_progress")
      .select("question_id")
      .eq("user_id", userId)
      .eq("is_correct", true)
      .not("question_id", "is", null)
      .order("id")
      .range(from, to)),
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
  const enrichedQuestions = await admin
    .from("questions")
    .select("id, specialty_id, question_text, difficulty, xp_reward, image_url, image_alt")
    .eq("specialty_id", specialty.id)
    .eq("is_published", true);
  let questions: QuestionRow[];
  if (!enrichedQuestions.error) {
    questions = (enrichedQuestions.data ?? []) as QuestionRow[];
  } else if (isMissingQuestionImageColumns(enrichedQuestions.error)) {
    const fallbackQuestions = await admin
      .from("questions")
      .select("id, specialty_id, question_text, difficulty, xp_reward")
      .eq("specialty_id", specialty.id)
      .eq("is_published", true);
    if (fallbackQuestions.error) throw fallbackQuestions.error;
    questions = (fallbackQuestions.data ?? []).map((question) => ({
      ...question,
      image_url: null,
      image_alt: null,
    })) as QuestionRow[];
  } else {
    throw enrichedQuestions.error;
  }
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
  const selectedQuestions = balancedByDifficulty(questions, masteredIds)
    .slice(0, Math.max(1, Math.min(limit, 20)));

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
        imageUrl: question.image_url,
        imageAlt: question.image_alt,
        options: questionOptions.map((option) => ({
          id: option.id,
          text: option.option_text,
          orderIndex: option.order_index,
        })),
      }];
    }),
  };
}
