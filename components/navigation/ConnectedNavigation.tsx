"use client";

import { Bone, BookOpen, ClipboardCheck, Home, ShieldCheck, Stethoscope, TimerReset } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "../brand/BrandLogo";
import { ThemeToggle } from "../theme/ThemeToggle";
import { BRAND_NAME } from "@/lib/brand";

const items = [
  { href: "/dashboard", label: "Accueil", shortLabel: "Accueil", icon: Home },
  { href: "/specialties", label: "Fiches", shortLabel: "Fiches", icon: BookOpen },
  { href: "/anatomie", label: "Anatomie", shortLabel: "Anatomie", icon: Bone },
  { href: "/quiz", label: "QCM", shortLabel: "QCM", icon: ClipboardCheck },
  { href: "/sessions", label: "Séances", shortLabel: "Séances", icon: TimerReset },
  { href: "/cas", label: "Cas cliniques", shortLabel: "Cas", icon: Stethoscope },
];

export function ConnectedNavigation({ avatarUrl, initials, streak, isAdmin = false }: { avatarUrl?: string | null; initials: string; streak: number; isAdmin?: boolean }) {
  const pathname = usePathname();
  const navigationItems = isAdmin
    ? [...items, { href: "/admin/pathologies", label: "Admin", shortLabel: "Admin", icon: ShieldCheck }]
    : items;
  const isActive = (href: string) => pathname === href
    || pathname.startsWith(`${href}/`)
    || (href === "/specialties" && (pathname.startsWith("/specialties/") || pathname.startsWith("/pathologies/") || pathname === "/fiches"))
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
          <ThemeToggle />
          <span className="streak" aria-label={`${streak} jours de série`}>🔥 {streak}</span>
          <Link
            className="avatar overflow-hidden bg-cover bg-center"
            href="/profil"
            aria-label="Ouvrir le profil"
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
          >
            {!avatarUrl && (initials || "ÉT")}
          </Link>
          <form action="/auth/signout" method="post"><button className="signout-button">Déconnexion</button></form>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Navigation mobile">
        {navigationItems.map(({ href, shortLabel, icon: Icon }) => <Link aria-current={isActive(href) ? "page" : undefined} className={isActive(href) ? "active" : ""} href={href} key={href}><Icon aria-hidden="true" size={18} /><span>{shortLabel}</span></Link>)}
      </nav>
    </>
  );
}
