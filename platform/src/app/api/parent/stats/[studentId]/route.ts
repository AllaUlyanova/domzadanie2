import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** GET /api/parent/stats/:studentId — кабинет родителя */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await params;

  const [attempts, weakTopics, achievements] = await Promise.all([
    prisma.homeworkAttempt.findMany({
      where: { studentId },
      include: {
        exercise: {
          include: { lesson: { include: { textbook: { include: { subject: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.weakTopic.findMany({
      where: { studentId },
      orderBy: { errorCount: "desc" },
    }),
    prisma.studentAchievement.findMany({
      where: { studentId },
      include: { achievement: true },
    }),
  ]);

  const bySubject: Record<string, { correct: number; total: number }> = {};
  for (const a of attempts) {
    const slug = a.exercise.lesson.textbook.subject.slug;
    if (!bySubject[slug]) bySubject[slug] = { correct: 0, total: 0 };
    bySubject[slug].total += 1;
    if (a.isCorrect) bySubject[slug].correct += 1;
  }

  const recommendations = weakTopics.slice(0, 5).map((w) => ({
    subject: w.subjectSlug,
    topic: w.topic,
    message: `Повторите тему «${w.topic}» — было ${w.errorCount} ошибок.`,
  }));

  return NextResponse.json({
    progressBySubject: bySubject,
    weakTopics,
    achievements,
    recommendations,
    recentAttempts: attempts.slice(0, 10),
  });
}
