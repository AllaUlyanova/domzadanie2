import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { stripPii } from "@/lib/ai/guardrails";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * RAG: поиск по векторной БД (pgvector).
 * MVP: если embedding нет — fallback на текстовый поиск по странице.
 */
export async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    input: stripPii(text).slice(0, 8000),
  });
  return res.data[0].embedding;
}

export type RagChunk = {
  id: string;
  content: string;
  pageFrom?: number | null;
  exerciseRef?: string | null;
  score: number;
};

export async function retrieveChunks(params: {
  textbookId: string;
  query: string;
  page?: number;
  limit?: number;
}): Promise<RagChunk[]> {
  const limit = params.limit ?? 5;

  // Fallback: по номеру страницы (пока OCR/embedding не готовы)
  if (params.page != null) {
    const pageChunks = await prisma.textbookChunk.findMany({
      where: {
        textbookId: params.textbookId,
        pageFrom: { lte: params.page },
        OR: [{ pageTo: { gte: params.page } }, { pageTo: null }],
      },
      take: limit,
      orderBy: { pageFrom: "asc" },
    });
    if (pageChunks.length) {
      return pageChunks.map((c) => ({
        id: c.id,
        content: c.content,
        pageFrom: c.pageFrom,
        exerciseRef: c.exerciseRef,
        score: 1,
      }));
    }
  }

  // Vector search (raw SQL) — когда chunks с embedding заполнены
  try {
    const embedding = await embedText(params.query);
    const vectorStr = `[${embedding.join(",")}]`;
    const rows = await prisma.$queryRawUnsafe<
      { id: string; content: string; page_from: number | null; exercise_ref: string | null; score: number }[]
    >(
      `SELECT id, content, "pageFrom" as page_from, "exerciseRef" as exercise_ref,
              1 - (embedding <=> $1::vector) as score
       FROM "TextbookChunk"
       WHERE "textbookId" = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      vectorStr,
      params.textbookId,
      limit,
    );
    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      pageFrom: r.page_from,
      exerciseRef: r.exercise_ref,
      score: Number(r.score),
    }));
  } catch {
    // pgvector не настроен — текстовый поиск
    const fallback = await prisma.textbookChunk.findMany({
      where: {
        textbookId: params.textbookId,
        content: { contains: params.query.slice(0, 40), mode: "insensitive" },
      },
      take: limit,
    });
    return fallback.map((c) => ({
      id: c.id,
      content: c.content,
      pageFrom: c.pageFrom,
      exerciseRef: c.exerciseRef,
      score: 0.5,
    }));
  }
}

export function formatRagContext(chunks: RagChunk[]): string {
  if (!chunks.length) return "(Контекст учебника пока не найден. Используй только условие задания.)";
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] стр. ${c.pageFrom ?? "?"} ${c.exerciseRef ?? ""}\n${c.content.slice(0, 1200)}`,
    )
    .join("\n\n");
}
