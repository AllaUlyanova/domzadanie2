import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { HomeworkChecker } from "@/components/homework/HomeworkChecker";

/** Демо проверки (нужны PostgreSQL, seed, OPENAI_API_KEY) */
export default function DemoPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 pb-24 pt-8">
        <Link href="/" className="text-sm font-bold text-brand-600">
          ← Главная
        </Link>
        <h1 className="kid-heading mt-4">Демо: проверка ответа</h1>
        <p className="mt-2 font-semibold text-slate-600">
          Пример из seed. Правильный ответ: <strong>75</strong>
        </p>
        <div className="mt-8">
          <HomeworkChecker
            exerciseId="demo-ex-48-27"
            studentId="demo-student"
            prompt="Вычисли: 48 + 27"
            answerType="MATH_EXPRESSION"
          />
        </div>
        <div className="kid-card mt-8 text-sm">
          <p className="font-bold">Пример JSON от AI:</p>
          <pre className="mt-2 overflow-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-800">
            {`{ "isCorrect": true, "explanationSimple": "48 + 27 = 75", "steps": ["..."], "encouragement": "Супер!" }`}
          </pre>
        </div>
      </main>
    </>
  );
}
