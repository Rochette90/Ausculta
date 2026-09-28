"use client";

import { useEffect } from "react";
import { THEME_STORAGE_KEY } from "@/lib/brand";

export function ThemeInitializer() {
  useEffect(() => {
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
