import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { prisma } from "@/lib/db";
import { SubjectSlug } from "@prisma/client";

const SLUG_MAP: Record<string, SubjectSlug> = {
  math: SubjectSlug.MATH,
  russian: SubjectSlug.RUSSIAN,
  world: SubjectSlug.WORLD,
  reading: SubjectSlug.READING,
  english: SubjectSlug.ENGLISH,
};

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: subjectParam } = await params;
  const slug = SLUG_MAP[subjectParam];
  if (!slug) notFound();

  let subject;
  try {
    subject = await prisma.subject.findUnique({
      where: { slug },
      include: {
        textbooks: {
          include: {
            lessons: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });
  } catch {
    subject = null;
  }

  const name = subject?.name ?? subjectParam;
  const textbooks = subject?.textbooks ?? [];

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8">
        <Link href="/learn" className="text-sm font-bold text-brand-600">
          ← Предметы
        </Link>
        <h1 className="kid-heading mt-4">{name}</h1>
        <p className="mt-2 font-semibold text-slate-600">Шаг 1: учебник · Шаг 2: урок · Шаг 3: все задания</p>

        {!textbooks.length ? (
          <div className="kid-card mt-8">
            <p className="font-bold">Учебники скоро появятся</p>
            <p className="mt-2 text-slate-600">
              Запустите <code>npm run db:seed</code> или загрузите PDF через админку.
            </p>
            <Link href="/demo" className="mt-4 inline-block font-bold text-brand-600 underline">
              Попробовать демо-проверку →
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {textbooks.map((tb) => (
              <section key={tb.id} className="kid-card">
                <h2 className="text-xl font-extrabold">{tb.title}</h2>
                {tb.umk && <p className="text-sm font-semibold text-slate-500">{tb.umk}</p>}
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {tb.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/learn/${subjectParam}/${tb.id}/${lesson.id}`}
                        className="flex min-h-[72px] items-center rounded-kid border-2 border-slate-200 bg-white px-4 font-bold hover:border-brand-400 dark:border-slate-600 dark:bg-slate-800"
                      >
                        {lesson.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
