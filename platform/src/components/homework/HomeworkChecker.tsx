"use client";

import { useState } from "react";
import { KidButton } from "@/components/ui/KidButton";
import type { CheckResult } from "@/lib/ai/guardrails";

type Props = {
  exerciseId: string;
  studentId: string;
  prompt: string;
  answerType: "TEXT" | "CHOICE" | "MATH_EXPRESSION";
  choices?: string[];
};

/**
 * UI проверки одного задания — крупные поля, минимум текста.
 * Пример полного flow для MVP.
 */
export function HomeworkChecker({ exerciseId, studentId, prompt, answerType, choices }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<(CheckResult & { blocked?: boolean; blockReason?: string }) | null>(
    null,
  );
  const [similar, setSimilar] = useState<{ prompt: string; hint: string } | null>(null);

  async function check() {
    setLoading(true);
    setFeedback(null);
    setSimilar(null);
    try {
      const res = await fetch("/api/homework/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          exerciseId,
          answer: {
            type: answerType,
            value,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setFeedback(data.feedback);
      if (data.similarTask) setSimilar(data.similarTask);
      if (data.blocked && data.blockReason) {
        setFeedback({ ...data.feedback, blocked: true, blockReason: data.blockReason });
      }
      // Голосовое объяснение (Web Speech API) — опционально
      if (process.env.NEXT_PUBLIC_ENABLE_VOICE === "true" && data.feedback?.explanationSimple) {
        const u = new SpeechSynthesisUtterance(data.feedback.explanationSimple);
        u.lang = "ru-RU";
        speechSynthesis.speak(u);
      }
    } catch (e) {
      setFeedback({
        isCorrect: false,
        score: 0,
        errors: [],
        explanationSimple: e instanceof Error ? e.message : "Не получилось проверить",
        steps: [],
        similarExample: "",
        hintLevel1: "",
        encouragement: "Попробуй ещё!",
        needsRetry: true,
        confidence: 0,
        groundedInTextbook: false,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="kid-card space-y-4">
      <p className="text-lg font-bold leading-snug">{prompt}</p>

      {answerType === "CHOICE" && choices ? (
        <select
          className="min-h-[52px] w-full rounded-kid border-2 border-slate-300 px-4 text-lg font-semibold dark:bg-slate-700"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">Выбери ответ</option>
          {choices.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="min-h-[52px] w-full rounded-kid border-2 border-slate-300 px-4 text-lg font-semibold dark:bg-slate-700"
          placeholder="Твой ответ"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}

      <KidButton onClick={check} disabled={loading || !value.trim()}>
        {loading ? "Проверяю…" : "✓ Проверить"}
      </KidButton>

      {feedback && (
        <div
          className={`rounded-kid p-4 text-base font-semibold ${
            feedback.isCorrect
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
              : "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100"
          }`}
        >
          {feedback.blocked && feedback.blockReason ? (
            <p>{feedback.blockReason}</p>
          ) : (
            <>
              <p className="text-xl">{feedback.isCorrect ? "🎉 Верно!" : "💪 Почти!"}</p>
              <p className="mt-2 font-normal">{feedback.explanationSimple}</p>
              {feedback.errors?.map((err, i) => (
                <p key={i} className="mt-2 font-normal">
                  {err.highlight ? (
                    <>
                      Ошибка: <mark className="rounded bg-rose-300 px-1">{err.highlight}</mark> — {err.detail}
                    </>
                  ) : (
                    err.detail
                  )}
                </p>
              ))}
              {feedback.steps?.length > 0 && (
                <ol className="mt-3 list-decimal space-y-1 pl-5 font-normal">
                  {feedback.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              )}
              <p className="mt-2 text-sm opacity-90">{feedback.encouragement}</p>
            </>
          )}
        </div>
      )}

      {similar && !feedback?.isCorrect && (
        <div className="rounded-kid border-2 border-dashed border-violet-400 bg-violet-50 p-4 dark:bg-violet-950/40">
          <p className="font-bold text-violet-800 dark:text-violet-200">Похожее задание для тренировки:</p>
          <p className="mt-2">{similar.prompt}</p>
          <p className="mt-1 text-sm text-violet-700 dark:text-violet-300">Подсказка: {similar.hint}</p>
        </div>
      )}
    </article>
  );
}
