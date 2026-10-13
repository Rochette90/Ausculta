"use client";

import { useLayoutEffect } from "react";
import { THEME_STORAGE_KEY } from "@/lib/brand";

export function ThemeInitializer() {
  // Avant la première peinture qui suit l'hydratation : le thème enregistré
  // remplace le thème clair du serveur sans flash visible sur connexion rapide.
  // (Un script synchrone dans le <head> irait plus tôt, mais la CSP à nonce
  // le bloquerait sur les pages statiques.)
  useLayoutEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.dataset.theme = storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : preferredTheme;
    } catch {
      document.documentElement.dataset.theme = "light";
    }
  }, []);

  return null;
}
