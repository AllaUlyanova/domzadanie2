/** Москва, 3 класс, учебный год 2025/2026 (календарь 2026) */
export const META = {
  title: "Школьный день",
  grade: 3,
  city: "Москва",
  schoolYear: "2025/2026",
  programNote:
    "Задания по программе московских школ. После загрузки ваших учебников и рабочих тетрадей сайт будет сверять ответы с ними.",
};

/** Предметы 3 класса (типичный набор для Москвы) */
export const SUBJECTS = [
  {
    id: "russian",
    name: "Русский язык",
    icon: "📝",
    accent: "#ff7b7b",
    written: true,
    textbookHint: "Учебник русского языка 3 кл.",
    workbookHint: "Рабочая тетрадь / прописи",
  },
  {
    id: "reading",
    name: "Литературное чтение",
    icon: "📖",
    accent: "#7bd4ff",
    written: true,
    textbookHint: "Книга для чтения 3 кл.",
    workbookHint: "Рабочая тетрадь к чтению",
  },
  {
    id: "math",
    name: "Математика",
    icon: "🔢",
    accent: "#6ee7ff",
    written: true,
    textbookHint: "Математика 3 кл. (Моро и др.)",
    workbookHint: "Рабочая тетрадь 1–2",
  },
  {
    id: "world",
    name: "Окружающий мир",
    icon: "🌍",
    accent: "#5cffb1",
    written: true,
    textbookHint: "Окружающий мир 3 кл.",
    workbookHint: "Рабочая тетрадь",
  },
  {
    id: "english",
    name: "Английский язык",
    icon: "🇬🇧",
    accent: "#9b7bff",
    written: true,
    textbookHint: "English 3 (учебник)",
    workbookHint: "Activity Book / рабочая тетрадь",
  },
  {
    id: "art",
    name: "ИЗО",
    icon: "🎨",
    accent: "#ffb86b",
    written: true,
    textbookHint: "Изобразительное искусство",
    workbookHint: "Альбом для рисования",
  },
  {
    id: "music",
    name: "Музыка",
    icon: "🎵",
    accent: "#ff9bd4",
    written: false,
    textbookHint: "Музыка 3 кл.",
    workbookHint: "Нотная тетрадь (по заданию учителя)",
  },
  {
    id: "tech",
    name: "Технология",
    icon: "✂️",
    accent: "#c4a1ff",
    written: true,
    textbookHint: "Технология 3 кл.",
    workbookHint: "Рабочая тетрадь",
  },
  {
    id: "pe",
    name: "Физическая культура",
    icon: "⚽",
    accent: "#8dffb0",
    written: false,
    textbookHint: "Без письменных заданий на сайте",
    workbookHint: "Отметьте выполнение вручную",
  },
];

