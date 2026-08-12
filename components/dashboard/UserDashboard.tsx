import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  Flame,
  Stethoscope,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import type { DashboardData } from "../../lib/dashboard/queries";
import { buttonVariants } from "../ui/button";
import { Card } from "../ui/card";
import { SpecialtyIcon } from "../content/SpecialtyIcon";
import { cn } from "../../lib/utils";

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

export function UserDashboard({ data, firstName }: { data: DashboardData; firstName: string | null }) {
  const { profile, stats, specialties, dailyQuiz, dailyQuizCompleted, recommendedPathology, recentActivity, weeklyActivity, todayGoal } = data;
  const displayName = firstName
    ? `${firstName.charAt(0).toLocaleUpperCase("fr-CH")}${firstName.slice(1)}`
    : null;
  const today = new Intl.DateTimeFormat("fr-CH", {
    timeZone: "Europe/Zurich",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const onboarding = [
    { label: "Lire une première fiche", detail: "+5 XP", href: recommendedPathology ? `/pathologies/${recommendedPathology.slug}` : "/specialties", complete: stats.completedPathologies > 0 },
    { label: "Répondre à une question", detail: "Quiz du jour", href: "/quiz?mode=daily", complete: stats.successfulQuestions > 0 },
    { label: "Terminer une station ECOS", detail: "Cas clinique", href: "/cas", complete: stats.completedClinicalCases > 0 },
  ];
  const onboardingComplete = onboarding.filter((item) => item.complete).length;

  return (
    <main className="page-enter mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pt-10">
      <section className="relative overflow-hidden rounded-[30px] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-9 lg:px-12 lg:py-9">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-teal-400/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-24 right-1/3 size-56 rounded-full bg-sky-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">{today}</p>
            <h1 className="m-0 max-w-3xl !text-4xl !leading-[1.05] !text-white sm:!text-5xl">
              Bonjour{displayName ? ` ${displayName}` : ""},<br />
              <em className="text-teal-300">on progresse aujourd’hui.</em>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Un quiz ciblé, une fiche essentielle ou une station clinique : choisissez votre prochaine étape.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className={cn(buttonVariants({ size: "lg" }), "bg-teal-400 text-slate-950 hover:bg-teal-300")} href="/quiz?mode=daily">
                {dailyQuizCompleted ? <CheckCircle2 size={18} /> : <ClipboardCheck size={18} />} {dailyQuizCompleted ? "Quiz terminé" : "Quiz du jour"}
              </Link>
              {recommendedPathology && (
                <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/20 bg-white/5 text-white hover:border-teal-300 hover:bg-white/10 hover:text-white")} href={`/pathologies/${recommendedPathology.slug}`}>
                  <BookOpenCheck size={18} /> Continuer une fiche
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur sm:min-w-72">
            <div className="grid size-24 shrink-0 place-items-center rounded-full p-2" style={{ background: `conic-gradient(#2dd4bf ${stats.levelProgress * 3.6}deg, rgba(255,255,255,.12) 0deg)` }}>
              <div className="grid size-full place-items-center rounded-full bg-slate-950 text-center">
                <span><strong className="block text-2xl text-white">{profile.level}</strong><small className="text-[10px] uppercase tracking-wider text-slate-400">Niveau</small></span>
              </div>
            </div>
            <div>
              <p className="m-0 text-sm text-slate-400">Progression du niveau</p>
              <strong className="mt-1 block text-xl text-white">{stats.levelProgress} / 100 XP</strong>
              <p className="mb-0 mt-2 text-xs text-teal-300">{100 - stats.levelProgress} XP avant le niveau {profile.level + 1}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Statistiques personnelles">
        <Card className="p-4 sm:p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Star size={19} /></span><div><strong className="block text-xl sm:text-2xl">{profile.xp.toLocaleString("fr-CH")}</strong><span className="text-xs text-slate-500 sm:text-sm">XP total</span></div></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-700"><Flame size={19} /></span><div><strong className="block text-xl sm:text-2xl">{profile.streak}</strong><span className="text-xs text-slate-500 sm:text-sm">jours de série</span></div></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><CheckCircle2 size={19} /></span><div><strong className="block text-xl sm:text-2xl">{stats.completedPathologies}</strong><span className="text-xs text-slate-500 sm:text-sm">fiches terminées</span></div></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><CircleGauge size={19} /></span><div><strong className="block text-xl sm:text-2xl">{stats.overallProgress}%</strong><span className="text-xs text-slate-500 sm:text-sm">progression globale</span></div></div></Card>
      </section>

      {onboardingComplete < onboarding.length && (
        <Card className="mt-6 overflow-hidden border-teal-100 bg-gradient-to-r from-teal-50 to-white p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="lg:max-w-64">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Bien démarrer</p>
              <h2 className="m-0 !text-2xl">Vos premiers réflexes</h2>
              <p className="mb-0 mt-2 text-sm text-slate-600">{onboardingComplete}/3 étapes terminées</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {onboarding.map((item, index) => (
                <Link className={cn("flex items-center gap-3 rounded-2xl border p-3.5 no-underline transition", item.complete ? "border-emerald-100 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-900 hover:border-teal-300")} href={item.href} key={item.label}>
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold", item.complete ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600")}>{item.complete ? <CheckCircle2 size={17} /> : index + 1}</span>
                  <span className="min-w-0"><strong className="block truncate text-sm">{item.label}</strong><small className="text-slate-500">{item.detail}</small></span>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
        <Card className="overflow-hidden p-5 sm:p-7">
          <header className="flex items-end justify-between gap-4">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Votre parcours</p><h2 className="m-0 text-2xl sm:text-3xl">Progression par spécialité</h2></div>
            <Link className="hidden items-center gap-1 text-sm font-semibold text-teal-700 no-underline sm:flex" href="/specialties">Tout voir <ArrowRight size={16} /></Link>
          </header>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {specialties.map((specialty) => (
              <Link className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-slate-900 no-underline transition hover:border-teal-200 hover:bg-teal-50/50" href={`/specialties#${specialty.slug}`} key={specialty.id}>
                <div className="flex items-center gap-3">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", toneByColor[specialty.color ?? ""] ?? "bg-teal-50 text-teal-700")}><SpecialtyIcon name={specialty.icon} /></span>
                  <div className="min-w-0 flex-1"><strong className="block truncate">{specialty.name}</strong><span className="text-xs text-slate-500">{specialty.completedItems}/{specialty.totalItems} acquis · {specialty.xpEarned} XP</span></div>
                  <ChevronRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-700" size={18} />
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-teal-600" style={{ width: `${specialty.progressPercentage}%` }} /></div>
                <span className="mt-2 block text-right text-xs font-bold text-slate-600">{specialty.progressPercentage}%</span>
              </Link>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="relative overflow-hidden border-teal-900 bg-teal-950 p-6 text-white shadow-lg">
            <Sparkles className="absolute -right-3 -top-3 size-24 text-teal-800/60" aria-hidden="true" />
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-300">{dailyQuizCompleted ? "Objectif quotidien validé" : "Quiz du jour"}</p>
            <h2 className="m-0 max-w-xs !text-2xl !text-white">{dailyQuizCompleted ? "Réponse enregistrée. Beau travail." : "Une décision clinique pour garder le rythme."}</h2>
            <p className="mt-4 text-sm leading-6 text-teal-100/80">
              {dailyQuizCompleted ? "La correction reste accessible jusqu’au prochain quiz." : dailyQuiz ? `${dailyQuiz.question.options.length} options · ${dailyQuiz.question.xpReward} XP à gagner` : "Votre nouvelle question quotidienne vous attend."}
            </p>
            <Link className={cn(buttonVariants(), "mt-5 w-full bg-white text-teal-950 hover:bg-teal-100")} href="/quiz?mode=daily">{dailyQuizCompleted ? "Revoir la correction" : "Répondre maintenant"} <ArrowRight size={17} /></Link>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><BrainCircuit size={19} /></span><div><p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-violet-700">Prochaine étape</p><h2 className="m-0 !text-xl">À réviser</h2></div></div>
            {recommendedPathology ? <><p className="mb-1 mt-5 font-semibold text-slate-900">{recommendedPathology.title}</p><p className="mt-1 text-sm text-slate-500">Difficulté {recommendedPathology.difficulty} · fiche non terminée</p><Link className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-teal-700 no-underline" href={`/pathologies/${recommendedPathology.slug}`}>Ouvrir la fiche <ArrowRight size={15} /></Link></> : <p className="mt-5 text-sm text-slate-500">Toutes les fiches disponibles sont terminées. Beau travail.</p>}
          </Card>
        </div>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5 sm:p-7">
          <header className="flex items-center justify-between"><div><p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Historique</p><h2 className="m-0 text-2xl">Activité récente</h2></div><Trophy className="text-amber-500" size={24} /></header>
          {recentActivity.length > 0 ? <div className="mt-5 divide-y divide-slate-100">{recentActivity.map((activity) => <Link className="flex items-center gap-4 py-3 text-slate-900 no-underline first:pt-0 last:pb-0" href={activity.href} key={activity.id}><span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", activity.kind === "pathology" ? "bg-teal-50 text-teal-700" : activity.kind === "clinical_case" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700")}>{activity.kind === "pathology" ? <BookOpenCheck size={17} /> : activity.kind === "clinical_case" ? <Stethoscope size={17} /> : <ClipboardCheck size={17} />}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{activity.label}</strong><small className="text-slate-500">{activity.detail}</small></span><time className="text-xs text-slate-400" dateTime={activity.completedAt}>{formatActivityDate(activity.completedAt)}</time></Link>)}</div> : <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center"><p className="m-0 text-sm text-slate-500">Votre activité apparaîtra ici après votre première fiche, question ou station.</p></div>}
        </Card>
        <Card className="p-5 sm:p-7">
          <header className="flex items-start justify-between gap-4"><div><p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Régularité</p><h2 className="m-0 !text-2xl">Les 7 derniers jours</h2></div><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Clock3 size={19} /></span></header>
          <div className="mt-6 flex h-32 items-end gap-2" aria-label="XP gagnée durant les sept derniers jours">
            {weeklyActivity.map((day) => {
              const weeklyMax = Math.max(30, ...weeklyActivity.map((item) => item.xp));
              const height = day.xp === 0 ? 6 : Math.max(12, Math.round((day.xp / weeklyMax) * 100));
              return <div className="flex h-full flex-1 flex-col justify-end gap-2 text-center" key={day.date}><span className="text-[10px] font-bold text-slate-500">{day.xp || ""}</span><span className={cn("mx-auto w-full max-w-8 rounded-t-lg transition-all", day.isToday ? "bg-teal-600" : "bg-slate-200")} style={{ height: `${height}%` }} title={`${day.label}: ${day.xp} XP`} /><span className={cn("text-[11px] capitalize", day.isToday ? "font-bold text-teal-700" : "text-slate-500")}>{day.label}</span></div>;
            })}
          </div>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-4 text-sm"><span className="font-semibold text-slate-700">Objectif du jour</span><strong className="text-teal-700">{todayGoal.earnedXp}/{todayGoal.targetXp} XP</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-teal-600" style={{ width: `${todayGoal.percentage}%` }} /></div></div>
        </Card>
      </section>
    </main>
  );
}
