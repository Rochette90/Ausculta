export type AnatomyStructure = { id: string; name: string; location: string; function: string; landmark: string; clinical: string };
export type AnatomyQuestion = { id: string; prompt: string; options: { id: string; text: string }[]; correctId: string; explanation: string };
export type PublicQuestion = Omit<AnatomyQuestion, "correctId" | "explanation">;
export type AnatomyModule = {
  slug: string; title: string; region: string; subtitle: string; minutes: number;
  objectives: string[]; structures: AnatomyStructure[]; questions: AnatomyQuestion[];
  case: { title: string; vignette: string; questions: AnatomyQuestion[] };
  pathologySlugs: string[]; sources: { title: string; url: string }[];
};
export type PublicAnatomyModule = Omit<AnatomyModule, "questions" | "case"> & { questions: PublicQuestion[]; case: Omit<AnatomyModule["case"], "questions"> & { questions: PublicQuestion[] } };
export type AnatomyFeedback = { score: number; total: number; percent: number; corrections: { id: string; correctId: string; explanation: string; correct: boolean }[] };
export type AnatomyProgress = { module_slug: string; mode: "recall" | "clinical"; score: number; total: number; created_at: string };
