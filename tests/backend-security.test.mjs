import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateEcosCriteria, scoreEcosTranscript } from "../lib/ecos/scoring.ts";
import { getEcosScenario } from "../lib/ecos/stations/index.ts";

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

test("the editorial platform tracks question mastery and drops the unused quiz-session infrastructure", async () => {
  const [sql, cleanup, questionActions, questionQueries, questionForm, csv] = await Promise.all([
    read("../supabase/migrations/20260811020000_learning_platform_infrastructure.sql"),
    read("../supabase/migrations/20260830120000_schema_cleanup.sql"),
    read("../app/actions/admin-questions.ts"),
    read("../lib/admin/questions.ts"),
    read("../components/admin/AdminQuestionForm.tsx"),
    read("../lib/admin/question-csv.ts"),
  ]);
  for (const table of ["question_topics", "question_revisions", "user_question_stats", "question_import_batches", "clinical_case_attempts", "user_learning_goals"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, "i"));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /create trigger quiz_attempts_sync_user_question_stats/i);
  assert.match(sql, /needs_review = case[\s\S]+consecutive_correct \+ 1 >= 2 then false/i);
  // L'infrastructure de sessions de quiz n'a jamais été branchée : supprimée.
  assert.match(cleanup, /drop function if exists public\.answer_quiz_session_question/i);
  assert.match(cleanup, /drop function if exists public\.start_quiz_session/i);
  assert.match(cleanup, /drop table if exists public\.quiz_session_answers/i);
  assert.match(cleanup, /drop table if exists public\.quiz_session_questions/i);
  assert.match(cleanup, /drop table if exists public\.quiz_sessions/i);
  assert.match(questionActions, /admin\.rpc\("admin_upsert_question"/);
  assert.match(questionActions, /admin-question-import/);
  assert.match(questionQueries, /getAdminQuestionFormOptions/);
  assert.match(questionForm, /Explication pédagogique/);
  assert.match(csv, /export function parseCsv/);
});

