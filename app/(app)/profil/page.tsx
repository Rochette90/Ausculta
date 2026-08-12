import { BillingActions } from "../../../components/profile/BillingActions";
import { requireUser, userPresentation } from "../../../lib/auth/require-user";
import { getProfileSummary } from "../../../lib/profile/queries";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil — MedTrain" };

type BadgeRelation = { awarded_at: string; badges: Array<{ name: string; description: string | null; icon: string | null }> | null };

export default async function ProfilPage() {
  const user = await requireUser("/profil");
  const supabase = await createClient();
  const [profile, { data: subscription }, { data: badges }] = await Promise.all([
    getProfileSummary(user.id),
    supabase.from("subscriptions").select("status, current_period_end, cancel_at_period_end").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("user_badges").select("awarded_at, badges(name, description, icon)").eq("user_id", user.id).order("awarded_at", { ascending: false }),
  ]);
  const presentation = userPresentation(user);
  const isPro = profile?.plan === "pro";

  return (
    <main className="profile-page">
      <section className="profile-hero"><span className="profile-avatar">{presentation.initials}</span><div><p className="eyebrow">PROFIL ÉTUDIANT</p><h1>{profile?.full_name ?? user.email?.split("@")[0]}</h1><p>{user.email}</p></div><span className={`plan-tag ${isPro ? "pro" : ""}`}>{isPro ? "MedTrain Pro" : "Plan gratuit"}</span></section>
      <section className="profile-stats"><article><strong>{profile?.xp ?? 0}</strong><span>XP total</span></article><article><strong>{profile?.level ?? 1}</strong><span>Niveau</span></article><article><strong>{profile?.streak ?? 0}</strong><span>Jours de série</span></article><article><strong>{(badges as BadgeRelation[] | null)?.length ?? 0}</strong><span>Badges</span></article></section>
      <section className="profile-grid"><article className="profile-card"><p className="eyebrow">BADGES</p><h2>Vos accomplissements</h2>{(badges as BadgeRelation[] | null)?.length ? <div className="badge-list">{(badges as BadgeRelation[]).map((item) => { const badge = item.badges?.[0]; return <div key={`${badge?.name}-${item.awarded_at}`}><span>{badge?.icon ?? "✦"}</span><p><strong>{badge?.name}</strong><small>{badge?.description}</small></p></div>; })}</div> : <p className="empty-state">Terminez votre première activité pour débloquer un badge.</p>}</article><article className="profile-card"><p className="eyebrow">ABONNEMENT</p><h2>{isPro ? "MedTrain Pro" : "Découverte"}</h2><p>{subscription?.current_period_end ? `Prochaine échéance : ${new Date(subscription.current_period_end).toLocaleDateString("fr-CH")}` : "Passez à Pro pour débloquer l’entraînement complet."}</p><BillingActions hasCustomer={Boolean(profile?.stripe_customer_id)} isPro={isPro} /></article></section>
      <form action="/auth/signout" method="post"><button className="button secondary">Se déconnecter</button></form>
    </main>
  );
}
