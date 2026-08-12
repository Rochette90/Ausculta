import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateEcosCriteria, scoreEcosTranscript } from "../app/lib/ecos.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the production stack is Next, Supabase and Stripe", async () => {
  const pkg = JSON.parse(await read("../package.json"));
  assert.match(pkg.scripts.build, /^next build(?: --webpack)?$/);
  assert.ok(pkg.dependencies.next);
  assert.ok(pkg.dependencies["@supabase/ssr"]);
  assert.ok(pkg.dependencies["@supabase/supabase-js"]);
  assert.ok(pkg.dependencies.stripe);
  assert.equal(pkg.dependencies.vinext, undefined);
  assert.equal(pkg.dependencies["drizzle-orm"], undefined);
});

test("sensitive tables have RLS and backend-only mutation functions", async () => {
  const sql = `${await read("../supabase/migrations/20260810150000_medtrain_backend.sql")}\n${await read("../supabase/migrations/20260810170000_learning_catalog.sql")}\n${await read("../supabase/migrations/20260810190000_phase2_content.sql")}\n${await read("../supabase/migrations/20260810210000_secure_quiz_answers.sql")}\n${await read("../supabase/migrations/20260810220000_backend_foundations.sql")}\n${await read("../supabase/migrations/20260810230000_admin_content_workflow.sql")}\n${await read("../supabase/migrations/20260811010000_admin_create_pathology.sql")}\n${await read("../supabase/migrations/20260811020000_learning_platform_infrastructure.sql")}`;
  for (const table of ["profiles", "subscriptions", "ecos_sessions", "ecos_messages", "xp_events", "activity_events", "rate_limit_buckets", "stripe_webhook_events"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  for (const table of ["specialties", "pathologies", "questions", "question_options", "clinical_cases", "user_progress", "quiz_attempts", "badges", "user_badges"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /revoke all on function public\.check_rate_limit[\s\S]+from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.check_rate_limit[\s\S]+to service_role/i);
  assert.match(sql, /storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/i);
  assert.match(sql, /alter table public\.daily_quizzes enable row level security/i);
  assert.match(sql, /grant select on public\.daily_quizzes to anon, authenticated/i);
  assert.match(sql, /revoke all on function public\.answer_question[\s\S]+from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.answer_question[\s\S]+to service_role/i);
  assert.match(sql, /alter table public\.pathology_reports enable row level security/i);
  assert.match(sql, /grant select on public\.pathology_reports to authenticated/i);
  assert.match(sql, /revoke all on function public\.admin_update_pathology[\s\S]+from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.admin_update_pathology[\s\S]+to service_role/i);
  assert.match(sql, /revoke all on function public\.admin_create_pathology[\s\S]+from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.admin_create_pathology[\s\S]+to service_role/i);
});

test("the learning platform supports editorial workflows, durable quiz sessions and error review", async () => {
  const [sql, sessionActions, sessionQueries, questionActions, questionQueries, questionForm, csv] = await Promise.all([
    read("../supabase/migrations/20260811020000_learning_platform_infrastructure.sql"),
    read("../app/actions/quiz-sessions.ts"),
    read("../lib/quiz/sessions.ts"),
    read("../app/actions/admin-questions.ts"),
    read("../lib/admin/questions.ts"),
    read("../components/admin/AdminQuestionForm.tsx"),
    read("../lib/admin/question-csv.ts"),
  ]);
  for (const table of ["question_topics", "question_revisions", "user_question_stats", "quiz_sessions", "quiz_session_questions", "quiz_session_answers", "question_import_batches", "clinical_case_attempts", "user_learning_goals"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, "i"));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /create trigger quiz_attempts_sync_user_question_stats/i);
  assert.match(sql, /needs_review = case[\s\S]+consecutive_correct \+ 1 >= 2 then false/i);
  assert.match(sql, /create or replace function public\.start_quiz_session/i);
  assert.match(sql, /p_mode = 'errors'[\s\S]+uqs\.needs_review/i);
  assert.match(sql, /v_mode = 'exam' then null else v_answer\.answer_explanation/i);
  assert.match(sql, /revoke all on function public\.answer_quiz_session_question[\s\S]+from public, anon, authenticated/i);
  assert.match(sessionActions, /enforceRateLimit\(admin, user\.id, "quiz-session-answer"/);
  assert.match(sessionActions, /row\.reveal_feedback \? row\.answer_is_correct : undefined/);
  assert.match(sessionQueries, /answeredQuestionIds/);
  assert.match(questionActions, /admin\.rpc\("admin_upsert_question"/);
  assert.match(questionActions, /admin-question-import/);
  assert.match(questionQueries, /getAdminQuestionFormOptions/);
  assert.match(questionForm, /Explication pédagogique/);
  assert.match(csv, /export function parseCsv/);
});

test("admins can create a categorized pathology through a role-gated RPC", async () => {
  const [sql, action, page, form, queries] = await Promise.all([
    read("../supabase/migrations/20260811010000_admin_create_pathology.sql"),
    read("../app/actions/admin-pathologies.ts"),
    read("../app/(app)/admin/pathologies/new/page.tsx"),
    read("../components/admin/NewPathologyForm.tsx"),
    read("../lib/admin/queries.ts"),
  ]);
  assert.match(sql, /where id = p_admin_user_id and role = 'admin'/i);
  assert.match(sql, /insert into public\.pathologies/i);
  assert.match(sql, /p_specialty_id/i);
  assert.match(action, /assertAdminUser\(\)/);
  assert.match(action, /admin\.rpc\("admin_create_pathology"/);
  assert.match(action, /admin-pathology-create/);
  assert.match(page, /NewPathologyForm/);
  assert.match(form, /Spécialité/);
  assert.match(form, /Publier immédiatement/);
  assert.match(queries, /getAdminSpecialties/);
});

test("pathology reviews are explicit, invalidated by edits and signed by the reviewer", async () => {
  const [sql, action, editor, list, page] = await Promise.all([
    read("../supabase/migrations/20260812170000_pathology_review_workflow.sql"),
    read("../app/actions/admin-pathologies.ts"),
    read("../components/admin/PathologyEditor.tsx"),
    read("../components/admin/AdminPathologyList.tsx"),
    read("../app/(app)/pathologies/[slug]/page.tsx"),
  ]);
  assert.match(sql, /review_status text not null default 'needs_review'/i);
  assert.match(sql, /update public\.pathologies set[\s\S]+review_status = 'needs_review'/i);
  assert.match(sql, /admin_update_pathology[\s\S]+reviewer_name = null[\s\S]+reviewed_at = null/i);
  assert.match(sql, /create or replace function public\.admin_review_pathology/i);
  assert.match(sql, /where id = p_admin_user_id and role = 'admin'/i);
  assert.match(sql, /reviewed_by = p_admin_user_id[\s\S]+reviewer_name = v_reviewer_name/i);
  assert.match(sql, /revoke all on function public\.admin_review_pathology[\s\S]+from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.admin_review_pathology[\s\S]+to service_role/i);
  assert.match(action, /admin\.rpc\("admin_review_pathology"/);
  assert.match(editor, /Valider et signer/);
  assert.match(editor, /Modifications non enregistrées/);
  assert.match(list, /À réviser/);
  assert.match(page, /Validée et signée par/);
  assert.doesNotMatch(page, /<Sparkles[^>]*\/> Révisée/);
});

test("the connected app exposes a persistent accessible dark theme", async () => {
  const [layout, navigation, toggle, styles] = await Promise.all([
    read("../app/layout.tsx"),
    read("../components/navigation/ConnectedNavigation.tsx"),
    read("../components/theme/ThemeToggle.tsx"),
    read("../app/globals.css"),
  ]);
  assert.match(layout, /medtrain-theme/);
  assert.match(layout, /prefers-color-scheme: dark/);
  assert.match(navigation, /ThemeToggle/);
  assert.match(toggle, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(toggle, /Basculer entre le mode clair et le mode nuit/);
  assert.match(styles, /html\[data-theme="dark"\]/);
  assert.match(styles, /\.bg-slate-950 :is\(h1, h2, h3, h4\)/);
});

test("the marketing homepage reflects live product data and the current product pillars", async () => {
  const [page, landing, wrapper, stats] = await Promise.all([
    read("../app/(marketing)/page.tsx"),
    read("../app/MedTrainApp.tsx"),
    read("../components/marketing/MarketingLanding.tsx"),
    read("../lib/marketing/stats.ts"),
  ]);
  assert.match(page, /getMarketingStats\(\)/);
  assert.match(wrapper, /stats=\{stats\}/);
  assert.match(stats, /\.eq\("is_published", true\)/);
  assert.match(landing, /Pathologies claires et structurées/);
  assert.match(landing, /Questions avec correction détaillée/);
  assert.match(landing, /Cas cliniques/);
  assert.match(landing, /XP, niveaux, série quotidienne/);
  assert.match(landing, /Pensé pour le cursus suisse/);
  assert.match(landing, /stats\.questionCount/);
  assert.doesNotMatch(landing, /Six spécialités/);
});

test("admin content workflow is role-gated and reports verify the selected source text", async () => {
  const [sql, adminGuard, updateAction, reportsAction, reportableText, pathologyPage, adminLayout] = await Promise.all([
    read("../supabase/migrations/20260810230000_admin_content_workflow.sql"),
    read("../lib/auth/admin.ts"),
    read("../app/actions/admin-pathologies.ts"),
    read("../app/actions/reports.ts"),
    read("../components/content/ReportableText.tsx"),
    read("../app/(app)/pathologies/[slug]/page.tsx"),
    read("../app/(app)/admin/layout.tsx"),
  ]);
  assert.match(sql, /profiles add column if not exists role text not null default 'student'/i);
  assert.match(sql, /where id = p_admin_user_id and role = 'admin'/i);
  assert.match(sql, /position\(v_selected_normalized in v_source_normalized\) = 0/i);
  assert.match(sql, /for select to authenticated using \(user_id = auth\.uid\(\)\)/i);
  assert.match(adminGuard, /data\?\.role === "admin"/);
  assert.match(adminLayout, /requireAdminUser\("\/admin"\)/);
  assert.match(updateAction, /assertAdminUser\(\)/);
  assert.match(updateAction, /admin\.rpc\("admin_update_pathology"/);
  assert.match(reportsAction, /enforceRateLimit\(admin, user\.id, "pathology-report"/);
  assert.match(reportsAction, /admin\.rpc\("create_pathology_report"/);
  assert.match(reportableText, /window\.getSelection\(\)/);
  assert.match(reportableText, /createPathologyReport\(/);
  assert.match(pathologyPage, /ReportableText/);
});

test("backend foundations centralize XP and idempotent learning progress", async () => {
  const [sql, pathologyAction, dailyQuiz, dailyRoute, specialtyProgress, quizAction, progressRoute] = await Promise.all([
    read("../supabase/migrations/20260810220000_backend_foundations.sql"),
    read("../app/actions/pathologies.ts"),
    read("../lib/quiz/daily.ts"),
    read("../app/api/quiz/daily/route.ts"),
    read("../lib/progress/specialties.ts"),
    read("../app/actions/quiz.ts"),
    read("../app/api/progress/route.ts"),
  ]);
  assert.match(sql, /create or replace function public\.add_xp\(/i);
  assert.match(sql, /level = floor\(\(p\.xp \+ xp_amount\) \/ 100\.0\)/i);
  assert.match(sql, /create or replace function public\.mark_pathology_as_read\(/i);
  assert.match(sql, /from public\.add_xp\(p_user_id, v_awarded_xp, false\)/i);
  assert.match(sql, /answer_question[\s\S]+from public\.add_xp\(p_user_id, v_awarded_xp, p_is_daily_quiz\)/i);
  assert.match(sql, /grant execute on function public\.add_xp[\s\S]+to service_role/i);
  assert.match(pathologyAction, /supabase\.auth\.getUser\(\)/);
  assert.match(pathologyAction, /admin\.rpc\("mark_pathology_as_read"/);
  assert.match(dailyQuiz, /eq\("quiz_date", today\)/);
  assert.match(dailyQuiz, /randomInt\(questionIds\.length\)/);
  assert.match(dailyQuiz, /select\("id, option_text, order_index"\)/);
  assert.doesNotMatch(dailyQuiz, /options: options\.map[\s\S]+is_correct/);
  assert.match(dailyRoute, /requireAuthenticatedUser\(\)/);
  assert.match(specialtyProgress, /user\.id !== userId/);
  assert.match(specialtyProgress, /progressPercentage/);
  assert.match(quizAction, /isDailyQuiz: true/);
  assert.match(progressRoute, /Math\.floor\(totalXp \/ 100\) \+ 1/);
});

test("quiz answers are validated and rewarded atomically", async () => {
  const [sql, action] = await Promise.all([
    read("../supabase/migrations/20260810210000_secure_quiz_answers.sql"),
    read("../app/actions/quiz.ts"),
  ]);
  assert.match(sql, /question_options qo[\s\S]+qo\.question_id = p_question_id/i);
  assert.match(sql, /questions q[\s\S]+q\.is_published = true/i);
  assert.match(sql, /from public\.profiles where id = p_user_id for update/i);
  assert.match(sql, /insert into public\.quiz_attempts/i);
  assert.match(sql, /on conflict \(user_id, question_id\) where question_id is not null/i);
  assert.match(sql, /revoke select on public\.question_options from authenticated/i);
  assert.doesNotMatch(sql, /grant select\([^)]*is_correct[^)]*\)[\s\S]+question_options/i);
  assert.match(action, /supabase\.auth\.getUser\(\)/);
  assert.match(action, /enforceRateLimit\(admin, user\.id, "quiz-answer"/);
  assert.match(action, /admin\.rpc\("answer_question"/);
  assert.doesNotMatch(action, /from\("profiles"\)\.update/);
});

test("phase 2 enriches the catalog without replacing existing data", async () => {
  const sql = await read("../supabase/migrations/20260810190000_phase2_content.sql");
  for (const column of [
    "definition", "pathophysiology", "symptoms", "risk_factors", "complementary_exams",
    "differential_diagnosis", "treatments", "complications", "monitoring", "is_published",
  ]) {
    assert.match(sql, new RegExp(`pathologies add column if not exists ${column}`, "i"));
  }
  assert.match(sql, /create table if not exists public\.daily_quizzes/i);
  assert.match(sql, /questions add column if not exists question_text/i);
  assert.match(sql, /question_options add column if not exists option_text/i);
  assert.doesNotMatch(sql, /drop table/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all).*user_progress.*authenticated/i);
});

test("the App Router is split into marketing, auth and connected product routes", async () => {
  for (const route of [
    "../app/(marketing)/page.tsx",
    "../app/(marketing)/pricing/page.tsx",
    "../app/(auth)/login/page.tsx",
    "../app/(auth)/signup/page.tsx",
    "../app/(app)/dashboard/page.tsx",
    "../app/(app)/fiches/page.tsx",
    "../app/(app)/quiz/page.tsx",
    "../app/(app)/quiz/[specialtySlug]/page.tsx",
    "../app/(app)/cas/page.tsx",
    "../app/(app)/profil/page.tsx",
    "../app/(app)/specialties/page.tsx",
    "../app/(app)/pathologies/[slug]/page.tsx",
    "../app/(app)/admin/pathologies/new/page.tsx",
    "../app/(app)/admin/questions/page.tsx",
    "../app/(app)/admin/questions/new/page.tsx",
    "../app/(app)/admin/questions/[id]/page.tsx",
  ]) {
    assert.ok((await read(route)).length > 0, route);
  }
});

test("quiz hub provides secure multi-question sessions by specialty", async () => {
  const [hub, route, query, session, migration] = await Promise.all([
    read("../app/(app)/quiz/page.tsx"),
    read("../app/(app)/quiz/[specialtySlug]/page.tsx"),
    read("../lib/quiz/specialty.ts"),
    read("../components/quiz/SpecialtyQuizSession.tsx"),
    read("../supabase/migrations/20260811000000_expand_specialties.sql"),
  ]);
  assert.match(hub, /Quiz par spécialité/);
  assert.match(hub, /getSpecialtyQuizCatalog\(user\.id\)/);
  assert.match(route, /requireUser\(`\/quiz\/\$\{specialtySlug\}`\)/);
  assert.match(route, /getSpecialtyQuiz\(user\.id, specialtySlug\)/);
  assert.match(query, /\.eq\("is_published", true\)/);
  assert.match(query, /questions\.filter\(\(question\) => !masteredIds\.has/);
  assert.match(query, /select\("id, question_id, option_text, order_index"\)/);
  assert.doesNotMatch(query, /from\("question_options"\)[\s\S]{0,120}is_correct/);
  assert.match(session, /answerQuestion\(\{ questionId: question\.id, selectedOptionId: selectedId \}\)/);
  assert.match(session, /Quiz terminé/);
  assert.match(migration, /'Urgences', 'urgences'/);
  assert.match(migration, /'Radiologie', 'radiologie'/);
  assert.match(migration, /on conflict\(slug\) do update/i);
});

test("the user dashboard is server-rendered from authenticated Supabase data", async () => {
  const [page, query, dashboard, loading, error] = await Promise.all([
    read("../app/(app)/dashboard/page.tsx"),
    read("../lib/dashboard/queries.ts"),
    read("../components/dashboard/UserDashboard.tsx"),
    read("../app/(app)/dashboard/loading.tsx"),
    read("../app/(app)/dashboard/error.tsx"),
  ]);
  assert.match(page, /requireUser\("\/dashboard"\)/);
  assert.match(page, /getDashboardData\(user\.id\)/);
  assert.match(query, /from\("profiles"\)/);
  assert.match(query, /from\("user_progress"\)/);
  assert.match(query, /getDailyQuiz\(\)/);
  assert.match(query, /from\("activity_events"\)/);
  assert.match(query, /weeklyActivity/);
  assert.match(dashboard, /Progression par spécialité/);
  assert.match(dashboard, /Quiz du jour/);
  assert.match(dashboard, /Objectif du jour/);
  assert.match(dashboard, /Vos premiers réflexes/);
  assert.match(loading, /animate-pulse/);
  assert.match(error, /reset/);
  assert.doesNotMatch(dashboard, /useEffect|fetch\("\/api\/progress"/);
});

test("dashboard actions complete the pathology and daily quiz feedback loops", async () => {
  const [pathologyPage, readButton, quizPage, quizCard, quizAction] = await Promise.all([
    read("../app/(app)/pathologies/[slug]/page.tsx"),
    read("../components/content/MarkAsReadButton.tsx"),
    read("../app/(app)/quiz/page.tsx"),
    read("../components/quiz/DailyQuizCard.tsx"),
    read("../app/actions/quiz.ts"),
  ]);
  assert.match(pathologyPage, /MarkAsReadButton/);
  assert.match(readButton, /markPathologyAsRead\(pathologyId\)/);
  assert.match(quizPage, /getDailyQuiz\(\)/);
  assert.match(quizPage, /getDailyQuizAttempt\(user\.id, quiz\)/);
  assert.match(quizCard, /answerDailyQuestion/);
  assert.match(quizCard, /correctOptionId/);
  assert.match(quizCard, /initialAttempt\?\.isCorrect/);
  assert.match(quizCard, /Quiz du jour réussi/);
  assert.match(quizAction, /eq\("is_correct", true\)/);
});

test("phase 1 includes shadcn primitives, email/Google auth and mobile navigation", async () => {
  const [authForm, navigation, migration] = await Promise.all([
    read("../components/auth/AuthForm.tsx"),
    read("../components/navigation/ConnectedNavigation.tsx"),
    read("../supabase/migrations/20260810170000_learning_catalog.sql"),
  ]);
  for (const primitive of ["button", "card", "input", "label"]) {
    assert.ok((await read(`../components/ui/${primitive}.tsx`)).length > 0);
  }
  assert.match(authForm, /signInWithPassword/);
  assert.match(authForm, /auth\.signUp/);
  assert.match(authForm, /provider: "google"/);
  assert.match(navigation, /mobile-nav/);
  assert.match(navigation, /usePathname/);
  for (const column of ["xp", "level", "streak"]) {
    assert.match(migration, new RegExp(`profiles add column ${column}`, "i"));
  }
});

test("security headers and server-only secrets are configured", async () => {
  const [nextConfig, envExample] = await Promise.all([read("../next.config.ts"), read("../.env.example")]);
  assert.match(nextConfig, /Content-Security-Policy/);
  assert.match(nextConfig, /Strict-Transport-Security/);
  assert.match(nextConfig, /frame-ancestors 'none'/);
  assert.match(envExample, /^SUPABASE_SERVICE_ROLE_KEY=/m);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(envExample, /^STRIPE_WEBHOOK_SECRET=/m);
});

test("all mutable product APIs enforce authenticated server identity", async () => {
  const routes = [
    "../app/api/progress/route.ts",
    "../app/api/ecos/session/route.ts",
    "../app/api/ecos/session/[id]/route.ts",
    "../app/api/ecos/chat/route.ts",
    "../app/api/billing/checkout/route.ts",
    "../app/api/billing/portal/route.ts",
  ];
  for (const route of routes) {
    const source = await read(route);
    assert.match(source, /requireAuthenticatedUser\(\)/, route);
    assert.match(source, /assertSameOrigin\(request\)/, route);
  }
});

test("ECOS scoring is shared by the client and server", () => {
  const transcript = [
    { role: "student", content: "Depuis quand avez-vous mal et la douleur irradie-t-elle dans le bras ?" },
    { role: "patient", content: "Depuis ce matin." },
  ];
  const criteria = calculateEcosCriteria(transcript);
  const result = scoreEcosTranscript(transcript);

  assert.equal(result.score, criteria.reduce((total, criterion) => total + criterion.earned, 0));
  assert.equal(result.maxScore, 18);
  assert.equal(result.score, 3);
});
