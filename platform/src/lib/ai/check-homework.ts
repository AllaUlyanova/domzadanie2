import OpenAI from "openai";
import {
  SYSTEM_BASE,
  CHECK_HOMEWORK_PROMPT,
  GENERATE_SIMILAR_PROMPT,
  MATH_EXTRA,
  RUSSIAN_SPELLING_EXTRA,
} from "@/lib/ai/prompts";
import {
  applyGuardrails,
  CheckResultSchema,
  SimilarTaskSchema,
  stripPii,
  type CheckResult,
} from "@/lib/ai/guardrails";
import { formatRagContext, retrieveChunks } from "@/lib/ai/rag";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type CheckHomeworkInput = {
  subject: string;
  subjectSlug: string;
  textbookId: string;
  exerciseRef: string;
  prompt: string;
  correctAnswer: string;
  studentAnswer: string;
  answerType: string;
  page?: number;
};

export type CheckHomeworkOutput = {
  result: CheckResult;
  blocked: boolean;
  blockReason?: string;
  ragChunkIds: string[];
};

function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

/** Основной workflow проверки ДЗ */
export async function checkHomeworkWithAI(input: CheckHomeworkInput): Promise<CheckHomeworkOutput> {
  const chunks = await retrieveChunks({
    textbookId: input.textbookId,
    query: `${input.prompt} ${input.exerciseRef}`,
    page: input.page,
  });

  const ragContext = formatRagContext(chunks);
  const ragChunkIds = chunks.map((c) => c.id);

  let extra = "";
  if (input.subjectSlug === "MATH") extra = MATH_EXTRA;
  if (input.subjectSlug === "RUSSIAN") extra = RUSSIAN_SPELLING_EXTRA;

  const userPrompt =
    fillTemplate(CHECK_HOMEWORK_PROMPT, {
      subject: input.subject,
      exerciseRef: input.exerciseRef,
      prompt: stripPii(input.prompt),
      correctAnswer: input.correctAnswer,
      studentAnswer: stripPii(input.studentAnswer),
      answerType: input.answerType,
      ragContext,
    }) + `\n\n${extra}`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_BASE },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: CheckResult;
  try {
    parsed = CheckResultSchema.parse(JSON.parse(raw));
  } catch {
    parsed = CheckResultSchema.parse({
      isCorrect: false,
      score: 0,
      errors: [{ type: "parse", detail: "Не удалось разобрать ответ", highlight: null }],
      explanationSimple: "Что-то пошло не так. Попробуй ещё раз!",
      steps: [],
      similarExample: "",
      hintLevel1: "Перечитай условие в учебнике.",
      encouragement: "У тебя получится!",
      needsRetry: true,
      confidence: 0,
      groundedInTextbook: false,
    });
  }

  const guarded = applyGuardrails(parsed, {
    hasRagContext: ragContext.length > 80,
    ragChunkCount: chunks.length,
  });

  return {
    result: guarded,
    blocked: guarded.blocked,
    blockReason: guarded.blockReason,
    ragChunkIds,
  };
}

export async function generateSimilarTask(params: {
  subject: string;
  prompt: string;
  errors: string;
  textbookId: string;
}) {
  const chunks = await retrieveChunks({
    textbookId: params.textbookId,
    query: params.prompt,
    limit: 3,
  });

  const userPrompt = fillTemplate(GENERATE_SIMILAR_PROMPT, {
    subject: params.subject,
    prompt: stripPii(params.prompt),
    errors: params.errors,
    ragContext: formatRagContext(chunks),
  });

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_BASE },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return SimilarTaskSchema.parse(JSON.parse(raw));
}
