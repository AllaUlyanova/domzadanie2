import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET /api/subjects — список предметов с учебниками */
export async function GET() {
  const subjects = await prisma.subject.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      textbooks: {
        select: { id: true, title: true, umk: true, ocrStatus: true },
      },
    },
  });
  return NextResponse.json(subjects);
}
