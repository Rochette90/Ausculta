export type Difficulty = "facile" | "moyen" | "difficile";
export type UserRole = "student" | "admin";
export type QuestionType = "single_best_answer" | "multiple_choice" | "long_menu";
export type QuestionReviewStatus = "draft" | "in_review" | "approved" | "rejected";
export type PathologyReviewStatus = "needs_review" | "reviewed";
export type QuizMode = "daily" | "specialty" | "difficulty" | "exam" | "errors" | "mixed";
export type QuizSessionStatus = "active" | "completed" | "abandoned" | "expired";
export type PathologySectionKey =
  | "definition"
  | "pathophysiology"
  | "symptoms"
  | "risk_factors"
  | "complementary_exams"
  | "differential_diagnosis"
  | "treatments"
  | "complications"
  | "monitoring";

export type Specialty = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_index: number;
  created_at: string;
};

export type Pathology = {
  id: string;
  specialty_id: string;
  title: string;
  slug: string;
  definition: string | null;
  pathophysiology: string | null;
  symptoms: string | null;
  risk_factors: string | null;
  complementary_exams: string | null;
  differential_diagnosis: string | null;
  treatments: string | null;
  complications: string | null;
  monitoring: string | null;
  difficulty: Difficulty;
  is_published: boolean;
  review_status: PathologyReviewStatus;
  reviewed_by: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  pathology_id: string | null;
  specialty_id: string | null;
  question_text: string;
  explanation: string | null;
  difficulty: Difficulty;
  xp_reward: number;
  is_published: boolean;
  question_type: QuestionType;
  review_status: QuestionReviewStatus;
  clinical_vignette: string | null;
  learning_objective: string | null;
  exam_domain: string | null;
  source_title: string | null;
  source_url: string | null;
  source_year: number | null;
  estimated_seconds: number;
  version: number;
  created_at: string;
};

export type QuestionOption = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
};

export type PublicQuestionOption = Omit<QuestionOption, "is_correct">;

export type UserProgress = {
  id: string;
  user_id: string;
  pathology_id: string | null;
  question_id: string | null;
  is_completed: boolean;
  is_correct: boolean | null;
  xp_earned: number;
  completed_at: string | null;
  created_at: string;
};

export type QuizSession = {
  id: string;
  user_id: string;
  mode: QuizMode;
  specialty_id: string | null;
  difficulty: Difficulty | null;
  status: QuizSessionStatus;
  question_count: number;
  answered_count: number;
  correct_count: number;
  score_percent: number | null;
  time_limit_seconds: number | null;
  started_at: string;
  completed_at: string | null;
};

export type UserQuestionStats = {
  user_id: string;
  question_id: string;
  attempt_count: number;
  correct_count: number;
  incorrect_count: number;
  consecutive_correct: number;
  mastery_score: number;
  needs_review: boolean;
  first_answered_at: string | null;
  last_answered_at: string | null;
  next_review_at: string | null;
};
