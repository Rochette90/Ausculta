"use client";

import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "medtrain-theme";

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  return (
    <button className="theme-toggle" onClick={toggleTheme} title="Changer le thème" type="button">
      <Sun aria-hidden="true" className="theme-icon theme-icon-light" size={17} />
      <Moon aria-hidden="true" className="theme-icon theme-icon-dark" size={17} />
      <span className="sr-only">Basculer entre le mode clair et le mode nuit</span>
    </button>
  );
}
