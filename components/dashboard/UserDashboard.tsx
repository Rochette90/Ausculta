import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard/queries";
import type { ClinicalCaseSummary } from "@/lib/ecos/cases";
import { FEATURES, isLearningPriorityAvailable } from "@/lib/features";
import { Card } from "@/components/ui/card";
import { SpecialtyIcon } from "@/components/content/SpecialtyIcon";
import type { PracticeGridSummary } from "@/lib/grids/queries";
import { cn } from "@/lib/utils";
import { featuredStudySession } from "@/lib/study-sessions/catalog";
import { StudySessionSpotlight } from "@/components/study-sessions/StudySessionSpotlight";

const toneByColor: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
  rose: "bg-rose-50 text-rose-700",
  sky: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
};

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("fr-CH", {
    timeZone: "Europe/Zurich",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

/**
 * Le message d'accueil est dérivé d'une donnée réelle de l'utilisateur :
 * séance en cours, point le plus fragile, ou séance à venir ; stations
 * terminées quand les séances guidées sont masquées. Jamais un encouragement
 * sans information.
 */
function dashboardGreeting({
  sessionInProgress,
  remainingMinutes,
  sessionSubject,
  weakestSpecialty,
  completedStations,
}: {
  sessionInProgress: boolean;
  remainingMinutes: number;
  sessionSubject: string;
  weakestSpecialty: { name: string; progressPercentage: number } | null;
  completedStations: number;
}) {
  if (!FEATURES.sessions) {
    if (completedStations === 0) return "Ton premier patient simulé t’attend.";
    return `${completedStations} station${completedStations > 1 ? "s" : ""} terminée${completedStations > 1 ? "s" : ""}. Quel patient ensuite ?`;
  }
  if (sessionInProgress) return `Il te reste ${remainingMinutes} min sur ${sessionSubject}.`;
  if (weakestSpecialty) return `Ton point le plus fragile : ${weakestSpecialty.name} (${weakestSpecialty.progressPercentage} %).`;
  return `Ta prochaine séance porte sur ${sessionSubject}.`;
}

const difficultyLabels = { easy: "Facile", medium: "Intermédiaire", hard: "Avancé" } as const;

export function UserDashboard({ data, firstName, stations = [], grids = [] }: { data: DashboardData; firstName: string | null; stations?: ClinicalCaseSummary[]; grids?: PracticeGridSummary[] }) {
  const { profile, stats, specialties, dailyQuiz, dailyQuizCompleted, recommendedPathology, recentActivity, weeklyActivity, todayGoal, featuredStudySessionCompletedStepIds } = data;
  const displayName = firstName
    ? `${firstName.charAt(0).toLocaleUpperCase("fr-CH")}${firstName.slice(1)}`
    : null;
  const today = new Intl.DateTimeFormat("fr-CH", {
    timeZone: "Europe/Zurich",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const completedSessionSteps = new Set(featuredStudySessionCompletedStepIds);
  const sessionStepCount = featuredStudySession.steps.length;
  const sessionCompletedCount = featuredStudySession.steps.filter((step) => completedSessionSteps.has(step.id)).length;
  const sessionInProgress = sessionCompletedCount > 0 && sessionCompletedCount < sessionStepCount;
  const sessionRemainingMinutes = featuredStudySession.steps
    .reduce((sum, step) => sum + (completedSessionSteps.has(step.id) ? 0 : step.durationMinutes), 0);
  const sessionHref = `/sessions/${featuredStudySession.slug}`;
  // Le « point fragile » n'a de sens qu'une fois la spécialité entamée.
  const weakestSpecialty = specialties
    .filter((specialty) => specialty.totalItems > 0 && specialty.progressPercentage > 0 && specialty.progressPercentage < 100)
    .sort((a, b) => a.progressPercentage - b.progressPercentage)[0] ?? null;
  const greeting = dashboardGreeting({
    sessionInProgress,
    remainingMinutes: sessionRemainingMinutes,
    sessionSubject: featuredStudySession.subject,
    weakestSpecialty,
    completedStations: stats.completedClinicalCases,
  });
  // Fiches et QCM forment la « bibliothèque » : masqués, le tableau de bord
  // se recentre sur les stations ECOS (voir lib/features.ts).
  const libraryEnabled = FEATURES.fiches || FEATURES.quiz;
  const playableStations = stations.filter((station) => station.published && station.code).slice(0, 3);
  const onboarding = [
    { feature: "fiches" as const, label: "Lire une première fiche", detail: "+5 XP", href: recommendedPathology ? `/pathologies/${recommendedPathology.slug}` : "/specialties", complete: stats.completedPathologies > 0 },
    { feature: "quiz" as const, label: "Répondre à une question", detail: "Quiz du jour", href: "/quiz?mode=daily", complete: stats.successfulQuestions > 0 },
    { feature: "ecos" as const, label: "Terminer une station ECOS", detail: "Cas clinique", href: "/cas", complete: stats.completedClinicalCases > 0 },
  ].filter((item) => FEATURES[item.feature]);
  const onboardingComplete = onboarding.filter((item) => item.complete).length;
  // Une priorité choisie à l'onboarding mais dont le module est masqué
  // retombe sur les stations ECOS.
  const priority = profile.learning_priority && isLearningPriorityAvailable(profile.learning_priority)
    ? profile.learning_priority
    : FEATURES.quiz ? "qcm" : "cas_cliniques";
  const primaryAction = (() => {
    switch (priority) {
      case "fiches":
        return {
          href: recommendedPathology ? `/pathologies/${recommendedPathology.slug}` : "/specialties",
          label: recommendedPathology ? "Fiche recommandée" : "Explorer les fiches",
          description: "Une notion prioritaire dans l’une de tes spécialités.",
        };
      case "cas_cliniques":
        return { href: "/cas", label: stats.completedClinicalCases > 0 ? "Choisir une station" : "Commencer ma première station", description: "Anamnèse, examen clinique et synthèse face à un patient simulé, puis ta grille corrigée." };
      case "seances":
        return { href: "/sessions", label: "Choisir une séance", description: "Une séance guidée de 30 minutes, fiche puis QCM puis cas." };
      case "qcm":
      default:
        return { href: "/quiz?mode=daily", label: dailyQuizCompleted ? "Revoir le quiz" : "Quiz du jour", description: "Une décision clinique par jour, corrigée et expliquée." };
    }
  })();
  // CTA secondaire : uniquement si une séance est réellement en cours, et
  // jamais vers la même route que le CTA principal.
  const secondaryAction = FEATURES.sessions && sessionInProgress && primaryAction.href !== sessionHref
    ? { href: sessionHref, label: "Reprendre ma séance" }
    : null;

  const level = profile.level;
  const stationCode = (code: string) => code.replace(/^station-/, "");

  return (
    <main className="learning-page">
      <header className="dash-head">
        <p className="dash-date">{today.charAt(0).toLocaleUpperCase("fr-CH") + today.slice(1)}</p>
        <h1>Bonjour{displayName ? ` ${displayName}` : ""}.</h1>
        <p className="dash-greeting voice">{greeting}</p>
        <p className="dash-sub">{primaryAction.description}</p>
        <div className="dash-actions">
          <Link className="button primary" href={primaryAction.href}>{primaryAction.label}</Link>
          {secondaryAction && <Link className="button secondary" href={secondaryAction.href}>{secondaryAction.label}</Link>}
        </div>
      </header>

      <dl className="dash-stats" aria-label="Statistiques personnelles">
        <div><dt>{FEATURES.fiches ? "Fiches terminées" : "Stations terminées"}</dt><dd>{FEATURES.fiches ? stats.completedPathologies : stats.completedClinicalCases}</dd></div>
        <div><dt>Série</dt><dd>{profile.streak}<small>{profile.streak > 1 ? "jours" : "jour"}</small></dd></div>
        <div><dt>{libraryEnabled ? "Progression globale" : "XP aujourd’hui"}</dt><dd>{libraryEnabled ? `${stats.overallProgress} %` : <>{todayGoal.earnedXp}<small>/ {todayGoal.targetXp}</small></>}</dd></div>
        <div><dt>Niveau</dt><dd>{level}<small>{stats.levelProgress} / 100 XP</small></dd></div>
      </dl>

      {FEATURES.anatomy && <Link href="/anatomie" className="mb-6 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--surface)] p-6 text-[var(--ink)] no-underline">
        <div><p className="learning-eyebrow">Anatomie clinique</p><h2 className="m-0 text-xl">Relie les structures aux symptômes.</h2><p className="mb-0 mt-2 text-sm text-[var(--muted)]">6 modules, 18 repères, rappel actif et mini-cas.</p></div><span className="text-link">Explorer l’atlas</span>
      </Link>}
      {FEATURES.sessions && <StudySessionSpotlight completedStepIds={featuredStudySessionCompletedStepIds} session={featuredStudySession} streak={profile.streak} />}

      {onboarding.length > 1 && onboardingComplete < onboarding.length && (
        <Card className="mt-8 p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="lg:max-w-64">
              <h2 className="m-0 !text-2xl">Tes premiers réflexes</h2>
              <p className="mb-0 mt-2 text-sm text-[var(--muted)]">{onboardingComplete}/{onboarding.length} étapes terminées</p>
            </div>
            <div className={cn("grid gap-2", onboarding.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
              {onboarding.map((item, index) => (
                <Link className={cn("flex items-center gap-3 rounded-2xl border p-3.5 no-underline transition", item.complete ? "border-[var(--line)] bg-[var(--primary-subtle)] text-[var(--ink)]" : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]")} href={item.href} key={item.label}>
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold", item.complete ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--paper)] text-[var(--ink-secondary)]")}>{item.complete ? <CheckCircle2 size={17} /> : index + 1}</span>
                  <span className="min-w-0"><strong className="block truncate text-sm">{item.label}</strong><small className="text-[var(--muted)]">{item.detail}</small></span>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      {libraryEnabled && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
          <Card className="overflow-hidden p-5 sm:p-7">
            <header className="flex items-end justify-between gap-4">
              <h2 className="m-0 text-2xl sm:text-3xl">Progression par spécialité</h2>
              <Link className="text-link hidden text-sm sm:inline-flex" href="/specialties">Tout voir</Link>
            </header>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {specialties.map((specialty) => (
                <Link className="group rounded-2xl border border-[var(--line)] p-4 text-[var(--ink)] no-underline transition hover:border-[var(--ink)]" href={`/specialties#${specialty.slug}`} key={specialty.id}>
                  <div className="flex items-center gap-3">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", toneByColor[specialty.color ?? ""] ?? "bg-teal-50 text-teal-700")}><SpecialtyIcon name={specialty.icon} /></span>
                    <div className="min-w-0 flex-1"><strong className="block truncate">{specialty.name}</strong><span className="text-xs text-[var(--muted)]">{specialty.completedItems}/{specialty.totalItems} acquis, {specialty.xpEarned} XP</span></div>
                    <ChevronRight className="text-[var(--muted)]" size={18} />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--line)]"><span className="block h-full rounded-full bg-[var(--bar-2)]" style={{ width: `${specialty.progressPercentage}%` }} /></div>
                  <span className="mt-2 block text-right text-xs font-bold text-[var(--muted)]">{specialty.progressPercentage} %</span>
                </Link>
              ))}
            </div>
          </Card>

          <div className="grid gap-6">
            {FEATURES.quiz && (
              <Card className="p-6">
                <h2 className="m-0 max-w-xs !text-2xl">{dailyQuizCompleted ? "Quiz du jour : réponse enregistrée." : "Quiz du jour"}</h2>
                <p className="mt-4 text-sm leading-6 text-[var(--ink-secondary)]">
                  {dailyQuizCompleted ? "La correction reste accessible jusqu’au prochain quiz." : dailyQuiz ? `${dailyQuiz.question.options.length} options, ${dailyQuiz.question.xpReward} XP à gagner.` : "Ta nouvelle question quotidienne t’attend."}
                </p>
                <Link className="button primary full mt-5" href="/quiz?mode=daily">{dailyQuizCompleted ? "Revoir la correction" : "Répondre maintenant"}</Link>
              </Card>
            )}

            {FEATURES.fiches && (
              <Card className="p-6">
                <h2 className="m-0 !text-xl">À réviser</h2>
                {recommendedPathology ? <><p className="mb-1 mt-5 font-semibold">{recommendedPathology.title}</p><p className="mt-1 text-sm text-[var(--muted)]">Difficulté {recommendedPathology.difficulty}, fiche non terminée</p><Link className="text-link mt-4 text-sm" href={`/pathologies/${recommendedPathology.slug}`}>Ouvrir la fiche</Link></> : <p className="mt-5 text-sm text-[var(--muted)]">Toutes les fiches disponibles sont terminées.</p>}
              </Card>
            )}
          </div>
        </div>
      )}

      {FEATURES.ecos && !libraryEnabled && (
        <section className="learning-section" aria-labelledby="dashboard-stations-title">
          <div className="learning-section-head">
            <h2 id="dashboard-stations-title">Choisis ton prochain patient</h2>
            <Link className="text-link" href="/cas">Toutes les stations</Link>
          </div>
          {playableStations.length > 0 ? (
            <ul className="station-list">
              {playableStations.map((station) => (
                <li className="station-row" key={station.code}>
                  <span className="station-row-code">{station.code ? stationCode(station.code) : ""}</span>
                  <div>
                    {station.patientLabel && <p className="station-row-patient voice">{station.patientLabel}</p>}
                    <h3>{station.candidateTitle}</h3>
                    <ul className="station-row-meta">
                      <li>{station.specialty ?? "Transversal"}</li>
                      <li>{difficultyLabels[station.difficulty]}</li>
                    </ul>
                  </div>
                  <span className="station-row-time">{station.duration}</span>
                  <Link className="button secondary small" href={`/cas/${station.code}`}>Commencer</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="learning-note">Les stations sont en préparation. Reviens bientôt.</p>
          )}
        </section>
      )}

      {FEATURES.grilles && grids.length > 0 && (
        <section className="learning-section" aria-labelledby="dashboard-grids-title">
          <div className="learning-section-head">
            <h2 id="dashboard-grids-title">S&apos;entraîner en binôme</h2>
            <Link className="text-link" href="/grilles">Toutes les grilles</Link>
          </div>
          <p className="learning-note">Un patient, un candidat, un évaluateur : la grille donne le chrono de 13 minutes et le score, comme le jour de l&apos;examen.</p>
          <ul className="dash-grid-links">
            {grids.map((grid) => (
              <li key={grid.slug}><Link className="button secondary small" href={`/grilles/${grid.slug}`}>{grid.title}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <section className="dash-columns" aria-label="Ton activité">
        <div className="dash-panel">
          <h2>Activité récente</h2>
          {recentActivity.length > 0
            ? <ul className="activity-list">{recentActivity.map((activity) => <li key={activity.id}><Link href={activity.href}><strong>{activity.label}</strong><small>{activity.detail}</small><time dateTime={activity.completedAt}>{formatActivityDate(activity.completedAt)}</time></Link></li>)}</ul>
            : <p className="learning-note">Ton activité apparaîtra ici après ta première station.</p>}
        </div>
        <div className="dash-panel">
          <h2>Les 7 derniers jours</h2>
          <ol className="week" aria-label="XP gagnée durant les sept derniers jours">
            {weeklyActivity.map((day) => {
              const weeklyMax = Math.max(30, ...weeklyActivity.map((item) => item.xp));
              const height = day.xp === 0 ? 6 : Math.max(12, Math.round((day.xp / weeklyMax) * 100));
              return <li className={day.isToday ? "is-today" : undefined} key={day.date}><span className="week-xp">{day.xp || ""}</span><span className="week-bar" style={{ height: `${height}%` }} /><span className="week-day"><span className="sr-only">{day.xp} XP, </span>{day.label}</span></li>;
            })}
          </ol>
          <div className="goal">
            <div className="goal-head"><span>Objectif du jour</span><strong>{todayGoal.earnedXp}/{todayGoal.targetXp} XP</strong></div>
            <div className="goal-track"><span style={{ width: `${todayGoal.percentage}%` }} /></div>
          </div>
        </div>
      </section>
    </main>
  );
}
