/**
 * Единая система уроков: каталог (curriculum) + задания (tasks).
 * Все карточки кликабельны; задания подмешиваются по slug / lessonId.
 */

const CURRICULA_URLS = ["./content/lessons/math.json", "./content/lessons/english.json"];

/** @type {Record<string, object>} */
let curriculaBySubject = {};

/**
 * Нормализует ключ урока: u5 → lesson-5, 5 → lesson-5, m1 → lesson-m1
 */
export function normalizeLessonKey(raw) {
  if (raw == null || raw === "") return "lesson-default";
  const s = String(raw).trim();
  if (s.startsWith("lesson-")) return s;
  const num = s.match(/^u?(\d+)$/i);
  if (num) return `lesson-${num[1]}`;
  return `lesson-${s}`;
}

export function lessonSlugFromKey(key) {
  return normalizeLessonKey(key);
}

export function lessonKeyFromTask(task) {
  if (task.lessonSlug) return normalizeLessonKey(task.lessonSlug);
  if (task.lessonId != null) return normalizeLessonKey(task.lessonId);
  if (task.unit != null) return normalizeLessonKey(task.unit);
  return "lesson-default";
}

function partForLesson(curriculum, lessonNumber) {
  const parts = curriculum?.parts;
  if (!parts?.length || lessonNumber == null) return null;
  const n = Number(lessonNumber);
  return parts.find((p) => n >= p.lessonFrom && n <= p.lessonTo) || null;
}

function buildLessonEntry(base, curriculum) {
  const n = typeof base.id === "number" ? base.id : parseInt(String(base.id).replace(/\D/g, ""), 10);
  const part = partForLesson(curriculum, Number.isFinite(n) ? n : null);
  return {
    id: base.id,
    slug: base.slug,
    key: base.key,
    title: base.title,
    unit: base.unit ?? (Number.isFinite(n) ? n : null),
    count: 0,
    hasTasks: false,
    partBookId: part?.bookId || null,
    partLabel: part?.label || null,
  };
}

function generateFromConfig(curriculum) {
  const gen = curriculum.generate;
  if (!gen) return [];
  const from = gen.from ?? 1;
  const to = gen.to ?? from;
  const tpl = gen.titleTemplate || "Урок {n}";
  const overrides = curriculum.overrides || {};
  const list = [];

  for (let n = from; n <= to; n++) {
    const slug = `lesson-${n}`;
    const ov = overrides[String(n)] || overrides[slug] || {};
    list.push(
      buildLessonEntry(
        {
          id: n,
          slug,
          key: slug,
          title: ov.title || tpl.replace(/\{n\}/g, String(n)),
          unit: n,
        },
        curriculum,
      ),
    );
  }
  return list;
}

function lessonsFromCurriculumArray(curriculum) {
  return (curriculum.lessons || []).map((l) => {
    const slug = l.slug || normalizeLessonKey(l.id);
    return buildLessonEntry(
      {
        id: l.id,
        slug,
        key: normalizeLessonKey(slug),
        title: l.title || `Урок ${l.id}`,
        unit: l.unit ?? l.id,
      },
      curriculum,
    );
  });
}

function lessonsFromTasksOnly(tasks) {
  const map = new Map();
  for (const t of tasks) {
    const key = lessonKeyFromTask(t);
    if (!map.has(key)) {
      map.set(key, {
        id: t.unit ?? key,
        slug: key,
        key,
        title: t.lessonTitle || t.unitTitle || key,
        unit: t.unit ?? null,
        count: 0,
        hasTasks: false,
        partBookId: null,
        partLabel: null,
      });
    }
    map.get(key).count += 1;
    map.get(key).hasTasks = true;
    if (t.lessonTitle) map.get(key).title = t.lessonTitle;
  }
  return [...map.values()];
}

function groupTasksByKey(tasks) {
  const map = new Map();
  for (const t of tasks) {
    const key = lessonKeyFromTask(t);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  return map;
}

function sortLessons(a, b) {
  const au = a.unit;
  const bu = b.unit;
  if (au != null && bu != null && au !== bu) return Number(au) - Number(bu);
  if (typeof a.id === "number" && typeof b.id === "number") return a.id - b.id;
  return String(a.title).localeCompare(String(b.title), "ru");
}

/**
 * Единый массив lessonsData для предмета (каталог + задания).
 * @returns {Array<{id, slug, key, title, unit, count, hasTasks, partBookId, partLabel}>}
 */
export function getLessonsData(subjectId, tasks = []) {
  const curriculum = curriculaBySubject[subjectId];
  let lessons = [];

  if (curriculum?.generate) {
    lessons = generateFromConfig(curriculum);
  } else if (curriculum?.lessons?.length) {
    lessons = lessonsFromCurriculumArray(curriculum);
  }

  const taskGroups = groupTasksByKey(tasks.filter((t) => t.subjectId === subjectId));

  if (!lessons.length) {
    lessons = lessonsFromTasksOnly(tasks);
    return lessons.sort(sortLessons);
  }

  const byKey = new Map(lessons.map((l) => [l.key, l]));

  for (const lesson of lessons) {
    const tlist = taskGroups.get(lesson.key) || [];
    lesson.count = tlist.length;
    lesson.hasTasks = tlist.length > 0;
    if (tlist[0]?.lessonTitle) lesson.title = tlist[0].lessonTitle;
  }

  for (const [key, tlist] of taskGroups) {
    if (!byKey.has(key)) {
      const extra = {
        id: tlist[0]?.unit ?? key,
        slug: key,
        key,
        title: tlist[0]?.lessonTitle || tlist[0]?.unitTitle || key,
        unit: tlist[0]?.unit ?? null,
        count: tlist.length,
        hasTasks: true,
        partBookId: null,
        partLabel: null,
      };
      lessons.push(extra);
      byKey.set(key, extra);
    }
  }

  return lessons.sort(sortLessons);
}

export function filterTasksByLessonKey(tasks, lessonKey) {
  const key = normalizeLessonKey(lessonKey);
  return tasks.filter((t) => lessonKeyFromTask(t) === key);
}

export function findLesson(lessons, lessonKey) {
  const key = normalizeLessonKey(lessonKey);
  return lessons.find((l) => l.key === key) || null;
}

export function getBookForLesson(subjectId, lesson) {
  if (!lesson?.partBookId) return null;
  return null;
}

export function parseRouteHash() {
  const raw = (location.hash || "").replace(/^#/, "").trim();
  if (!raw) return null;
  const parts = raw.split("/").filter(Boolean);
  if (parts.length >= 2) {
    return { subjectId: parts[0], lessonKey: normalizeLessonKey(parts[1]) };
  }
  if (parts.length === 1 && parts[0].includes("lesson")) {
    return { subjectId: null, lessonKey: normalizeLessonKey(parts[0]) };
  }
  return null;
}

export function setLessonRoute(subjectId, lessonKey) {
  const slug = lessonSlugFromKey(lessonKey);
  const next = `#${subjectId}/${slug}`;
  if (location.hash !== next) {
    history.replaceState({ subjectId, lessonKey: slug }, "", next);
  }
}

export function clearLessonRoute() {
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

export async function loadAllCurricula() {
  curriculaBySubject = {};
  await Promise.all(
    CURRICULA_URLS.map(async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.subjectId) curriculaBySubject[data.subjectId] = data;
      } catch {
        /* offline */
      }
    }),
  );
  return curriculaBySubject;
}

export function getCurriculum(subjectId) {
  return curriculaBySubject[subjectId] || null;
}
