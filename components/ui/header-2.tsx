"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "./menu-toggle-icon";
import { useScroll } from "./use-scroll";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BRAND_NAME } from "@/lib/brand";
import { FEATURES, type FeatureKey } from "@/lib/features";

// Une entrée liée à un module masqué (lib/features.ts) disparaît du menu.
const allLinks: Array<{ label: string; href: string; feature?: FeatureKey }> = [
  { label: "Méthode", href: "/methode" },
  { label: "Catalogue", href: "/catalogue", feature: "fiches" },
  { label: "Tarifs", href: "/pricing", feature: "premium" },
  { label: "FAQ", href: "/faq" },
  { label: "À propos", href: "/a-propos" },
];
const links = allLinks.filter((link) => !link.feature || FEATURES[link.feature]);

export function Header({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const scrolled = useScroll(8);
  const pathname = usePathname();
  // « Mon espace » suppose un compte : réservé à une session authentifiée.
  const startHref = signedIn ? "/dashboard" : "/signup?next=%2Fcas";
  const startLabel = signedIn ? "Mon espace" : "Commencer";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className={cn("site-header", scrolled && "is-scrolled", open && "is-open")}>
      <div className="mk-wrap site-header-inner">
        <Link className="logo" href="/" aria-label={`Accueil ${BRAND_NAME}`} onClick={closeMenu}>
          <BrandLogo priority />
        </Link>

        <nav className="site-nav" aria-label="Navigation principale">
          {links.map((link) => (
            <Link aria-current={pathname === link.href ? "page" : undefined} href={link.href} key={link.href}>{link.label}</Link>
          ))}
        </nav>

        <div className="site-header-actions">
          <ThemeToggle />
          {!signedIn && <Link className="site-header-signin" href="/login">Se connecter</Link>}
          <Link className="button primary small" href={startHref}>{startLabel}</Link>
          <button
            aria-controls="site-menu"
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="site-menu-button"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <MenuToggleIcon aria-hidden="true" className="size-5" open={open} />
          </button>
        </div>
      </div>

      <div className={cn("site-menu", open && "is-open")} id="site-menu" hidden={!open}>
        <nav aria-label="Navigation mobile">
          {links.map((link) => (
            <Link href={link.href} key={link.href} onClick={closeMenu}>{link.label}</Link>
          ))}
        </nav>
        <div className="site-menu-actions">
          <Link className="button primary full" href={startHref} onClick={closeMenu}>{signedIn ? "Ouvrir mon espace" : "Créer un compte gratuit"}</Link>
          {!signedIn && <Link className="button secondary full" href="/login" onClick={closeMenu}>Se connecter</Link>}
        </div>
      </div>
    </header>
  );
}
