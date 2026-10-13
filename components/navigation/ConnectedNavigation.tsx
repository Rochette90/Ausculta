"use client";

import { Bone, BookOpen, BookOpenText, ClipboardCheck, Home, ListChecks, ShieldCheck, Stethoscope, TimerReset } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BRAND_NAME } from "@/lib/brand";
import { FEATURES, type FeatureKey } from "@/lib/features";

// Chaque entrée dépend d'un module : un module masqué (lib/features.ts)
// disparaît de la navigation. Après l'accueil : la théorie, puis les stations ECOS, puis les grilles.
const allItems: Array<{ href: string; label: string; shortLabel: string; icon: typeof Home; feature?: FeatureKey }> = [
  { href: "/dashboard", label: "Accueil", shortLabel: "Accueil", icon: Home },
  { href: "/theorie", label: "Théorie", shortLabel: "Théorie", icon: BookOpenText, feature: "theorie" },
  { href: "/cas", label: "Stations ECOS", shortLabel: "Stations", icon: Stethoscope, feature: "ecos" },
  { href: "/grilles", label: "Grilles ECOS", shortLabel: "Grilles", icon: ListChecks, feature: "grilles" },
  { href: "/specialties", label: "Fiches", shortLabel: "Fiches", icon: BookOpen, feature: "fiches" },
  { href: "/anatomie", label: "Anatomie", shortLabel: "Anatomie", icon: Bone, feature: "anatomy" },
  { href: "/quiz", label: "QCM", shortLabel: "QCM", icon: ClipboardCheck, feature: "quiz" },
  { href: "/sessions", label: "Séances", shortLabel: "Séances", icon: TimerReset, feature: "sessions" },
];
const items = allItems.filter((item) => !item.feature || FEATURES[item.feature]);

export function ConnectedNavigation({ avatarUrl, initials, streak, isAdmin = false }: { avatarUrl?: string | null; initials: string; streak: number; isAdmin?: boolean }) {
  const pathname = usePathname();
  const navigationItems = isAdmin
    ? [...items, { href: "/admin/pathologies", label: "Admin", shortLabel: "Admin", icon: ShieldCheck }]
    : items;
  const isActive = (href: string) => pathname === href
    || pathname.startsWith(`${href}/`)
    || (href === "/specialties" && (pathname.startsWith("/specialties/") || pathname.startsWith("/pathologies/") || pathname === "/fiches"))
    // Catalogue masqué : une fiche s'ouvre depuis le débriefing d'une station.
    || (href === "/cas" && !FEATURES.fiches && pathname.startsWith("/pathologies/"))
    || (href === "/admin/pathologies" && pathname.startsWith("/admin/"));
  return (
    <>
      <a className="skip-learning" href="#learning-content">Aller au contenu</a>
      <header className="topbar">
        <Link className="logo" href="/dashboard" aria-label={`${BRAND_NAME} — Accueil`}><BrandLogo priority /></Link>
        <nav className="desktop-nav" aria-label="Navigation principale">
          {navigationItems.map((item) => <Link aria-current={isActive(item.href) ? "page" : undefined} className={isActive(item.href) ? "nav-active" : ""} href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <div className="profile-chip">
          {streak > 0 && <span className="streak">Série : <strong>{streak} j</strong></span>}
          <ThemeToggle />
          <Link
            className="avatar"
            href="/profil"
            aria-label="Ouvrir le profil"
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
          >
            {!avatarUrl && (initials || "ÉT")}
          </Link>
          <form action="/auth/signout" method="post"><button className="signout-button">Se déconnecter</button></form>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Navigation mobile">
        {navigationItems.map(({ href, shortLabel, icon: Icon }) => <Link aria-current={isActive(href) ? "page" : undefined} className={isActive(href) ? "active" : ""} href={href} key={href}><Icon aria-hidden="true" size={19} /><span>{shortLabel}</span></Link>)}
        <Link aria-current={pathname === "/profil" ? "page" : undefined} className={pathname === "/profil" ? "active" : ""} href="/profil"><span className="mobile-nav-avatar" aria-hidden="true" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}>{!avatarUrl && (initials || "ÉT")}</span><span>Profil</span></Link>
      </nav>
    </>
  );
}
