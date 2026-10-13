import { initialsFrom, profileAvatarUrl } from "@/lib/profile/presentation";
import { LogOut } from "lucide-react";
import { BillingActions } from "@/components/profile/BillingActions";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountButton } from "@/components/profile/DeleteAccountButton";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { requireUser } from "@/lib/auth/require-user";
import { getProfileSummary } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { BRAND_PRO_PLAN, pageTitle } from "@/lib/brand";
import { FEATURES, premiumOnSale } from "@/lib/features";

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
  const hasCustomer = Boolean(profile?.stripe_customer_id);
  const avatarUrl = profileAvatarUrl(user.id, profile);
  const levelProgress = (profile?.xp ?? 0) % 100;
  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat("fr-CH", { month: "long", year: "numeric", timeZone: "Europe/Zurich" }).format(new Date(profile.created_at))
    : null;

  const badgeList = ((badges as BadgeRelation[] | null) ?? []).map((item) => ({ item, badge: badgeOf(item) })).filter(({ badge }) => badge);

  return (
    <main className="learning-page">
      <header className="profile-head">
        <span
          aria-label={avatarUrl ? `Photo de profil de ${fullName}` : `Initiales de ${fullName}`}
          className="profile-head-avatar"
          role="img"
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        >
          {!avatarUrl && initials}
        </span>
        <div className="min-w-0">
          <h1>{fullName}</h1>
          <p>{user.email}{memberSince ? `, membre depuis ${memberSince}` : ""}</p>
        </div>
        {(FEATURES.premium || isPro) && <span className={`profile-plan${isPro ? " is-pro" : ""}`}>{isPro ? BRAND_PRO_PLAN : "Plan gratuit"}</span>}
      </header>

      <dl className="dash-stats" aria-label="Ta progression">
        <div><dt>XP total</dt><dd>{(profile?.xp ?? 0).toLocaleString("fr-CH")}</dd></div>
        <div><dt>Niveau</dt><dd>{profile?.level ?? 1}<small>{levelProgress} / 100 XP</small></dd></div>
        <div><dt>Série</dt><dd>{profile?.streak ?? 0}<small>{(profile?.streak ?? 0) > 1 ? "jours" : "jour"}</small></dd></div>
        <div><dt>Badges</dt><dd>{badgeList.length}</dd></div>
      </dl>

      <div className="profile-columns">
        <ProfileSettings
          avatarUrl={avatarUrl}
          dailyQuestions={learningGoal?.daily_questions ?? 10}
          email={user.email ?? ""}
          fullName={fullName}
          specialties={(specialties ?? []).map((specialty) => ({ id: specialty.id, name: specialty.name }))}
          targetSpecialtyId={learningGoal?.target_specialty_id ?? null}
          weeklyQuestions={learningGoal?.weekly_questions ?? 50}
        />

        <aside className="profile-side">
          <section aria-labelledby="badges-title">
            <h2 id="badges-title">Badges</h2>
            {badgeList.length ? (
              <ul className="profile-badges">
                {badgeList.slice(0, 4).map(({ item, badge }) => (
                  <li key={badge?.id ?? item.awarded_at}>
                    <span aria-hidden="true">{badge?.icon ?? "✦"}</span>
                    <strong>{badge?.name}</strong>
                    <small>{badge?.description}</small>
                  </li>
                ))}
              </ul>
            ) : <p>Termine ta première station pour débloquer un badge.</p>}
          </section>

          {/* Formule payante masquée : la section ne reste que pour un compte déjà client Stripe. */}
          {(FEATURES.premium || hasCustomer) && <section aria-labelledby="plan-title">
            <h2 id="plan-title">Abonnement : {isPro ? BRAND_PRO_PLAN : "Découverte"}</h2>
            <p>
              {subscription?.current_period_end
                ? `Prochaine échéance : ${new Date(subscription.current_period_end).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" })}`
                : "Tout est gratuit pour l’instant."}
            </p>
            <BillingActions hasCustomer={hasCustomer} isPro={isPro} canSubscribe={premiumOnSale()} />
          </section>}

          <section aria-labelledby="account-title">
            <h2 id="account-title">Compte et sécurité</h2>
            <p>Ta photo est privée et tes données de progression restent liées à ton compte.</p>
            <ChangePasswordForm />
            <div className="my-6 h-px bg-[var(--line)]" />
            <div className="profile-actions">
              <form action="/auth/signout" method="post">
                <button className="danger-link is-neutral" type="submit"><LogOut aria-hidden="true" size={17} /> Se déconnecter</button>
              </form>
              <DeleteAccountButton />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
