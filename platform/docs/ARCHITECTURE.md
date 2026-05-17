# Архитектура «Школьный день AI»

## Обзор

MVP для проверки домашних заданий 3 класса (РФ, 2025/2026) с **RAG по учебникам** и **OpenAI**.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Next.js 15 │────▶│  API Routes      │────▶│ PostgreSQL  │
│  (React UI) │     │  + NextAuth JWT  │     │  + Prisma   │
└─────────────┘     └────────┬─────────┘     └──────┬──────┘
                             │                        │
                             ▼                        ▼
                    ┌────────────────┐        ┌──────────────┐
                    │ OpenAI API     │        │ TextbookChunk│
                    │ chat + embed   │        │ (RAG)        │
                    └────────────────┘        └──────────────┘
```

## Структура папок

```
platform/
├── prisma/
│   ├── schema.prisma      # Модели: User, Student, Textbook, Lesson, Exercise, Attempt…
│   └── seed.ts            # Предметы, демо-урок, достижения
├── src/
│   ├── app/               # App Router
│   │   ├── api/           # REST endpoints
│   │   ├── learn/         # Выбор предмета → учебник → урок → все задания
│   │   ├── parent/        # Кабинет родителя
│   │   └── demo/          # Демо проверки
│   ├── components/        # UI (KidButton, HomeworkChecker, Mascot…)
│   └── lib/
│       ├── ai/            # prompts, guardrails, RAG, check-homework
│       ├── auth.ts        # NextAuth
│       └── db.ts          # Prisma singleton
└── docs/
    └── ARCHITECTURE.md
```

## AI Workflow (проверка ДЗ)

1. Ученик выбирает **предмет → учебник → урок** (`/learn/[subject]/[textbookId]/[lessonId]`).
2. На странице урока отображаются **все Exercise** урока (список `HomeworkChecker`).
3. `POST /api/homework/check`:
   - **RAG**: `retrieveChunks(textbookId, page, query)` — pgvector или fallback по странице.
   - **Prompt**: `SYSTEM_BASE` + `CHECK_HOMEWORK_PROMPT` + контекст учебника.
   - **OpenAI** `response_format: json_object`.
   - **Zod** `CheckResultSchema` + `applyGuardrails()` (confidence, groundedInTextbook).
4. При ошибке: `generateSimilarTask()` → запись в `SimilarTask`.
5. Обновление XP, `WeakTopic`, `HomeworkAttempt`.

## Защита от галлюцинаций

| Правило | Реализация |
|--------|------------|
| Только учебник | RAG-контекст обязателен при низкой уверенности |
| JSON-схема | Zod-валидация ответа модели |
| Порог confidence | `< 0.55` → не засчитывать |
| PII | `stripPii()` перед отправкой в OpenAI |
| Детские данные | Минимум полей, AuditLog, без публичных профилей |

## API Endpoints

| Method | Path | Описание |
|--------|------|----------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth |
| GET | `/api/subjects` | Предметы + учебники |
| GET | `/api/lessons/:id/exercises` | Все задания урока |
| POST | `/api/homework/check` | AI-проверка + похожая задача |
| GET | `/api/parent/stats/:studentId` | Статистика родителя |

## Безопасность детей (152-ФЗ / best practices)

- Родительский аккаунт, ученик без email по умолчанию.
- JWT-сессии, httpOnly cookies (NextAuth).
- Не логировать ответы детей в production без согласия.
- COPPA-подобный минимум данных: имя, класс, город.
- Rate limiting (добавить middleware в production).

## OCR + Vector DB (roadmap)

1. Upload PDF → `POST /api/admin/textbooks/upload`
2. OCR (Tesseract / Azure) → `TextbookChunk.content`
3. `embedText()` → `embeddingJson` или pgvector
4. Поиск: `ORDER BY embedding <=> query`

## Связь со старым сайтом

Статический сайт в корне репозитория (`index.html`) — прототип.  
Новая платформа в `platform/` — целевой production MVP.
