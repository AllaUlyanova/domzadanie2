/**
 * Страница урока: lesson.html?subject=math&id=5
 * Список уроков: lesson.html?subject=math
 *
 * Все карточки генерируются через map() — без querySelector(".lesson5").
 */

import { SUBJECTS, DEMO_TASKS, getSubject, checkAnswer } from "../assets/data.js";
import {
  loadAllCurricula,
  getLessonsData,
  filterTasksByLessonKey,
  findLesson,
  normalizeLessonKey,
  parseLessonRoute,
  buildLessonListUrl,
  buildLessonPageUrl,
} from "../assets/lessons-engine.js";

const $ = (sel, root = document) => root.querySelector(sel);

const KEYS = {
  tasks: "school3_tasks_v1",
  progress: "school3_progress_v1",
  lesson: "school3_lesson_v1",
};

const BUNDLED_TASK_URLS = [
  "./content/tasks/english-spotlight-3.json",
  "./content/tasks/math-moro-3.json",
];

let bundledTasks = [];
let serverCatalog = null;

// ---------- Storage ----------
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDayState(dateKey = todayKey()) {
  const all = loadJSON(KEYS.progress, {});
  if (!all[dateKey]) all[dateKey] = { subjects: {}, startedAt: Date.now() };
  return { all, day: all[dateKey], dateKey };
}

function getSubjectState(subjectId, dateKey = todayKey()) {
  const { day } = getDayState(dateKey);
  if (!day.subjects[subjectId]) {
    day.subjects[subjectId] = { tasks: {}, notebookDone: false, status: "todo" };
  }
  return day.subjects[subjectId];
}

function persistDay(dateKey) {
  const { all, day } = getDayState(dateKey);
  all[dateKey] = day;
  saveJSON(KEYS.progress, all);
}

async function loadBundledTasks() {
  bundledTasks = [];
  for (const url of BUNDLED_TASK_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data.tasks)) bundledTasks.push(...data.tasks);
    } catch {
      /* offline */
    }
  }
}

async function loadCatalog() {
  try {
    const res = await fetch("./content/catalog.json");
    if (res.ok) serverCatalog = await res.json();
  } catch {
    /* offline */
  }
}

function getCatalogBooks() {
  return serverCatalog?.books || [];
}

function getAllTasks() {
  const custom = loadJSON(KEYS.tasks, { tasks: [] });
  const uploaded = Array.isArray(custom.tasks) ? custom.tasks : [];
  const uploadedIds = new Set(uploaded.map((t) => t.id));
  const bundled = bundledTasks.filter((t) => !uploadedIds.has(t.id));
  const allIds = new Set([...uploaded, ...bundled].map((t) => t.id));
  const hasEnglishBundled = bundled.some((t) => t.subjectId === "english");
  const hasMathBundled = bundled.some((t) => t.subjectId === "math");
  const demo = DEMO_TASKS.filter((t) => {
    if (allIds.has(t.id)) return false;
    if (hasEnglishBundled && t.subjectId === "english") return false;
    if (hasMathBundled && t.subjectId === "math") return false;
    return true;
  });
  return [...uploaded, ...bundled, ...demo];
}

