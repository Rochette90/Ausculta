"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../theme/ThemeToggle";
import { cn } from "../../lib/utils";
import { Button, buttonVariants } from "./button";
import { MenuToggleIcon } from "./menu-toggle-icon";
import { useScroll } from "./use-scroll";
import { BrandLogo } from "../brand/BrandLogo";
import { BRAND_NAME } from "@/lib/brand";

const links = [
  { label: "Méthode", href: "/methode" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Tarifs", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

export function Header({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const scrolled = useScroll(12);
  // « Mon espace » suppose un compte : réservé à une session authentifiée.
  const accountHref = signedIn ? "/dashboard" : "/login";
  const accountLabel = signedIn ? "Mon espace" : "Se connecter";

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
    <header
      className={cn(
        "sticky z-50 mx-auto w-full border transition-all duration-300 ease-out",
        open
          ? "top-0 border-transparent bg-[var(--surface)]"
          : scrolled
            ? "top-3 w-[calc(100%-2rem)] max-w-[1040px] rounded-2xl border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] shadow-[var(--shadow-md)] backdrop-blur-xl"
            : "top-0 border-x-0 border-t-0 border-b-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] backdrop-blur-xl",
      )}
    >
      <nav className={cn("mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-4 transition-all sm:px-6", scrolled && !open && "h-16 max-w-[1040px]")} aria-label="Navigation principale">
        <Link className="logo no-underline" href="/" aria-label={`Accueil ${BRAND_NAME}`} onClick={closeMenu}>
          <BrandLogo priority />
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-2.5 text-[var(--muted)] no-underline hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]")}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link className={cn(buttonVariants({ size: "sm" }), "ml-1 min-h-10 bg-[var(--primary)] px-4 text-white no-underline hover:bg-[var(--primary-hover)]")} href={accountHref}>
            {accountLabel} <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Button
            aria-controls="marketing-mobile-menu"
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            onClick={() => setOpen((current) => !current)}
            size="icon"
            type="button"
            variant="outline"
          >
            <MenuToggleIcon aria-hidden="true" className="size-5" open={open} />
          </Button>
        </div>
      </nav>

      <div
        className={cn(
          "absolute inset-x-0 top-full z-50 h-[calc(100dvh-72px)] border-t border-[var(--line)] bg-[var(--surface)] lg:hidden",
          open ? "block" : "hidden",
        )}
        id="marketing-mobile-menu"
      >
        <div className="flex h-full flex-col justify-between p-5">
          <div className="grid gap-2">
            {links.map((link) => (
              <Link
                key={link.label}
                className="rounded-xl px-4 py-4 text-lg font-semibold text-[var(--ink)] no-underline hover:bg-[var(--surface-subtle)]"
                href={link.href}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link className="mb-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white no-underline" href={accountHref} onClick={closeMenu}>
            {accountLabel} <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
