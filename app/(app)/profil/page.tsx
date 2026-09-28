import { initialsFrom, profileAvatarUrl } from "@/lib/profile/presentation";
import { Award, CalendarDays, Flame, Gauge, LogOut, ShieldCheck, Sparkles, Star } from "lucide-react";
import { BillingActions } from "../../../components/profile/BillingActions";
import { DeleteAccountButton } from "../../../components/profile/DeleteAccountButton";
import { ProfileSettings } from "../../../components/profile/ProfileSettings";
import { requireUser } from "../../../lib/auth/require-user";
import { getProfileSummary } from "../../../lib/profile/queries";
import { createClient } from "../../../lib/supabase/server";
import { BRAND_PRO_PLAN, pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Profil") };

type BadgeDetails = { id: string; name: string; description: string | null; icon: string | null };
// `badges` est une relation plusieurs-à-un : PostgREST renvoie un objet, pas un tableau.
type BadgeRelation = {
  awarded_at: string;
  badges: BadgeDetails | BadgeDetails[] | null;
};
const badgeOf = (item: BadgeRelation) => (Array.isArray(item.badges) ? item.badges[0] : item.badges) ?? null;


export default async function ProfilPage() {
  const user = await requireUser("/profil");
  const supabase = await createClient();
  const [
    profile,
    { data: subscription },
    { data: badges },
    { data: learningGoal },
    { data: specialties },
  ] = await Promise.all([
    getProfileSummary(user.id),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_badges")
      .select("awarded_at, badges(id, name, description, icon)")
      .eq("user_id", user.id)
      .order("awarded_at", { ascending: false }),
    supabase
      .from("user_learning_goals")
      .select("daily_questions, weekly_questions, target_specialty_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("specialties").select("id, name").order("order_index"),
  ]);

  const emailIdentity = user.email?.split("@")[0] ?? "Étudiant";
  const fullName = profile?.full_name?.trim() || emailIdentity;
  const initials = initialsFrom(fullName) || "ÉT";
  const isPro = profile?.plan === "pro";
  const avatarUrl = profileAvatarUrl(user.id, profile);
  const levelProgress = (profile?.xp ?? 0) % 100;
  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat("fr-CH", { month: "long", year: "numeric", timeZone: "Europe/Zurich" }).format(new Date(profile.created_at))
    : null;

  return (
    <main className="page-enter mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pt-10">
      <header className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-9 lg:px-11">
        <div className="absolute -right-16 -top-24 size-72 rounded-full bg-teal-400/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 left-1/3 size-64 rounded-full bg-sky-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <span
            aria-label={avatarUrl ? `Photo de profil de ${fullName}` : `Initiales de ${fullName}`}
            className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-teal-300 to-teal-700 bg-cover bg-center text-2xl font-extrabold text-white ring-4 ring-white/15 sm:size-28 sm:text-3xl"
            role="img"
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
          >
            {!avatarUrl && initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[.17em] text-teal-300">Profil étudiant</p>
            <h1 className="m-0 truncate !text-4xl !leading-none !text-white sm:!text-5xl">{fullName}</h1>
            <p className="mb-0 mt-3 truncate text-sm text-slate-300">{user.email}</p>
            {memberSince && <p className="mb-0 mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400"><CalendarDays size={13} /> Membre depuis {memberSince}</p>}
          </div>
          <span className={`self-start rounded-full px-4 py-2 text-xs font-extrabold ${isPro ? "bg-teal-300 text-slate-950" : "bg-white/10 text-slate-200"}`}>
            {isPro ? BRAND_PRO_PLAN : "Plan gratuit"}
          </span>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Star, value: profile?.xp ?? 0, label: "XP total", tone: "bg-amber-50 text-amber-700" },
          { icon: Gauge, value: profile?.level ?? 1, label: "Niveau", tone: "bg-sky-50 text-sky-700" },
          { icon: Flame, value: profile?.streak ?? 0, label: "Jours de série", tone: "bg-orange-50 text-orange-700" },
          { icon: Award, value: (badges as BadgeRelation[] | null)?.length ?? 0, label: "Badges", tone: "bg-violet-50 text-violet-700" },
        ].map(({ icon: Icon, value, label, tone }) => (
          <article className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" key={label}>
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span>
            <div><strong className="block text-xl sm:text-2xl">{value}</strong><span className="text-xs text-slate-500">{label}</span></div>
          </article>
        ))}
      </section>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <ProfileSettings
          avatarUrl={avatarUrl}
          dailyQuestions={learningGoal?.daily_questions ?? 10}
          email={user.email ?? ""}
          fullName={fullName}
          specialties={(specialties ?? []).map((specialty) => ({ id: specialty.id, name: specialty.name }))}
          targetSpecialtyId={learningGoal?.target_specialty_id ?? null}
          weeklyQuestions={learningGoal?.weekly_questions ?? 50}
        />

        <aside className="grid gap-5">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div><p className="m-0 text-xs font-extrabold uppercase tracking-[.14em] text-teal-700">Progression</p><h2 className="mb-0 mt-1 !text-xl">Niveau {profile?.level ?? 1}</h2></div>
              <span className="grid size-11 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Sparkles size={20} /></span>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-500"><span>{levelProgress} XP gagnés</span><span>{100 - levelProgress} XP restants</span></div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-300" style={{ width: `${levelProgress}%` }} /></div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="m-0 text-xs font-extrabold uppercase tracking-[.14em] text-violet-700">Badges</p>
            <h2 className="mb-0 mt-1 !text-xl">Tes accomplissements</h2>
            {(badges as BadgeRelation[] | null)?.length ? (
              <div className="mt-5 grid gap-3">
                {(badges as BadgeRelation[]).map((item) => ({ item, badge: badgeOf(item) })).filter(({ badge }) => badge).slice(0, 4).map(({ item, badge }) => {
                  return (
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3" key={badge?.id ?? item.awarded_at}>
                      <span className="grid size-9 place-items-center rounded-full bg-violet-100">{badge?.icon ?? "✦"}</span>
                      <div className="min-w-0"><strong className="block truncate text-sm">{badge?.name}</strong><span className="block truncate text-xs text-slate-500">{badge?.description}</span></div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="mb-0 mt-4 text-sm leading-6 text-slate-500">Termine ta première activité pour débloquer un badge.</p>}
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="m-0 text-xs font-extrabold uppercase tracking-[.14em] text-amber-700">Abonnement</p>
            <h2 className="mb-0 mt-1 !text-xl">{isPro ? BRAND_PRO_PLAN : "Découverte"}</h2>
            <p className="mb-0 mt-3 text-sm leading-6 text-slate-500">
              {subscription?.current_period_end
                ? `Prochaine échéance : ${new Date(subscription.current_period_end).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" })}`
                : "Passe à Pro pour débloquer l’entraînement complet."}
            </p>
            <BillingActions hasCustomer={Boolean(profile?.stripe_customer_id)} isPro={isPro} />
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><ShieldCheck size={19} /></span>
            <h2 className="mb-0 mt-4 !text-xl">Compte et sécurité</h2>
            <p className="mb-5 mt-2 text-sm leading-6 text-slate-500">Ta photo est privée et tes données de progression restent liées à ton compte.</p>
            <form action="/auth/signout" method="post">
              <button className="inline-flex min-h-10 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-rose-700" type="submit"><LogOut size={17} /> Se déconnecter</button>
            </form>
            <DeleteAccountButton />
          </section>
        </aside>
      </div>
    </main>
  );
}