/** Демо-задания (пока нет ваших файлов). id уникален в каталоге */
export const DEMO_TASKS = [
  {
    id: "demo-rus-1",
    subjectId: "russian",
    textbook: "— демо",
    workbook: "—",
    page: "—",
    exercise: "Упр. 1",
    prompt: "Вставь пропущенную букву: м…лко",
    type: "text",
    answer: "о",
    accept: ["о", "О"],
    hint: "Слово обозначает белую жидкость.",
    notebook: "Запиши слово целиком в тетрадь по русскому.",
  },
  {
    id: "demo-math-1",
    subjectId: "math",
    textbook: "— демо",
    workbook: "—",
    page: "—",
    exercise: "№ 1",
    prompt: "Вычисли: 48 + 27",
    type: "number",
    answer: "75",
    hint: "Сложи единицы, потом десятки. Не забудь перенос.",
    notebook: "Запиши пример столбиком и ответ в тетрадь по математике.",
  },
  {
    id: "demo-world-1",
    subjectId: "world",
    textbook: "— демо",
    workbook: "—",
    page: "—",
    exercise: "№ 1",
    prompt: "Сколько месяцев в году?",
    type: "number",
    answer: "12",
    hint: "Вспомни названия всех месяцев.",
    notebook: "Запиши ответ в тетрадь по окружающему миру.",
  },
  {
    id: "demo-read-1",
    subjectId: "reading",
    textbook: "— демо",
    workbook: "—",
    page: "—",
    exercise: "Вопрос",
    prompt: "Кто написал сказку «Колобок»? (народ / конкретный автор)",
    type: "choice",
    answer: "народная сказка",
    options: ["Пушкин", "народная сказка", "Чуковский", "Толстой"],
    hint: "Это фольклор — сказка народа.",
    notebook: "Запиши ответ в тетрадь по литературному чтению.",
  },
  {
    id: "demo-art-1",
    subjectId: "art",
    textbook: "— демо",
    workbook: "—",
    page: "—",
    exercise: "№ 1",
    prompt: "Какие два основных цвета дают зелёный при смешивании?",
    type: "choice",
    answer: "синий и жёлтый",
    options: ["красный и синий", "синий и жёлтый", "белый и чёрный", "красный и жёлтый"],
    hint: "Вспомни круг Иттена.",
    notebook: "Нарисуй и подпиши цвета в альбоме.",
  },
  {
    id: "demo-tech-1",
    subjectId: "tech",
    textbook: "— демо",
    workbook: "—",
    page: "—",
    exercise: "№ 1",
    prompt: "Какой инструмент безопаснее использовать для вырезания бумаги по линии?",
    type: "choice",
    answer: "ножницы",
    options: ["ножницы", "нож", "пила", "топор"],
    hint: "Инструмент с двумя лезвиями и ручками.",
    notebook: "Запиши правило безопасности в тетрадь по технологии.",
  },
  {
    id: "demo-en-1",
    subjectId: "english",
    textbook: "— демо",
    workbook: "—",
    page: "—",
    exercise: "№ 1",
    prompt: "How do you say «кошка» in English?",
    type: "text",
    answer: "cat",
    accept: ["cat", "a cat", "the cat"],
    hint: "Трёхбуквенное слово, начинается на c.",
    notebook: "Запиши слово и перевод в тетрадь по английскому.",
  },
];

/** Схема JSON для загрузки заданий (показываем родителю) */
export const TASKS_SCHEMA_HINT = `{
  "tasks": [
    {
      "id": "math-p12-n45",
      "subjectId": "math",
      "date": "2026-05-15",
      "textbook": "Математика 3 кл.",
      "workbook": "Рабочая тетрадь 1",
      "page": 12,
      "exercise": "№ 45",
      "prompt": "Текст задания для экрана",
      "type": "text | number | choice",
      "answer": "правильный ответ",
      "accept": ["вариант1", "вариант2"],
      "options": ["только для choice"],
      "hint": "Подсказка",
      "notebook": "Что переписать в тетрадь"
    }
  ]
}`;

export function getSubject(id) {
  return SUBJECTS.find((s) => s.id === id);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function normalizeText(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}

export function checkAnswer(task, userInput) {
  const raw = String(userInput ?? "").trim();
  if (!raw) return { ok: false, reason: "empty" };

  if (task.type === "choice") {
    const ok = normalizeText(raw) === normalizeText(task.answer);
    return { ok, reason: ok ? "ok" : "wrong" };
  }

  if (task.type === "number") {
    const want = Number(String(task.answer).replace(",", "."));
    const got = Number(raw.replace(",", "."));
    if (Number.isFinite(want) && Number.isFinite(got) && Math.abs(want - got) < 0.001) {
      return { ok: true, reason: "ok" };
    }
    return { ok: false, reason: "wrong" };
  }

  const normalized = normalizeText(raw);
  const accepted = [task.answer, ...(task.accept || [])].map(normalizeText);
  if (accepted.includes(normalized)) return { ok: true, reason: "ok" };
  return { ok: false, reason: "wrong" };
}
