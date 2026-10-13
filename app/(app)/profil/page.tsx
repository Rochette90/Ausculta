import Link from "next/link";
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
import { ecosUsageToday, type QuotaUsage } from "@/lib/ecos/usage";
import { levelFromXp } from "@/lib/progress/levels";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Profil") };

/**
 * Profil : une colonne de sections au même gabarit (progression, infos,
 * offre, sécurité, zone sensible), lisible du haut en bas.
 */
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
  const planName = isPro ? BRAND_PRO_PLAN : "Découverte";
  const hasCustomer = Boolean(profile?.stripe_customer_id);
  // Compteurs du jour ; leur échec ne bloque pas le profil.
  const usage = FEATURES.ecos ? await ecosUsageToday(user.id, profile?.plan).catch(() => null) : null;
  // L'offre ne s'affiche que lorsqu'elle a un sens : Premium en vente, ou compte déjà client.
  const showOffer = premiumOnSale() || hasCustomer || isPro;
    const avatarUrl = profileAvatarUrl(user.id, profile);
  const xp = profile?.xp ?? 0;
  const level = levelFromXp(xp);
  // Jalons recalculés depuis les stations terminées ; leur échec ne bloque pas le profil.
  const progress = FEATURES.ecos ? await getEcosProgress(user.id).catch(() => null) : null;
  const reached = progress?.milestones.filter((item) => item.done).length ?? 0;
  const stations = progress ? Object.keys(progress.best).length : 0;
  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat("fr-CH", { month: "long", year: "numeric", timeZone: "Europe/Zurich" }).format(new Date(profile.created_at))
    : null;

  return (
    <main className="learning-page profile-page">
      <header className="profile-hero">
        <span
          aria-label={avatarUrl ? `Photo de profil de ${fullName}` : `Initiales de ${fullName}`}
          className="profile-head-avatar"
          role="img"
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        >
          {!avatarUrl && initials}
        </span>
        <div className="profile-hero-text">
          <h1>{fullName}</h1>
          <p>{user.email}{memberSince ? ` · membre depuis ${memberSince}` : ""}</p>
          <div className="profile-level" aria-label={`Niveau ${level.level}, ${level.current} XP sur ${level.needed} pour le suivant`}>
            <span className="profile-level-badge">Niveau {level.level}</span>
            <span className="profile-level-bar" aria-hidden="true"><span style={{ width: `${level.percentage}%` }} /></span>
            <span className="profile-level-xp">{level.current} / {level.needed} XP</span>
          </div>
        </div>
        {showOffer && <span className={`profile-plan${isPro ? " is-pro" : ""}`}>{planName}</span>}
      </header>

      <nav className="profile-tabs" aria-label="Sections du profil">
        <a href="#progression">Progression</a>
        <a href="#infos">Informations</a>
        {showOffer && <a href="#offre">Offre</a>}
        <a href="#securite">Sécurité</a>
      </nav>

      <section className="profile-card" id="progression" aria-labelledby="progression-title">
        <div className="profile-card-head">
          <div>
            <h2 id="progression-title">Ta progression</h2>
            <p>Calculée à partir de tes stations terminées.</p>
          </div>
          <Link className="button secondary small" href="/historique">Mes bilans</Link>
        </div>
        <dl className="profile-stats">
          <div><dt>XP total</dt><dd>{xp.toLocaleString("fr-CH")}</dd></div>
          <div><dt>Stations différentes</dt><dd>{stations}</dd></div>
          <div><dt>Jalons atteints</dt><dd>{reached}<small> / {progress?.milestones.length ?? 0}</small></dd></div>
        </dl>
        {usage && (
          <div className="profile-today" aria-label="Ta consommation du jour">
            <div className="profile-today-head">
              <strong>Aujourd’hui</strong>
              <span>Remise à zéro à {usage.resetsAt.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich" })}</span>
            </div>
            <UsageBar label="Stations" usage={usage.sessions} />
            {/* Questions et voix : affichées seulement quand elles approchent de leur limite. */}
            {nearLimit(usage.messages) && <UsageBar label="Questions au patient" usage={usage.messages} />}
            {nearLimit(usage.voice) && <UsageBar label="Voix réaliste du patient" usage={usage.voice} hint="Au-delà, la voix du navigateur prend le relais." />}
          </div>
        )}
        {progress && (
          <ul className="profile-milestones">
            {progress.milestones.map((item) => (
              <li className={item.done ? "is-done" : ""} key={item.id}>
                <div className="profile-milestone-top">
                  <strong>{item.label}</strong>
                  <span>{item.done ? "Atteint" : `${item.progress}/${item.target}`}</span>
                </div>
                <small>{item.description}</small>
                <span className="profile-milestone-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.round((item.progress / item.target) * 100))}%` }} /></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProfileSettings
        avatarUrl={avatarUrl}
        dailyQuestions={learningGoal?.daily_questions ?? 10}
        email={user.email ?? ""}
        fullName={fullName}
        specialties={(specialties ?? []).map((specialty) => ({ id: specialty.id, name: specialty.name }))}
        targetSpecialtyId={learningGoal?.target_specialty_id ?? null}
        weeklyQuestions={learningGoal?.weekly_questions ?? 50}
      />

      {/* Offre : seulement quand Premium est en vente, ou pour un compte déjà client Stripe. */}
      {showOffer && (
        <section className="profile-card" id="offre" aria-labelledby="plan-title">
          <h2 id="plan-title">Ton offre : {planName}</h2>
          {subscription?.current_period_end && <p>Prochaine échéance : {new Date(subscription.current_period_end).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" })}.</p>}
          <BillingActions hasCustomer={hasCustomer} isPro={isPro} canSubscribe={premiumOnSale()} />
        </section>
      )}

      <section className="profile-card" id="securite" aria-labelledby="account-title">
        <div className="profile-card-head">
          <div>
            <h2 id="account-title">Sécurité</h2>
            <p>Change ton mot de passe ; tes autres appareils seront déconnectés.</p>
          </div>
        </div>
        <ChangePasswordForm />
      </section>

      <section className="profile-card is-danger" aria-labelledby="danger-title">
        <h2 id="danger-title">Session et compte</h2>
        <div className="profile-danger-row">
          <div>
            <strong>Se déconnecter</strong>
            <p>Ferme ta session sur cet appareil.</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="button secondary small" type="submit"><LogOut aria-hidden="true" size={16} /> Se déconnecter</button>
          </form>
        </div>
        <div className="profile-danger-row">
          <div>
            <strong>Supprimer mon compte</strong>
            <p>Ta progression, tes bilans et ton abonnement sont effacés définitivement.</p>
          </div>
          <DeleteAccountButton />
        </div>
      </section>
    </main>
  );
}

/** Quotas secondaires : montrés à partir de 70 % de la limite. */
function nearLimit({ used, limit }: QuotaUsage) {
  return used >= limit * 0.7;
}

function UsageBar({ label, usage, hint }: { label: string; usage: QuotaUsage; hint?: string }) {
  const full = usage.used >= usage.limit;
  return (
    <div className={`profile-usage${full ? " is-full" : ""}`}>
      <div className="profile-usage-top">
        <span>{label}</span>
        <b>{usage.used.toLocaleString("fr-CH")} sur {usage.limit.toLocaleString("fr-CH")}</b>
      </div>
      <span className="profile-usage-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100))}%` }} /></span>
      {full ? <small>Limite atteinte pour aujourd’hui.</small> : hint && <small>{hint}</small>}
    </div>
  );
}
