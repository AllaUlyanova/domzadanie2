# Папка для учебников и заданий

## Структура

```
content/
  catalog.json              — список PDF (название, предмет, путь)
  tasks/
    english-spotlight-3.json — задания с ответами для проверки (Spotlight 3)
    example-tasks.json
  textbooks/
    english/                  — PDF по английскому (Spotlight 3)
    russian/
    math/
    ...
```

## Английский: Spotlight 3 («Английский в фокусе»)

В `textbooks/english/` лежат:

- `uchebnik-spotlight-3.pdf` — учебник  
- `rabochaya-tetrad-spotlight-3.pdf` — рабочая тетрадь  
- `sbornik-spotlight-3.pdf` — сборник упражнений  
- `flashcards-spotlight-3.pdf` — flashcards  

На сайте: **Сегодня** → **Английский язык** → ссылки на PDF слева, ответы вводятся под каждым заданием → **Проверить** → внизу **результат**.

## Как добавить задания

1. Скопируйте образец `tasks/english-spotlight-3.json` или `example-tasks.json`.
2. Укажите `subjectId` (для английского — `english`), `prompt`, `answer`, страницу тетради.
3. На сайте: **Учебники** → **Выбрать файл** (JSON) или положите файл в `content/tasks/` и добавьте путь в `assets/app.js` → `BUNDLED_TASK_URLS`.

Поле `date` (`YYYY-MM-DD`) — задания только на этот день. Без `date` — на любой день.

## id предметов

`russian`, `reading`, `math`, `world`, `english`, `art`, `music`, `tech`, `pe`

## Каталог уроков (все уроки на сайте)

Файлы `content/lessons/{subjectId}.json` — **полный список уроков** (не только те, где есть задания).

**Математика** (`math.json`): автогенерация уроков 1–110 (`generate.from` / `generate.to`).  
Добавить задания — в `content/tasks/math-moro-3.json` с `lessonId: "u5"` или `lessonSlug: "lesson-5"`.

**Английский** (`english.json`): список модулей Spotlight в `lessons[]`.

Логика: `assets/lessons-engine.js` → `getLessonsData(subjectId, tasks)`.

## Новый учебник (другой предмет)

1. PDF в `content/textbooks/{subjectId}/`.
2. Запись в `catalog.json` (`title`, `subjectId`, `type`, `file`).
3. Файл заданий в `content/tasks/` с ответами для автопроверки.
