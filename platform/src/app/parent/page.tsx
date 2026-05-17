"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";

type Stats = {
  progressBySubject: Record<string, { correct: number; total: number }>;
  weakTopics: { topic: string; subjectSlug: string; errorCount: number }[];
  recommendations: { message: string }[];
};

export default function ParentPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const studentId = "demo-student";

  useEffect(() => {
    fetch(`/api/parent/stats/${studentId}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8">
        <h1 className="kid-heading">Кабинет родителя</h1>
        <p className="mt-2 font-semibold text-slate-600">Прогресс и слабые темы</p>

        {!stats && (
          <div className="kid-card mt-8">Загрузка… (нужен вход и база данных)</div>
        )}

        {stats && (
          <div className="mt-8 space-y-6">
            <section className="kid-card">
              <h2 className="text-lg font-extrabold">По предметам</h2>
              <ul className="mt-4 space-y-2">
                {Object.entries(stats.progressBySubject).map(([slug, p]) => (
                  <li key={slug} className="flex justify-between font-semibold">
                    <span>{slug}</span>
                    <span>
                      {p.correct}/{p.total} верно
                    </span>
                  </li>
                ))}
              </ul>
              {!Object.keys(stats.progressBySubject).length && (
                <p className="text-slate-500">Пока нет попыток</p>
              )}
            </section>

            <section className="kid-card">
              <h2 className="text-lg font-extrabold">Слабые темы</h2>
              <ul className="mt-4 space-y-2">
                {stats.weakTopics.map((w) => (
                  <li key={`${w.subjectSlug}-${w.topic}`} className="text-sm font-semibold">
                    {w.subjectSlug}: {w.topic} ({w.errorCount} ошибок)
                  </li>
                ))}
              </ul>
            </section>

            <section className="kid-card">
              <h2 className="text-lg font-extrabold">Рекомендации</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                {stats.recommendations.map((r, i) => (
                  <li key={i}>{r.message}</li>
                ))}
              </ul>
            </section>
          </div>
        )}

        <p className="mt-8 text-center">
          <Link href="/" className="font-bold text-brand-600 underline">
            На главную
          </Link>
        </p>
      </main>
    </>
  );
}
