"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";
import { KidButton } from "@/components/ui/KidButton";

export function AppHeader() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-extrabold">
          <span className="text-2xl" aria-hidden>
            📚
          </span>
          <span className="hidden sm:inline">Школьный день AI</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-bold">
          <Link href="/learn" className="rounded-full px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            Уроки
          </Link>
          <Link href="/parent" className="rounded-full px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            Родителям
          </Link>
          <button
            type="button"
            onClick={toggle}
            className="rounded-full px-3 py-2 text-lg"
            aria-label="Тема"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <Link
            href="/login"
            className="inline-flex min-h-[48px] items-center rounded-kid border-2 border-slate-300 bg-white/80 px-5 text-base font-bold dark:bg-slate-700"
          >
            Войти
          </Link>
        </nav>
      </div>
    </header>
  );
}