test("the schema cleanup removes duplicated legacy columns and keeps published reads working", async () => {
  const cleanup = await read("../supabase/migrations/20260830120000_schema_cleanup.sql");
  assert.match(cleanup, /create policy "pathologies_read_published"[\s\S]+using \(is_published = true\)/i);
  assert.match(cleanup, /create policy "questions_read_published"[\s\S]+using \(is_published = true\)/i);
  assert.match(cleanup, /drop trigger if exists pathologies_sync_phase2_columns/i);
  assert.match(cleanup, /drop trigger if exists profiles_sync_activity_dates/i);
  assert.match(cleanup, /alter table public\.questions\s+drop column if exists prompt/i);
  assert.match(cleanup, /drop column if exists label/i);
  assert.match(cleanup, /drop column if exists last_activity_on/i);
  assert.match(cleanup, /drop column if exists pathophysiology/i);
  assert.match(cleanup, /criticality in \('standard', 'frequent', 'important', 'urgent'\)/i);
  // Les signalements restent vérifiés côté serveur, contre le document unifié.
  assert.match(cleanup, /concat_ws\(' ', p\.summary, p\.content\)/i);
  assert.match(cleanup, /position\(v_selected_normalized in v_source_normalized\) = 0/i);
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
  const [layout, initializer, navigation, toggle, styles] = await Promise.all([
    read("../app/layout.tsx"),
    read("../components/theme/ThemeInitializer.tsx"),
    read("../components/navigation/ConnectedNavigation.tsx"),
    read("../components/theme/ThemeToggle.tsx"),
    read("../app/globals.css"),
  ]);
  assert.match(layout, /ThemeInitializer/);
  assert.doesNotMatch(layout, /<script|next\/script|dangerouslySetInnerHTML/);
  assert.match(initializer, /THEME_STORAGE_KEY/);
  assert.match(initializer, /prefers-color-scheme: dark/);
  assert.match(initializer, /useLayoutEffect/);
  assert.match(navigation, /ThemeToggle/);
  assert.match(toggle, /localStorage\.setItem\(THEME_STORAGE_KEY/);
  assert.match(toggle, /Basculer entre le mode clair et le mode nuit/);
  assert.match(styles, /html\[data-theme="dark"\]/);
  assert.match(styles, /\.bg-slate-950 :is\(h1, h2, h3, h4\)/);
});

test("the marketing homepage reflects live product data and the current product pillars", async () => {
  const [page, landing, stats] = await Promise.all([
    read("../app/(marketing)/page.tsx"),
    read("../components/marketing/LandingPage.tsx"),
    read("../lib/marketing/stats.ts"),
  ]);
  assert.match(page, /getMarketingStats\(\)/);
  assert.match(page, /stats=\{stats\}/);
  assert.match(stats, /\.eq\("is_published", true\)/);
  // Le lancement se concentre sur les stations ECOS (lib/features.ts).
  assert.match(landing, /vous entraîne aux ECOS/);
  assert.match(landing, /patient simulé/);
  // Les quatre temps d'une station, chacun titré dans la marge.
  for (const step of ["Anamnèse", "Examen clinique", "Synthèse", "Débriefing"]) assert.match(landing, new RegExp(`name: "${step}"`));
  assert.match(landing, /<h3>\{step\.name\}<\/h3>/);
  assert.match(landing, /Parlez-lui à voix haute/);
  assert.match(landing, /stats\.caseCount/);
  assert.match(landing, /EXAM_DURATION_SECONDS/);
  assert.match(landing, /UPCOMING_FEATURE_LABELS/);
  assert.match(landing, /Conçu pour les étudiants en médecine en Suisse/);
  assert.doesNotMatch(landing, /Six spécialités/);
});

test("public marketing pages explain the method and provide FAQ and contact routes", async () => {
  const [method, faq, contact, catalogue, quality, about, news, tutorials, ecgTutorial, xrayTutorial, header, footer, landing] = await Promise.all([
    read("../app/(marketing)/methode/page.tsx"),
    read("../app/(marketing)/faq/page.tsx"),
    read("../app/(marketing)/contact/page.tsx"),
    read("../app/(marketing)/catalogue/page.tsx"),
    read("../app/(marketing)/qualite/page.tsx"),
    read("../app/(marketing)/a-propos/page.tsx"),
    read("../app/(marketing)/nouveautes/page.tsx"),
    read("../app/(marketing)/tutoriels/page.tsx"),
    read("../app/(marketing)/tutoriels/ecg/page.tsx"),
    read("../app/(marketing)/tutoriels/radiographie-thorax/page.tsx"),
    read("../components/ui/header-2.tsx"),
    read("../components/marketing/MarketingFooter.tsx"),
    read("../components/marketing/LandingPage.tsx"),
  ]);
  for (const step of ["anamnese", "examen", "synthese", "debriefing"]) {
    assert.match(method, new RegExp(`id: "${step}"`));
    assert.match(landing, new RegExp(`href: "/methode#${step}"`));
    assert.match(footer, new RegExp(`href: "/methode#${step}"`));
  }
  assert.match(method, /id="modes"/);
  assert.match(method, /Deux modes/);
  assert.match(faq, /Comment se déroule une station/);
  assert.match(faq, /<details/);
  assert.match(faq, /Comment les fiches sont-elles validées/);
  assert.match(contact, /ContactForm/);
  assert.match(contact, /BRAND_EMAIL_FROM/);
  assert.match(catalogue, /CatalogueExplorer/);
  assert.match(tutorials, /Lire un ECG en 6 étapes/);
  assert.match(ecgTutorial, /InteractiveTutorial/);
  assert.match(xrayTutorial, /InteractiveTutorial/);
  assert.match(quality, /Révision signée/);
  assert.match(quality, /À réviser/);
  assert.match(about, /Nos principes/);
  assert.match(news, /Journal du produit/);
  for (const route of ["catalogue", "methode", "pricing", "faq"]) {
    assert.match(header, new RegExp(`href: "/${route}"`));
  }
  for (const route of ["catalogue", "tutoriels", "methode", "qualite", "pricing", "faq", "contact"]) {
    assert.match(footer, new RegExp(`href: "/${route}"`));
  }
  for (const route of ["tutoriels", "qualite", "contact"]) assert.doesNotMatch(header, new RegExp(`href: "/${route}"`));
  for (const route of ["methode", "pricing", "faq", "a-propos", "nouveautes"]) assert.match(landing, new RegExp(`href="/${route}"`));
  // Aucun lien de l'accueil ne mène à un module masqué.
  for (const route of ["catalogue", "tutoriels", "qualite", "anatomie", "quiz", "sessions"]) assert.doesNotMatch(landing, new RegExp(`/${route}\\b`));
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
  assert.match(adminGuard, /select\("role"\)\.eq\("id", user\.id\)/);
  assert.match(adminGuard, /isAdminRole\(data\?\.role\)/);
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
  const [sql, pathologyAction, dailyQuiz, quizAction, progressRoute] = await Promise.all([
    read("../supabase/migrations/20260810220000_backend_foundations.sql"),
    read("../app/actions/pathologies.ts"),
    read("../lib/quiz/daily.ts"),
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
    "../app/(app)/sessions/page.tsx",
    "../app/(app)/sessions/[slug]/page.tsx",
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
  assert.match(dashboard, /Tes premiers réflexes/);
  assert.match(dashboard, /StudySessionSpotlight/);
  assert.match(query, /getStudySessionProgress/);
  assert.match(loading, /animate-pulse/);
  assert.match(error, /reset/);
  assert.doesNotMatch(dashboard, /useEffect|fetch\("\/api\/progress"/);
});

test("guided 30-minute study sessions persist ordered per-user progress", async () => {
  const [catalog, hub, route, player, action, migration, navigation] = await Promise.all([
    read("../lib/study-sessions/catalog.ts"),
    read("../app/(app)/sessions/page.tsx"),
    read("../app/(app)/sessions/[slug]/page.tsx"),
    read("../components/study-sessions/StudySessionPlayer.tsx"),
    read("../app/actions/study-sessions.ts"),
    read("../supabase/migrations/20260812000000_study_sessions.sql"),
    read("../components/navigation/ConnectedNavigation.tsx"),
  ]);
  assert.match(catalog, /slug: "douleur-thoracique-sca"/);
  assert.match(catalog, /Fiche · Syndrome coronarien aigu/);
  assert.match(catalog, /Tutoriel · Lecture systématique ECG/);
  assert.match(catalog, /QCM · Douleur thoracique/);
  assert.match(catalog, /Cas clinique · Douleur thoracique aiguë/);
  assert.match(hub, /Sessions guidées · 30 minutes/);
  assert.match(route, /requireUser\(`\/sessions\/\$\{encodeURIComponent\(slug\)\}`\)/);
  assert.match(player, /setStudySessionStepCompletion/);
  assert.match(player, /J'ai terminé cette étape/);
  assert.match(action, /requireUser\(`\/sessions\/\$\{encodeURIComponent\(sessionSlug\)\}`\)/);
  assert.match(action, /Terminez les étapes précédentes/);
  assert.match(migration, /create table if not exists public\.study_session_progress/i);
  assert.match(migration, /primary key\(user_id, session_slug, step_id\)/i);
  assert.match(migration, /using \(user_id = auth\.uid\(\)\)/i);
  assert.doesNotMatch(migration, /grant (insert|update|delete|all).*authenticated/i);
  assert.match(navigation, /href: "\/sessions"/);
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

test("new accounts receive a short, skippable and personalized onboarding", async () => {
  const [migration, authPage, page, flow, route, dashboardQuery, dashboard] = await Promise.all([
    read("../supabase/migrations/20260821090000_user_onboarding.sql"),
    read("../components/auth/AuthPage.tsx"),
    read("../app/onboarding/page.tsx"),
    read("../components/onboarding/OnboardingFlow.tsx"),
    read("../app/api/onboarding/route.ts"),
    read("../lib/dashboard/queries.ts"),
    read("../components/dashboard/UserDashboard.tsx"),
  ]);
  for (const column of ["university", "study_year", "exam_date", "learning_priority", "priority_specialty_ids", "onboarding_completed_at", "onboarding_skipped_at"]) {
    assert.match(migration, new RegExp(`add column if not exists ${column}`, "i"));
  }
  assert.match(authPage, /mode === "signup"[\s\S]+\/onboarding\?next=/);
  assert.match(page, /requireUser\(`\/onboarding\?next=/);
  assert.match(page, /onboarding_completed_at \|\| profile\?\.onboarding_skipped_at/);
  assert.match(flow, /Étape \{stepNumber\} sur \{steps\.length\}/);
  assert.match(flow, /Passer pour le moment/);
  assert.match(flow, /Choisis deux ou trois spécialités/);
  assert.match(route, /requireAuthenticatedUser\(\)/);
  assert.match(route, /assertSameOrigin\(request\)/);
  // Deux ou trois spécialités quand l'onboarding les demande, aucune sinon.
  assert.match(route, /minimumSpecialties = ONBOARDING_ASKS_SPECIALTIES \? 2 : 0/);
  assert.match(route, /specialtyIds\.length < minimumSpecialties \|\| specialtyIds\.length > 3/);
  assert.match(route, /onboarding_completed_at: now/);
  assert.match(dashboardQuery, /priority_specialty_ids/);
  assert.match(dashboard, /profile\.learning_priority/);
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
    "../app/api/ecos/speech/route.ts",
    "../app/api/ecos/transcribe/route.ts",
    "../app/api/ecos/session/[id]/procedure/route.ts",
    "../app/api/billing/checkout/route.ts",
    "../app/api/billing/portal/route.ts",
    "../app/api/profile/route.ts",
    "../app/api/profile/avatar/route.ts",
    "../app/api/onboarding/route.ts",
  ];
  for (const route of routes) {
    const source = await read(route);
    assert.match(source, /requireAuthenticatedUser\(\)/, route);
    assert.match(source, /assertSameOrigin\(request\)/, route);
  }
});

test("every post-login redirect target uses the shared same-origin guard", async () => {
  // Prefix checks miss `/\\evil.com` and `/\t/evil.com`: both resolve to an
  // external origin under the WHATWG URL spec. See tests/audit-fixes.test.mjs.
  const [callback, authPage, onboarding, connectedLayout] = await Promise.all([
    read("../app/auth/callback/route.ts"),
    read("../components/auth/AuthPage.tsx"),
    read("../app/onboarding/page.tsx"),
    read("../app/(app)/layout.tsx"),
  ]);
  for (const source of [callback, authPage, onboarding, connectedLayout]) {
    assert.match(source, /safeRedirectPath\(/);
    assert.doesNotMatch(source, /startsWith\("\/\/"\)/);
  }
});

test("ECOS scoring is shared by the client and server", () => {
  const transcript = [
    { role: "student", content: "Depuis quand avez-vous mal et la douleur irradie-t-elle dans le bras ?" },
    { role: "patient", content: "Depuis ce matin." },
  ];
  const { criteria: grid } = getEcosScenario("douleur-thoracique-aigue");
  const criteria = calculateEcosCriteria(grid, transcript);
  const result = scoreEcosTranscript(grid, transcript);

  assert.equal(result.score, criteria.reduce((total, criterion) => total + criterion.earned, 0));
  assert.equal(result.maxScore, 20);
  assert.equal(result.score, 2);
});

test("theory fiches and practice grids are read-only for students and edited through versioned admin RPCs", async () => {
  const [sql, action, theoryQueries, gridQueries] = await Promise.all([
    read("../supabase/migrations/20261012150000_theory_and_grids.sql"),
    read("../app/actions/admin-training.ts"),
    read("../lib/theory/queries.ts"),
    read("../lib/grids/queries.ts"),
  ]);
  for (const table of ["theory_fiches", "practice_grids"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(sql, new RegExp(`on public\\.${table}\\s+for select to authenticated using \\(is_published = true\\)`, "i"));
    assert.match(sql, new RegExp(`revoke all on [^;]*public\\.${table}[^;]* from anon, authenticated;`, "i"));
    assert.match(sql, new RegExp(`grant select on [^;]*public\\.${table}[^;]* to authenticated;`, "i"));
  }
  for (const fn of ["admin_save_theory_fiche", "admin_save_practice_grid"]) {
    const body = sql.slice(sql.indexOf(`function public.${fn}(`));
    assert.match(body, /security definer\s+set search_path = ''/i);
    assert.match(body, /where id = p_admin_user_id and role = 'admin'/i);
    assert.match(body, /version = p_expected_version/i);
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}\\([^)]*\\)\\s+from public, anon, authenticated`, "i"));
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\)\\s+to service_role`, "i"));
    assert.match(action, new RegExp(`admin\\.rpc\\("${fn}"`));
  }
  assert.match(action, /await assertAdminUser\(\)/);
  assert.match(action, /enforceRateLimit\(/);
  assert.match(action, /validateGridContent\(/);
  // Les étudiants ne lisent que le publié, même si la RLS était contournée côté service.
  for (const queries of [theoryQueries, gridQueries]) {
    assert.match(queries, /import "server-only"/);
    assert.match(queries, /\.eq\("is_published", true\)/);
  }
  assert.match(gridQueries, /validateGridContent\(/);
});

test("ECOS sessions and messages are never readable from the browser (station_slug names the diagnosis)", async () => {
  const sql = await read("../supabase/migrations/20261013130000_ecos_sessions_server_only.sql");
  assert.match(sql, /revoke select on public\.ecos_sessions, public\.ecos_messages from anon, authenticated;/i);
  assert.match(sql, /drop policy if exists "ecos_sessions_select_own" on public\.ecos_sessions;/i);
  assert.match(sql, /drop policy if exists "ecos_messages_select_own" on public\.ecos_messages;/i);
  assert.doesNotMatch(sql, /grant select[^;]*ecos_(sessions|messages)/i);
  // Seul le formulaire d'authentification utilise le client navigateur.
  const { readdir } = await import("node:fs/promises");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const browserClientUsers = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (/\.tsx?$/.test(entry.name) && /@\/lib\/supabase\/client"/.test(await readFile(full, "utf8"))) browserClientUsers.push(path.relative(root, full));
    }
  }
  const root = fileURLToPath(new URL("..", import.meta.url));
  for (const dir of ["app", "components", "lib"]) await walk(path.join(root, dir));
  assert.deepEqual(browserClientUsers.sort(), ["components/auth/AuthForm.tsx"]);
});
