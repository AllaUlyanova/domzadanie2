import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { SUBJECTS_UI } from "@/lib/constants";
import { SubjectCard } from "@/components/ui/SubjectCard";

export default function LearnPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8">
        <h1 className="kid-heading">Выбери предмет</h1>
        <p className="mt-2 text-lg font-semibold text-slate-600">Потом — учебник, урок и все задания</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SUBJECTS_UI.map((s) => (
            <SubjectCard
              key={s.slug}
              href={`/learn/${s.slug.toLowerCase()}`}
              name={s.name}
              icon={s.icon}
              gradient={s.color}
            />
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/" className="font-bold text-brand-600 underline">
            ← На главную
          </Link>
        </p>
      </main>
    </>
  );
}
