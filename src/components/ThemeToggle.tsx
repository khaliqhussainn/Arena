"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "arena_theme";

export function ThemeToggle() {
  // Default matches the CSS default (light) so the very first client
  // render before this effect runs matches the server-rendered markup —
  // the effect below corrects it to the real resolved theme immediately
  // after mount, same pattern used for localStorage-derived state elsewhere
  // in this app.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center border border-border bg-surface text-base shadow-none transition-transform duration-150 ease-out hover:border-accent active:scale-90"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
