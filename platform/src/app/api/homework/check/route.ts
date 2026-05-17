import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkHomeworkWithAI } from "@/lib/ai/check-homework";
import { generateSimilarTask } from "@/lib/ai/check-homework";

const BodySchema = z.object({
  studentId: z.string(),
  exerciseId: z.string(),
  answer: z.union([
    z.object({ type: z.literal("TEXT"), value: z.string() }),
    z.object({ type: z.literal("CHOICE"), value: z.string() }),
    z.object({ type: z.literal("PHOTO"), base64: z.string().max(6_000_000).optional() }),
    z.object({ type: z.literal("MATH_EXPRESSION"), value: z.string() }),
  ]),
});

/**
 * POST /api/homework/check
 * Проверка ответа через AI + RAG, сохранение попытки, генерация похожей задачи при ошибке.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id: body.data.exerciseId },
    include: {
      lesson: { include: { textbook: { include: { subject: true } } } },
    },
  });

  if (!exercise?.lesson?.textbook) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  const studentAnswer =
    body.data.answer.type === "PHOTO"
      ? "[фото тетради — OCR в следующей версии]"
      : "value" in body.data.answer
        ? body.data.answer.value
        : "";

  const ai = await checkHomeworkWithAI({
    subject: exercise.lesson.textbook.subject.name,
    subjectSlug: exercise.lesson.textbook.subject.slug,
    textbookId: exercise.lesson.textbook.id,
    exerciseRef: `${exercise.number}, стр. ${exercise.page ?? "—"}`,
    prompt: exercise.prompt,
    correctAnswer: exercise.correctAnswer ?? "",
    studentAnswer,
    answerType: body.data.answer.type,
    page: exercise.page ?? undefined,
  });

  const attempt = await prisma.homeworkAttempt.create({
    data: {
      studentId: body.data.studentId,
      exerciseId: exercise.id,
      status: "CHECKED",
      answerPayload: body.data.answer,
      isCorrect: ai.blocked ? false : ai.result.isCorrect,
      score: ai.result.score,
      aiFeedback: ai.result,
      aiModel: process.env.OPENAI_MODEL,
      ragChunkIds: ai.ragChunkIds,
    },
  });

  let similar = null;
  if (!ai.result.isCorrect && !ai.blocked) {
    similar = await generateSimilarTask({
      subject: exercise.lesson.textbook.subject.name,
      prompt: exercise.prompt,
      errors: ai.result.errors.map((e) => e.detail).join("; "),
      textbookId: exercise.lesson.textbook.id,
    });
    await prisma.similarTask.create({
      data: {
        sourceAttemptId: attempt.id,
        prompt: similar.prompt,
        correctAnswer: similar.correctAnswer,
      },
    });
  }

  // XP + слабые темы
  if (ai.result.isCorrect) {
    await prisma.studentProfile.update({
      where: { id: body.data.studentId },
      data: { totalXp: { increment: 10 } },
    });
  } else if (ai.result.errors[0]) {
    await prisma.weakTopic.upsert({
      where: {
        studentId_subjectSlug_topic: {
          studentId: body.data.studentId,
          subjectSlug: exercise.lesson.textbook.subject.slug,
          topic: ai.result.errors[0].type,
        },
      },
      create: {
        studentId: body.data.studentId,
        subjectSlug: exercise.lesson.textbook.subject.slug,
        topic: ai.result.errors[0].type,
      },
      update: { errorCount: { increment: 1 }, lastSeenAt: new Date() },
    });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    blocked: ai.blocked,
    blockReason: ai.blockReason,
    feedback: ai.result,
    similarTask: similar,
  });
}
