# Школьный день — 3 класс, Москва 2026

Статический сайт для ежедневных уроков: ученик решает задания на экране, сайт проверяет ответы, затем ответы переносятся в школьную тетрадь.

## Возможности

- **Сегодняшний день** — карточки всех предметов московской программы 3 класса.
- **Проверка ответов** — текст, число, выбор из списка.
- **Тетрадь** — после верных ответов отметка «переписал в тетрадь».
- **Загрузка заданий** — JSON из ваших рабочих тетрадей (учебники PDF — в папке `content/textbooks/`).
- **Дневник** — прогресс хранится в `localStorage` браузера.

## Запуск (простой сайт)

```powershell
node .\scripts\dev.mjs
```

Откройте адрес из консоли (обычно `http://localhost:5173`).

## AI-платформа (Next.js 15)

Полноценный MVP в папке **`platform/`** — PostgreSQL, OpenAI, RAG, кабинет родителя.

```bash
cd platform
cp .env.example .env
npm install
npm run db:push && npm run db:seed
npm run dev
```

См. [platform/README.md](platform/README.md) и [platform/docs/ARCHITECTURE.md](platform/docs/ARCHITECTURE.md).

## Загрузка своих заданий

См. `content/README.md`. Подключён **Spotlight 3** (английский): PDF в `content/textbooks/english/`, задания с проверкой в `content/tasks/english-spotlight-3.json`.

Урок: **Сегодня** → **Английский язык** → ответ в поле под заданием → **Проверить** → блок **Результат** внизу.

## Структура проекта

- `index.html` — страница
- `assets/data.js` — предметы и демо‑задания
- `assets/app.js` — логика уроков и проверки
- `content/` — учебники и JSON с заданиями
