import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient, SubjectSlug, AnswerType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const subjects = [
    { slug: SubjectSlug.MATH, name: "Математика", icon: "🔢", color: "#6ee7ff", sortOrder: 1 },
    { slug: SubjectSlug.RUSSIAN, name: "Русский язык", icon: "📝", color: "#ff7b7b", sortOrder: 2 },
    { slug: SubjectSlug.WORLD, name: "Окружающий мир", icon: "🌍", color: "#5cffb1", sortOrder: 3 },
    { slug: SubjectSlug.READING, name: "Литературное чтение", icon: "📖", color: "#7bd4ff", sortOrder: 4 },
    { slug: SubjectSlug.ENGLISH, name: "Английский язык", icon: "🇬🇧", color: "#9b7bff", sortOrder: 5 },
  ];

  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { slug: s.slug },
      create: s,
      update: s,
    });
  }

  const math = await prisma.subject.findUniqueOrThrow({ where: { slug: SubjectSlug.MATH } });
  const textbook = await prisma.textbook.upsert({
    where: { id: "demo-math-moro-3" },
    create: {
      id: "demo-math-moro-3",
      subjectId: math.id,
      title: "Математика. 3 класс (демо)",
      publisher: "Демо УМК",
      grade: 3,
      year: 2026,
      ocrStatus: "ready",
    },
    update: {},
  });

  const lesson = await prisma.lesson.upsert({
    where: { id: "demo-math-l1" },
    create: {
      id: "demo-math-l1",
      textbookId: textbook.id,
      moduleNum: 1,
      title: "Сложение и вычитание",
      sortOrder: 1,
    },
    update: {},
  });

  await prisma.exercise.upsert({
    where: { id: "demo-ex-48-27" },
    create: {
      id: "demo-ex-48-27",
      lessonId: lesson.id,
      number: "№ 1",
      page: 12,
      prompt: "Вычисли: 48 + 27",
      answerType: AnswerType.MATH_EXPRESSION,
      correctAnswer: "75",
      difficulty: 1,
    },
    update: {},
  });

  const achievements = [
    { code: "first_correct", title: "Первая звезда", description: "Первый верный ответ", icon: "⭐", xpReward: 20 },
    { code: "streak_3", title: "Огонёк", description: "3 дня подряд", icon: "🔥", xpReward: 50 },
    { code: "math_hero", title: "Математик", description: "10 верных в математике", icon: "🏆", xpReward: 100 },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      create: a,
      update: a,
    });
  }

  await prisma.studentProfile.upsert({
    where: { id: "demo-student" },
    create: { id: "demo-student", displayName: "Ученик (демо)", grade: 3 },
    update: {},
  });

  // Spotlight 3 (английский) из content/tasks/english-spotlight-3.json
  const enJsonPath = join(__dirname, "../../content/tasks/english-spotlight-3.json");
  if (existsSync(enJsonPath)) {
    const enData = JSON.parse(readFileSync(enJsonPath, "utf8")) as {
      tasks: Array<Record<string, unknown>>;
    };
    const english = await prisma.subject.findUniqueOrThrow({ where: { slug: SubjectSlug.ENGLISH } });
    const enBook = await prisma.textbook.upsert({
      where: { id: "spotlight-3-en" },
      create: {
        id: "spotlight-3-en",
        subjectId: english.id,
        title: "Английский в фокусе · Spotlight 3",
        umk: "Spotlight 3",
        grade: 3,
        year: 2026,
        pdfUrl: "/content/textbooks/english/rabochaya-tetrad-spotlight-3.pdf",
        ocrStatus: "ready",
      },
      update: {},
    });

    const lessonKeys = new Map<string, string>();
    for (const t of enData.tasks) {
      const lid = String(t.lessonId ?? t.unit ?? "default");
      if (!lessonKeys.has(lid)) {
        const title = String(t.unitTitle ?? t.lessonTitle ?? `Урок ${lid}`);
        const lesson = await prisma.lesson.upsert({
          where: { id: `en-lesson-${lid}` },
          create: {
            id: `en-lesson-${lid}`,
            textbookId: enBook.id,
            title,
            moduleNum: typeof t.unit === "number" ? t.unit : null,
            sortOrder: typeof t.unit === "number" ? t.unit : 0,
          },
          update: { title },
        });
        lessonKeys.set(lid, lesson.id);
      }
      const lessonId = lessonKeys.get(lid)!;
      const answerType =
        t.type === "choice"
          ? AnswerType.CHOICE
          : t.type === "number"
            ? AnswerType.MATH_EXPRESSION
            : AnswerType.TEXT;
      await prisma.exercise.upsert({
        where: { id: String(t.id) },
        create: {
          id: String(t.id),
          lessonId,
          number: String(t.exercise ?? "—"),
          page: typeof t.page === "number" ? t.page : parseInt(String(t.page), 10) || null,
          prompt: String(t.prompt),
          answerType,
          choices: t.options ? (t.options as string[]) : undefined,
          correctAnswer: String(t.answer),
        },
        update: {
          prompt: String(t.prompt),
          correctAnswer: String(t.answer),
        },
      });
    }
    console.log(`English Spotlight: ${enData.tasks.length} exercises`);
  }

  console.log("Seed OK");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
