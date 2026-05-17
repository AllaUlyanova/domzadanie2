import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET /api/lessons/:lessonId/exercises — все задания урока */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;
  const exercises = await prisma.exercise.findMany({
    where: { lessonId },
    orderBy: [{ page: "asc" }, { number: "asc" }],
  });
  return NextResponse.json(exercises);
}
