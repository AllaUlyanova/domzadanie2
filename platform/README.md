# Школьный день AI — MVP

AI-платформа проверки домашних заданий для **3 класса (РФ, 2026)**.

## Стек

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes
- **DB:** PostgreSQL + Prisma
- **Auth:** NextAuth (JWT)
- **AI:** OpenAI + RAG по учебникам

## Быстрый старт

```bash
cd platform
cp .env.example .env
# Заполните DATABASE_URL, OPENAI_API_KEY, NEXTAUTH_SECRET

npm install
npm run db:push
npm run db:seed
npm run dev
```

Откройте http://localhost:3000

## Маршруты

| URL | Описание |
|-----|----------|
| `/` | Главная |
| `/learn` | Выбор предмета |
| `/learn/math` | Учебники и уроки |
| `/learn/math/{book}/{lesson}` | **Все задания урока** |
| `/demo` | Демо проверки (48+27) |
| `/parent` | Кабинет родителя |

## Пример проверки

1. `npm run db:seed` — создаёт задание `demo-ex-48-27`
2. Откройте `/demo`, введите **75**, нажмите «Проверить»
3. AI вернёт JSON с объяснением и шагами

## Документация

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — архитектура, RAG, guardrails

## Перенос учебников Spotlight

PDF из `../content/textbooks/` можно импортировать в `Textbook` + OCR pipeline (см. ARCHITECTURE).
