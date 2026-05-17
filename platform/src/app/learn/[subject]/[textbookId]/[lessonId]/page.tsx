import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { HomeworkChecker } from "@/components/homework/HomeworkChecker";
import { prisma } from "@/lib/db";

/**
 * Страница урока — ВСЕ задания урока списком (не одно).
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ subject: string; textbookId: string; lessonId: string }>;
}) {
  const { subject, textbookId, lessonId } = await params;

  let lesson;
  try {
    lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, textbookId },
      include: {
        textbook: { include: { subject: true } },
        exercises: { orderBy: [{ page: "asc" }, { number: "asc" }] },
      },
    });
  } catch {
    lesson = null;
  }

  if (!lesson) notFound();

  const demoStudentId = "demo-student";

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-8">
        <Link href={`/learn/${subject}`} className="text-sm font-bold text-brand-600">
          ← {lesson.textbook.subject.name}
        </Link>
        <h1 className="kid-heading mt-4">{lesson.title}</h1>
        <p className="mt-2 text-lg font-bold text-slate-600">
          {lesson.exercises.length} заданий в этом уроке — решай все по порядку
        </p>

        <div className="mt-8 space-y-6">
          {lesson.exercises.map((ex, i) => (
            <section key={ex.id}>
              <p className="mb-2 text-sm font-bold text-slate-500">
                Задание {i + 1} · {ex.number}
                {ex.page != null ? ` · стр. ${ex.page}` : ""}
              </p>
              <HomeworkChecker
                exerciseId={ex.id}
                studentId={demoStudentId}
                prompt={ex.prompt}
                answerType={
                  ex.answerType === "CHOICE"
                    ? "CHOICE"
                    : ex.answerType === "MATH_EXPRESSION"
                      ? "MATH_EXPRESSION"
                      : "TEXT"
                }
                choices={
                  Array.isArray(ex.choices)
                    ? (ex.choices as string[])
                    : ex.choices
                      ? Object.values(ex.choices as Record<string, string>)
                      : undefined
                }
              />
            </section>
          ))}
        </div>

        {lesson.exercises.length === 0 && (
          <div className="kid-card mt-8 text-center font-bold">В этом уроке пока нет заданий в базе</div>
        )}
      </main>
    </>
  );
}
