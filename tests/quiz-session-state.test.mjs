import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("answering a specialty question keeps the active quiz session stable", async () => {
  const [component, action] = await Promise.all([
    readFile(new URL("../components/quiz/SpecialtyQuizSession.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/actions/quiz.ts", import.meta.url), "utf8"),
  ]);

  assert.match(component, /quiz: initialQuiz/);
  assert.match(component, /useState\(\(\) => initialQuiz\)/);
  assert.match(component, /setSelectedId\(null\)[\s\S]*setFeedback\(null\)[\s\S]*setError\(null\)/);
  assert.doesNotMatch(action, /revalidatePath\("\/quiz",\s*"layout"\)/);
});
