import { z } from "zod";

/** Схема ответа AI — валидация против галлюцинаций */
export const CheckResultSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().min(0).max(1),
  errors: z.array(
    z.object({
      type: z.string(),
      detail: z.string(),
      highlight: z.string().nullable().optional(),
    }),
  ),
  explanationSimple: z.string(),
  steps: z.array(z.string()),
  similarExample: z.string(),
  hintLevel1: z.string(),
  encouragement: z.string(),
  needsRetry: z.boolean(),
  confidence: z.number().min(0).max(1),
  groundedInTextbook: z.boolean(),
});

export type CheckResult = z.infer<typeof CheckResultSchema>;

export const SimilarTaskSchema = z.object({
  prompt: z.string().min(5),
  correctAnswer: z.string(),
  hint: z.string(),
});

/**
 * Защита от галлюцинаций:
 * 1) Низкая уверенность → не засчитывать автоматически
 * 2) Нет привязки к учебнику при пустом RAG → отказ
 * 3) Санитизация PII в логах (см. audit)
 */
export function applyGuardrails(
  parsed: CheckResult,
  opts: { hasRagContext: boolean; ragChunkCount: number },
): CheckResult & { blocked: boolean; blockReason?: string } {
  if (!opts.hasRagContext && !parsed.groundedInTextbook) {
    return {
      ...parsed,
      isCorrect: false,
      blocked: true,
      blockReason: "Нет фрагмента учебника — откройте страницу в PDF или дождитесь загрузки.",
    };
  }

  if (parsed.confidence < 0.55) {
    return {
      ...parsed,
      isCorrect: false,
      blocked: true,
      blockReason: "Умный помощник не уверен. Попробуй ещё раз или спроси взрослого.",
    };
  }

  if (opts.ragChunkCount === 0 && parsed.confidence < 0.75) {
    return {
      ...parsed,
      blocked: true,
      blockReason: "Сначала выберите учебник и страницу.",
    };
  }

  return { ...parsed, blocked: false };
}

/** Удаляем email, телефоны из текста перед отправкой в AI */
export function stripPii(text: string): string {
  return text
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, "[email]")
    .replace(/\+?\d[\d\s()-]{8,}/g, "[phone]");
}
