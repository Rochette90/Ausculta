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
import { getEcosProgress } from "@/lib/ecos/progress";
import { levelFromXp } from "@/lib/progress/levels";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Profil") };


export default async function ProfilPage() {
  const user = await requireUser("/profil");
  const supabase = await createClient();
  const [
    profile,
    { data: subscription },
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
  const level = levelFromXp(profile?.xp ?? 0);
  // Jalons recalculés depuis les stations terminées ; leur échec ne bloque pas le profil.
  const progress = FEATURES.ecos ? await getEcosProgress(user.id).catch(() => null) : null;
  const reached = progress?.milestones.filter((item) => item.done).length ?? 0;
  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat("fr-CH", { month: "long", year: "numeric", timeZone: "Europe/Zurich" }).format(new Date(profile.created_at))
    : null;

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
        <div><dt>Niveau</dt><dd>{level.level}<small>{level.current} / {level.needed} XP</small></dd></div>
        <div><dt>Stations différentes</dt><dd>{progress ? Object.keys(progress.best).length : 0}</dd></div>
        <div><dt>Jalons</dt><dd>{reached}<small>/ {progress?.milestones.length ?? 0}</small></dd></div>
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
          {progress && (
            <section aria-labelledby="milestones-title">
              <h2 id="milestones-title">Jalons</h2>
              <ul className="profile-badges profile-milestones">
                {progress.milestones.map((item) => (
                  <li className={item.done ? "is-done" : ""} key={item.id}>
                    <span aria-hidden="true">{item.done ? "✓" : `${item.progress}/${item.target}`}</span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </li>
                ))}
              </ul>
            </section>
          )}

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
