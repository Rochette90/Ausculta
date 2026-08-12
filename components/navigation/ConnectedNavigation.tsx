"use client";

import { BookOpen, CircleUserRound, ClipboardCheck, Home, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "../theme/ThemeToggle";

const items = [
  { href: "/dashboard", label: "Tableau de bord", shortLabel: "Accueil", icon: Home },
  { href: "/specialties", label: "Spécialités", shortLabel: "Fiches", icon: BookOpen },
  { href: "/quiz", label: "Quiz", shortLabel: "Quiz", icon: ClipboardCheck },
  { href: "/cas", label: "Cas cliniques", shortLabel: "Cas", icon: Stethoscope },
  { href: "/profil", label: "Profil", shortLabel: "Profil", icon: CircleUserRound },
];

export function ConnectedNavigation({ initials, streak, isAdmin = false }: { initials: string; streak: number; isAdmin?: boolean }) {
  const pathname = usePathname();
  const navigationItems = isAdmin ? [...items, { href: "/admin/pathologies", label: "Admin", shortLabel: "Admin", icon: ShieldCheck }] : items;
  const isActive = (href: string) => pathname === href
    || (href === "/specialties" && (pathname.startsWith("/specialties/") || pathname.startsWith("/pathologies/")))
    || (href === "/admin/pathologies" && pathname.startsWith("/admin/"));
  return (
    <>
      <header className="topbar">
        <Link className="logo" href="/dashboard" aria-label="MedTrain — Tableau de bord"><span className="logo-mark">M</span><span>MedTrain</span></Link>
        <nav className="desktop-nav" aria-label="Navigation principale">
          {navigationItems.map((item) => <Link className={isActive(item.href) ? "nav-active" : ""} href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <div className="profile-chip">
          <ThemeToggle />
          <span className="streak" aria-label={`${streak} jours de série`}>🔥 {streak}</span>
          <Link className="avatar" href="/profil" aria-label="Ouvrir le profil">{initials || "ÉT"}</Link>
          <form action="/auth/signout" method="post"><button className="signout-button">Déconnexion</button></form>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Navigation mobile">
        {navigationItems.map(({ href, shortLabel, icon: Icon }) => <Link className={isActive(href) ? "active" : ""} href={href} key={href}><Icon aria-hidden="true" size={18} /><span>{shortLabel}</span></Link>)}
      </nav>
    </>
  );
}
