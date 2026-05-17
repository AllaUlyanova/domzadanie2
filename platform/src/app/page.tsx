import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { KidButton } from "@/components/ui/KidButton";
import { SUBJECTS_UI } from "@/lib/constants";
import { SubjectCard } from "@/components/ui/SubjectCard";

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8">
        <section className="kid-card mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-600">3 класс · Россия · 2026</p>
          <h1 className="kid-heading mt-2">Умная проверка домашки</h1>
          <p className="mx-auto mt-3 max-w-lg text-lg font-semibold text-slate-600 dark:text-slate-300">
            Выбираешь предмет и урок — решаешь все задания — Пушок проверяет и объясняет ошибки
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/learn">
              <KidButton type="button">Начать урок</KidButton>
            </Link>
            <Link href="/demo">
              <KidButton type="button" variant="ghost">
                Демо проверки
              </KidButton>
            </Link>
          </div>
        </section>

        <h2 className="mb-4 text-xl font-extrabold">Предметы</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS_UI.map((s) => (
            <SubjectCard
              key={s.slug}
              href={`/learn/${s.slug.toLowerCase()}`}
              name={s.name}
              icon={s.icon}
              gradient={s.color}
              meta="Учебники РФ"
            />
          ))}
        </div>
      </main>
    </>
  );
}