function tasksForSubject(subjectId) {
  const all = getAllTasks();
  const dk = todayKey();
  const dated = all.filter((t) => t.subjectId === subjectId && t.date === dk);
  const list = dated.length ? dated : all.filter((t) => t.subjectId === subjectId && !t.date);
  return list.sort((a, b) => {
    const ua = a.unit ?? 999;
    const ub = b.unit ?? 999;
    if (ua !== ub) return ua - ub;
    return (Number(a.page) || 0) - (Number(b.page) || 0);
  });
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getBookForLesson(subjectId, lesson) {
  const books = getCatalogBooks().filter((b) => b.subjectId === subjectId);
  if (lesson?.partBookId) return books.find((b) => b.id === lesson.partBookId) || books[0];
  return books[0] || null;
}

function homeworkStats(subjectId, tasks) {
  const sub = getSubjectState(subjectId);
  let correct = 0;
  let wrong = 0;
  let pending = 0;
  tasks.forEach((t) => {
    const st = sub.tasks[t.id];
    if (!st?.checkedAt) {
      pending += 1;
      return;
    }
    if (st.correct) correct += 1;
    else wrong += 1;
  });
  return { correct, wrong, pending, total: tasks.length };
}

// ---------- UI states ----------
function showLoading() {
  $("#lessonLoading")?.classList.remove("is-hidden");
  $("#lessonNotFound")?.classList.add("is-hidden");
  $("#lessonListView")?.classList.add("is-hidden");
  $("#lessonDetailView")?.classList.add("is-hidden");
}

function hideLoading() {
  $("#lessonLoading")?.classList.add("is-hidden");
}

function showNotFound(message) {
  hideLoading();
  $("#lessonListView")?.classList.add("is-hidden");
  $("#lessonDetailView")?.classList.add("is-hidden");
  const box = $("#lessonNotFound");
  if (!box) return;
  box.classList.remove("is-hidden");
  const text = $("#lessonNotFoundText");
  if (text) text.textContent = message || "Урок не найден";
}

function showListView() {
  hideLoading();
  $("#lessonNotFound")?.classList.add("is-hidden");
  $("#lessonDetailView")?.classList.add("is-hidden");
  $("#lessonListView")?.classList.remove("is-hidden");
}

function showDetailView() {
  hideLoading();
  $("#lessonNotFound")?.classList.add("is-hidden");
  $("#lessonListView")?.classList.add("is-hidden");
  $("#lessonDetailView")?.classList.remove("is-hidden");
}

// ---------- Render: список уроков (map) ----------
function renderLessonList(subject, lessonsData, allTasks) {
  showListView();
  const sub = getSubjectState(subject.id);

  $("#lessonListSubjectLabel").textContent = subject.name;
  $("#lessonListTitle").textContent = `Уроки: ${subject.name}`;
  $("#lessonListMeta").textContent = `${lessonsData.length} уроков · выберите карточку`;

  const grid = $("#lessonListGrid");
  if (!grid) return;

  grid.innerHTML = lessonsData
    .map((lesson) => {
      const lessonTasks = filterTasksByLessonKey(allTasks, lesson.key);
      const done = lessonTasks.filter((t) => sub.tasks[t.id]?.correct).length;
      const href = buildLessonPageUrl(subject.id, lesson.key);
      const cardClass = lesson.hasTasks
        ? "lesson-picker__card lesson-route-card"
        : "lesson-picker__card lesson-picker__card--book lesson-route-card";
      const countLabel = lesson.hasTasks
        ? `${lessonTasks.length} заданий на сайте`
        : `📖 ${lesson.partLabel || "Учебник"}`;
      const prog = lesson.hasTasks ? `${done} / ${lessonTasks.length} верно` : "Открыть →";
      const active =
        parseLessonRoute()?.lessonKey === lesson.key ? " lesson-route-card--active" : "";

      return `
        <a href="${escapeHtml(href)}" class="${cardClass}${active}" data-lesson-key="${escapeHtml(lesson.key)}">
          <strong class="lesson-picker__name">${escapeHtml(lesson.title)}</strong>
          <span class="lesson-picker__count">${countLabel}</span>
          <span class="lesson-picker__prog muted">${prog}</span>
        </a>`;
    })
    .join("");

  renderMaterials(subject.id, "#lessonListMaterials");
}

// ---------- Render: один урок ----------
function renderLessonDetail(subject, lesson, allTasks) {
  if (!lesson) {
    showNotFound("Урок не найден. Вернитесь к списку уроков.");
    return;
  }

  showDetailView();
  const tasks = filterTasksByLessonKey(allTasks, lesson.key);
  const stats = homeworkStats(subject.id, tasks);
  const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;

  document.title = `${lesson.title} — ${subject.name} | Умный Дневник AI`;

  $("#lessonDetailSubject").textContent = subject.name;
  $("#lessonDetailTitle").textContent = lesson.title;
  $("#lessonDetailNumber").textContent =
    typeof lesson.unit === "number" ? `Урок № ${lesson.unit}` : `Урок`;

  const pages = [...new Set(tasks.map((t) => t.page).filter((p) => p != null))].sort(
    (a, b) => Number(a) - Number(b),
  );
  $("#lessonDetailMeta").textContent = tasks.length
    ? `${tasks.length} заданий${pages.length ? ` · стр. ${pages.join(", ")}` : ""}`
    : "Работа по учебнику";

  const bar = $("#lessonProgressBar");
  if (bar) bar.style.width = `${pct}%`;
  $("#lessonProgressText").textContent = stats.total
    ? `${stats.correct} / ${stats.total} верно · ${pct}%`
    : "Откройте учебник и выполните задания в тетради";

  $("#lessonStatCorrect").textContent = String(stats.correct);
  $("#lessonStatWrong").textContent = String(stats.wrong);
  $("#lessonStatPending").textContent = String(stats.pending);

  const book = getBookForLesson(subject.id, lesson);
  $("#lessonBookRef").textContent = book ? book.title : subject.textbookHint;

  renderMaterials(subject.id, "#lessonDetailMaterials");
  renderTasks(subject, lesson, tasks);
  updateNotebookButton(subject, tasks);
  syncSteps(subject, tasks);

  const listUrl = buildLessonListUrl(subject.id);
  const back = $("#backToListLink");
  if (back) back.href = listUrl;
}

function renderMaterials(subjectId, containerSel) {
  const box = $(containerSel);
  if (!box) return;
  const books = getCatalogBooks().filter((b) => b.subjectId === subjectId);
  if (!books.length) {
    box.innerHTML = "";
    box.classList.add("is-hidden");
    return;
  }
  box.classList.remove("is-hidden");
  box.innerHTML = `
    <h3 class="lesson-materials__title">📚 Материалы</h3>
    <div class="lesson-materials__grid">
      ${books
        .map(
          (b) => `
        <a class="lesson-materials__card" href="./${escapeHtml(b.file || "")}" target="_blank" rel="noopener">
          <span class="lesson-materials__card-icon">📖</span>
          <span class="lesson-materials__card-title">${escapeHtml(b.title)}</span>
          <span class="lesson-materials__card-cta">PDF →</span>
        </a>`,
        )
        .join("")}
    </div>
  `;
}

function renderTasks(subject, lesson, tasks) {
  const list = $("#taskList");
  const empty = $("#lessonEmpty");
  if (!list || !empty) return;
  list.innerHTML = "";

  if (!tasks.length) {
    empty.classList.remove("is-hidden");
    const book = getBookForLesson(subject.id, lesson);
    empty.innerHTML = `
      <p><strong>${escapeHtml(lesson.title)}</strong></p>
      <p class="muted">Для этого урока пока нет заданий с автопроверкой на сайте. Откройте учебник, сделайте домашку в тетради.</p>
      ${
        book
          ? `<p><a class="dz-btn dz-btn--primary" href="./${escapeHtml(book.file)}" target="_blank">📖 ${escapeHtml(book.title)}</a></p>`
          : ""
      }
    `;
    $("#homeworkResult")?.classList.add("is-hidden");
    return;
  }

  empty.classList.add("is-hidden");
  const sub = getSubjectState(subject.id);

  const heading = document.createElement("p");
  heading.className = "task-list__heading muted";
  heading.textContent =
    tasks.length > 1
      ? `В уроке ${tasks.length} заданий — ответьте в каждом поле:`
      : "Задание урока:";
  list.appendChild(heading);

  tasks.forEach((task, index) => {
    const state = sub.tasks[task.id] || {};
    const card = document.createElement("article");
    card.className = "task card";
    card.dataset.taskId = task.id;

    const inputHtml =
      task.type === "choice"
        ? `<select class="dz-input task__input" data-task-input>
            <option value="">Выберите ответ</option>
            ${(task.options || [])
              .map(
                (o) =>
                  `<option value="${escapeHtml(o)}" ${state.last === o ? "selected" : ""}>${escapeHtml(o)}</option>`,
              )
              .join("")}
          </select>`
        : `<input class="dz-input task__input" type="text" value="${escapeHtml(state.last || "")}" placeholder="Ваш ответ" />`;

    card.innerHTML = `
      <div class="task__head">
        <span class="badge">Задание ${index + 1}</span>
        <span class="muted task__ref">стр. ${escapeHtml(String(task.page ?? "—"))} · ${escapeHtml(task.exercise || "")}</span>
      </div>
      <p class="task__prompt">${escapeHtml(task.prompt)}</p>
      ${inputHtml}
      <div class="task__actions">
        <button type="button" class="dz-btn dz-btn--primary" data-check>Проверить</button>
        <button type="button" class="dz-btn dz-btn--ghost" data-hint>Подсказка</button>
      </div>
      <div class="task__feedback" data-feedback></div>
      <p class="task__notebook muted"><strong>В тетрадь:</strong> ${escapeHtml(task.notebook || "Перепишите решение.")}</p>
    `;

    if (state.correct) {
      card.querySelector("[data-feedback]").innerHTML =
        `<div class="msg msg--ok">Верно!</div>`;
    }

    card.querySelector("[data-check]")?.addEventListener("click", () => {
      const input = card.querySelector("[data-task-input]");
      const value = input?.value ?? "";
      const result = checkAnswer(task, value);
      const subj = getSubjectState(subject.id);
      subj.tasks[task.id] = { last: value, correct: result.ok, checkedAt: Date.now() };
      const fb = card.querySelector("[data-feedback]");
      if (result.ok) {
        fb.innerHTML = `<div class="msg msg--ok">Верно!</div>`;
        card.classList.add("task--correct");
      } else if (result.reason === "empty") {
        fb.innerHTML = `<div class="msg msg--err">Введите ответ.</div>`;
      } else {
        fb.innerHTML = `<div class="msg msg--err">Пока неверно. Попробуйте ещё.</div>`;
        card.classList.remove("task--correct");
      }
      persistDay(todayKey());
      renderHomeworkResult(subject, lesson, tasks);
      updateNotebookButton(subject, tasks);
      syncSteps(subject, tasks);
      const lessonTasks = filterTasksByLessonKey(tasksForSubject(subject.id), lesson.key);
      const st = homeworkStats(subject.id, lessonTasks);
      const p = st.total ? Math.round((st.correct / st.total) * 100) : 0;
      $("#lessonProgressBar").style.width = `${p}%`;
      $("#lessonProgressText").textContent = `${st.correct} / ${st.total} верно · ${p}%`;
    });

    card.querySelector("[data-hint]")?.addEventListener("click", () => {
      card.querySelector("[data-feedback]").innerHTML = `<div class="msg">${escapeHtml(task.hint || "Подумайте ещё.")}</div>`;
    });

    list.appendChild(card);
  });

  renderHomeworkResult(subject, lesson, tasks);
}

function renderHomeworkResult(subject, lesson, tasks) {
  const box = $("#homeworkResult");
  if (!box || !tasks.length) {
    box?.classList.add("is-hidden");
    return;
  }
  const { correct, wrong, pending, total } = homeworkStats(subject.id, tasks);
  const pct = total ? Math.round((correct / total) * 100) : 0;
  box.classList.remove("is-hidden");
  box.innerHTML = `
    <div class="glass homework-result__inner">
      <strong>Результат урока</strong>
      <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
      <p class="muted">✓ ${correct} · ✗ ${wrong} · ○ ${pending}</p>
      <button type="button" class="dz-btn dz-btn--primary" id="checkAllBtn">Проверить всё</button>
    </div>
  `;
  $("#checkAllBtn")?.addEventListener("click", () => {
    tasks.forEach((task) => {
      const card = document.querySelector(`[data-task-id="${task.id}"]`);
      const input = card?.querySelector("[data-task-input]");
      const value = input?.value ?? "";
      if (!String(value).trim()) return;
      const result = checkAnswer(task, value);
      const subj = getSubjectState(subject.id);
      subj.tasks[task.id] = { last: value, correct: result.ok, checkedAt: Date.now() };
    });
    persistDay(todayKey());
    renderLessonDetail(subject, lesson, tasksForSubject(subject.id));
  });
}

function updateNotebookButton(subject, tasks) {
  const btn = $("#markNotebookBtn");
  if (!btn) return;
  const sub = getSubjectState(subject.id);
  const allCorrect = tasks.length > 0 && tasks.every((t) => sub.tasks[t.id]?.correct);
  if (!tasks.length) {
    btn.disabled = false;
    btn.textContent = sub.notebookDone ? "В тетради ✓" : "Я переписал в тетрадь";
    return;
  }
  btn.disabled = !allCorrect;
  btn.textContent = sub.notebookDone ? "В тетради ✓" : "Я переписал в тетрадь";
}

function syncSteps(subject, tasks) {
  const sub = getSubjectState(subject.id);
  const allCorrect = tasks.length > 0 && tasks.every((t) => sub.tasks[t.id]?.correct);
  let step = 0;
  if (sub.notebookDone) step = 2;
  else if (allCorrect) step = 1;
  document.querySelectorAll("#lessonSteps li").forEach((li, i) => {
    li.classList.toggle("is-active", i === step);
    li.classList.toggle("is-done", i < step);
  });
}

// ---------- Init ----------
async function init() {
  showLoading();

  const route = parseLessonRoute();
  if (!route?.subjectId) {
    showNotFound("Не указан предмет. Откройте урок из раздела «Предметы» на главной.");
    return;
  }

  const subject = getSubject(route.subjectId);
  if (!subject) {
    showNotFound(`Предмет «${route.subjectId}» не найден.`);
    return;
  }

  await Promise.all([loadBundledTasks(), loadCatalog(), loadAllCurricula()]);

  const allTasks = tasksForSubject(subject.id);
  const lessonsData = getLessonsData(subject.id, allTasks);

  if (!lessonsData.length) {
    showNotFound("Для этого предмета пока нет каталога уроков. Добавьте content/lessons/{subject}.json");
    return;
  }

  if (route.lessonKey) {
    const lesson = findLesson(lessonsData, route.lessonKey);
    if (!lesson) {
      showNotFound(`Урок «${route.lessonKey}» не найден в программе ${subject.name}.`);
      $("#lessonNotFoundBack").href = buildLessonListUrl(subject.id);
      return;
    }
    localStorage.setItem(`${KEYS.lesson}_${subject.id}`, lesson.key);
    renderLessonDetail(subject, lesson, allTasks);
    $("#markNotebookBtn")?.addEventListener("click", () => {
      const sub = getSubjectState(subject.id);
      sub.notebookDone = true;
      persistDay(todayKey());
      const t = filterTasksByLessonKey(allTasks, lesson.key);
      updateNotebookButton(subject, t);
      syncSteps(subject, t);
    });
    return;
  }

  renderLessonList(subject, lessonsData, allTasks);
}

$("#themeBtn")?.addEventListener("click", () => {
  const html = document.documentElement;
  const dark = html.dataset.theme === "dark";
  html.dataset.theme = dark ? "light" : "dark";
  localStorage.setItem("school3_theme", html.dataset.theme);
});

const savedTheme = localStorage.getItem("school3_theme");
if (savedTheme === "dark") document.documentElement.dataset.theme = "dark";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
