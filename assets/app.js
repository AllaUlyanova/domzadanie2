import {
  META,
  SUBJECTS,
  DEMO_TASKS,
  TASKS_SCHEMA_HINT,
  getSubject,
  checkAnswer,
} from "./data.js";
import { initHeroHeadline } from "./text-type.js";
import { renderReviews, initReviewsScrollStack } from "./reviews.js";
import {
  initScrollReveal,
  refreshScrollReveal,
  bumpEl,
  animateProgressBar,
  flashTaskCorrect,
  flashTaskWrong,
  playNotebookStamp,
  popSubjectStamp,
  openLessonMotion,
  maybeCelebrateDay,
  clearCelebration,
} from "./motion.js";

const $ = (sel, root = document) => root.querySelector(sel);

const KEYS = {
  tasks: "school3_tasks_v1",
  catalog: "school3_catalog_v1",
  progress: "school3_progress_v1",
  student: "school3_student_v1",
  theme: "school3_theme",
};

// ---------- Theme ----------
const themeBtn = $("#themeBtn");
function applyTheme(next) {
  document.documentElement.dataset.theme = next;
  localStorage.setItem(KEYS.theme, next);
}
if (themeBtn) {
  const saved = localStorage.getItem(KEYS.theme);
  applyTheme(saved === "dark" ? "dark" : "light");

  const syncThemeLabel = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    themeBtn.textContent = dark ? "День" : "Вечер";
    themeBtn.setAttribute("aria-label", dark ? "Светлая тема" : "Тёмная тема");
  };
  syncThemeLabel();

  themeBtn.addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || "light";
    applyTheme(cur === "light" ? "dark" : "light");
    syncThemeLabel();
  });
}

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

function getAllTasks() {
  const custom = loadJSON(KEYS.tasks, { tasks: [] });
  const uploaded = Array.isArray(custom.tasks) ? custom.tasks : [];
  const ids = new Set(uploaded.map((t) => t.id));
  const demo = DEMO_TASKS.filter((t) => !ids.has(t.id));
  return [...uploaded, ...demo];
}

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadProgress() {
  return loadJSON(KEYS.progress, {});
}

function saveProgress(data) {
  saveJSON(KEYS.progress, data);
}

function getDayState(dateKey = todayKey()) {
  const all = loadProgress();
  if (!all[dateKey]) {
    all[dateKey] = { subjects: {}, startedAt: Date.now() };
  }
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
  saveProgress(all);
}

// ---------- Tasks for day/subject ----------
function tasksForSubject(subjectId, dateKey = todayKey()) {
  const all = getAllTasks();
  const dated = all.filter((t) => t.subjectId === subjectId && t.date === dateKey);
  if (dated.length) return dated;
  return all.filter((t) => t.subjectId === subjectId && !t.date);
}

function subjectStatus(subject, dateKey = todayKey()) {
  const sub = getSubjectState(subject.id, dateKey);
  const tasks = tasksForSubject(subject.id, dateKey);

  if (!subject.written) {
    return sub.notebookDone || sub.status === "done" ? "done" : "optional";
  }
  if (!tasks.length) return "empty";
  if (sub.notebookDone && tasks.every((t) => sub.tasks[t.id]?.correct)) return "done";
  if (tasks.some((t) => sub.tasks[t.id]?.correct)) return "progress";
  return "todo";
}

function countWritableSubjects() {
  return SUBJECTS.filter((s) => s.written).length;
}

function countDoneSubjects(dateKey = todayKey()) {
  return SUBJECTS.filter((s) => subjectStatus(s, dateKey) === "done").length;
}

function countRelevantForProgress(dateKey = todayKey()) {
  return SUBJECTS.filter((s) => {
    const st = subjectStatus(s, dateKey);
    return s.written && st !== "empty";
  }).length;
}

// ---------- UI helpers ----------
let toastT = null;
function toast(text) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add("is-on");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("is-on"), 2000);
}

const STATUS_LABEL = {
  todo: "Начать",
  progress: "Продолжить",
  done: "Готово",
  empty: "Нет заданий",
  optional: "Отметить",
};

const STATUS_CLASS = {
  todo: "",
  progress: "subject-card--progress",
  done: "subject-card--done",
  empty: "subject-card--empty",
  optional: "subject-card--optional",
};

function formatDateFull(d = new Date()) {
  return d.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getStudentName() {
  return localStorage.getItem(KEYS.student)?.trim() || "";
}

function renderStudentName() {
  const name = getStudentName() || "не указан";
  const display = $("#studentNameDisplay");
  if (display) display.textContent = name === "не указан" ? name : name;
  const input = $("#studentNameInput");
  if (input) input.value = getStudentName();
}

let lastProgressPct = -1;

// ---------- Subject cards ----------
function buildSubjectCard(subject, mode, dateKey, index = 0) {
  const st = subjectStatus(subject, dateKey);
  const tasks = tasksForSubject(subject.id, dateKey);
  const subState = getSubjectState(subject.id, dateKey);
  const doneCount = tasks.filter((t) => subState.tasks[t.id]?.correct).length;

  const card = document.createElement("article");
  card.className = `subject-card reveal-in ${STATUS_CLASS[st] || ""}`;
  card.style.animationDelay = `${index * 0.055}s`;
  card.setAttribute("role", "listitem");
  card.dataset.subjectId = subject.id;
  card.style.setProperty("--subject-accent", subject.accent);

  card.innerHTML = `
    ${st === "done" ? '<span class="subject-card__stamp" aria-hidden="true">Готово</span>' : ""}
    <div class="subject-card__icon" aria-hidden="true">${subject.icon}</div>
    <h3 class="subject-card__title">${subject.name}</h3>
    <p class="subject-card__meta muted">
      ${subject.written ? `${doneCount}/${tasks.length || 0} заданий` : "Без письменных заданий"}
    </p>
    <span class="subject-card__badge">${STATUS_LABEL[st]}</span>
  `;

  card.addEventListener("click", () => openLesson(subject.id));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLesson(subject.id);
    }
  });
  card.tabIndex = 0;

  return card;
}

function renderTodayGrid() {
  const grid = $("#todayGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const dk = todayKey();
  SUBJECTS.forEach((s, i) => grid.appendChild(buildSubjectCard(s, "today", dk, i)));
  refreshScrollReveal();
}

function renderCatalogGrid() {
  const grid = $("#catalogGrid");
  if (!grid) return;
  grid.innerHTML = "";
  SUBJECTS.forEach((s, i) => {
    const card = buildSubjectCard(s, "catalog", todayKey(), i);
    const meta = card.querySelector(".subject-card__meta");
    if (meta) {
      meta.textContent = s.textbookHint;
    }
    grid.appendChild(card);
  });
  refreshScrollReveal();
}

function updateDashboard() {
  const dk = todayKey();
  const done = countDoneSubjects(dk);
  const total = SUBJECTS.length;
  const relevant = countRelevantForProgress(dk);
  const writtenDone = SUBJECTS.filter((s) => s.written && subjectStatus(s, dk) === "done").length;
  const writtenTotal = countWritableSubjects();

  const pct = relevant ? Math.round((writtenDone / writtenTotal) * 100) : 0;

  const heroDate = $("#heroDate");
  if (heroDate) heroDate.textContent = formatDateFull();

  const todayDateFull = $("#todayDateFull");
  if (todayDateFull) todayDateFull.textContent = formatDateFull();

  const statProgress = $("#statProgress");
  if (statProgress) statProgress.textContent = `${pct}%`;

  const planBadge = $("#planBadge");
  if (planBadge) planBadge.textContent = `${done} / ${total}`;

  const bar = $("#dayProgressBar");
  animateProgressBar(bar, pct);
  if (pct !== lastProgressPct) {
    bumpEl($("#statProgress"));
    lastProgressPct = pct;
  }

  const todayStatus = $("#todayStatus");
  if (todayStatus) {
    if (done === total) todayStatus.textContent = "День завершён";
    else if (writtenDone > 0) todayStatus.textContent = "В процессе";
    else todayStatus.textContent = "Не начат";
  }

  const statSubjects = $("#statSubjects");
  if (statSubjects) statSubjects.textContent = String(SUBJECTS.length);

  const mini = $("#planMini");
  if (mini) {
    mini.innerHTML = "";
    SUBJECTS.slice(0, 6).forEach((s) => {
      const li = document.createElement("li");
      const st = subjectStatus(s, dk);
      li.className = st === "done" ? "is-done" : "";
      li.textContent = `${s.icon} ${s.name}`;
      mini.appendChild(li);
    });
    if (SUBJECTS.length > 6) {
      const li = document.createElement("li");
      li.className = "muted";
      li.textContent = `+ ещё ${SUBJECTS.length - 6}`;
      mini.appendChild(li);
    }
  }

  maybeCelebrateDay(done, total, dk);
}

function updateLessonSteps(stepIndex) {
  document.querySelectorAll("#lessonSteps li").forEach((li, i) => {
    li.classList.toggle("is-active", i === stepIndex);
    li.classList.toggle("is-done", i < stepIndex);
  });
}

function syncLessonSteps(subject, tasks) {
  const sub = getSubjectState(subject.id);
  const allCorrect = tasks.length > 0 && tasks.every((t) => sub.tasks[t.id]?.correct);
  if (sub.notebookDone) updateLessonSteps(2);
  else if (allCorrect) updateLessonSteps(1);
  else updateLessonSteps(0);
}

// ---------- Lesson ----------
let activeSubjectId = null;

function openLesson(subjectId) {
  const subject = getSubject(subjectId);
  if (!subject) return;

  activeSubjectId = subjectId;
  const section = $("#lesson");
  section?.classList.remove("is-hidden");
  section?.setAttribute("aria-hidden", "false");
  openLessonMotion(section);
  section?.scrollIntoView({ behavior: "smooth", block: "start" });

  $("#lessonTitle").textContent = subject.name;
  const tasks = tasksForSubject(subjectId);
  const ref = tasks[0];
  $("#lessonMeta").textContent = ref
    ? `${ref.workbook || "Рабочая тетрадь"}, стр. ${ref.page || "—"}, ${ref.exercise || ""}`
    : subject.workbookHint;

  $("#lessonBookRef").textContent = `Учебник: ${ref?.textbook || subject.textbookHint}`;

  renderTasks(subject, tasks);
  updateNotebookButton(subject, tasks);
  syncLessonSteps(subject, tasks);
}

function closeLesson() {
  activeSubjectId = null;
  const section = $("#lesson");
  section?.classList.add("is-hidden");
  section?.setAttribute("aria-hidden", "true");
  $("#today")?.scrollIntoView({ behavior: "smooth", block: "start" });
  renderTodayGrid();
  updateDashboard();
  renderJournal();
}

function updateNotebookButton(subject, tasks) {
  const btn = $("#markNotebookBtn");
  if (!btn) return;

  const sub = getSubjectState(subject.id);
  const allCorrect = tasks.length > 0 && tasks.every((t) => sub.tasks[t.id]?.correct);

  if (!subject.written) {
    btn.disabled = false;
    btn.textContent = sub.notebookDone ? "Отмечено" : "Отметить выполнение";
    return;
  }

  if (!tasks.length) {
    btn.disabled = true;
    btn.textContent = "Сначала загрузите задания";
    return;
  }

  btn.disabled = !allCorrect;
  btn.textContent = sub.notebookDone ? "В тетради ✓" : "Я переписал в тетрадь";
}

function renderTasks(subject, tasks) {
  const list = $("#taskList");
  const empty = $("#lessonEmpty");
  if (!list || !empty) return;

  list.innerHTML = "";
  if (!tasks.length) {
    empty.classList.remove("is-hidden");
    empty.textContent = subject.written
      ? "Заданий пока нет. Родитель может загрузить файл с заданиями в разделе «Учебники»."
      : "Письменных заданий на сайте нет. Выполните задание учителя и нажмите «Отметить выполнение».";
    return;
  }
  empty.classList.add("is-hidden");

  const sub = getSubjectState(subject.id);

  tasks.forEach((task, index) => {
    const state = sub.tasks[task.id] || {};
    const card = document.createElement("article");
    card.className = "task card";
    card.dataset.taskId = task.id;

    const inputHtml =
      task.type === "choice"
        ? `<select class="input task__input" data-task-input>
            <option value="">Выберите ответ</option>
            ${(task.options || [])
              .map((o) => `<option value="${escapeHtml(o)}" ${state.last === o ? "selected" : ""}>${escapeHtml(o)}</option>`)
              .join("")}
          </select>`
        : `<input class="input task__input" data-task-input type="text" value="${escapeHtml(state.last || "")}" placeholder="Ваш ответ" />`;

    card.innerHTML = `
      <div class="task__head">
        <span class="badge">Задание ${index + 1}</span>
        <span class="muted task__ref">${escapeHtml(String(task.workbook || ""))} · стр. ${escapeHtml(String(task.page ?? "—"))} · ${escapeHtml(task.exercise || "")}</span>
      </div>
      <p class="task__prompt">${escapeHtml(task.prompt)}</p>
      ${inputHtml}
      <div class="task__actions">
        <button type="button" class="btn btn--primary" data-check>Проверить</button>
        <button type="button" class="btn btn--ghost" data-hint>Подсказка</button>
      </div>
      <div class="task__feedback" data-feedback></div>
      <p class="task__notebook muted"><strong>В тетрадь:</strong> ${escapeHtml(task.notebook || "Перепишите решение аккуратно.")}</p>
    `;

    const feedback = card.querySelector("[data-feedback]");
    if (state.correct) {
      feedback.innerHTML = `<div class="msg msg--ok">Верно! Теперь перепишите в тетрадь.</div>`;
    }

    card.querySelector("[data-check]")?.addEventListener("click", () => {
      const input = card.querySelector("[data-task-input]");
      const value = input?.value ?? "";
      const result = checkAnswer(task, value);
      const subj = getSubjectState(subject.id);
      subj.tasks[task.id] = { last: value, correct: result.ok, checkedAt: Date.now() };

      if (result.ok) {
        feedback.innerHTML = `<div class="msg msg--ok">Верно! Не забудьте перенести в тетрадь.</div>`;
        flashTaskCorrect(card);
        toast("Верно!");
      } else if (result.reason === "empty") {
        feedback.innerHTML = `<div class="msg msg--err">Введите ответ.</div>`;
        flashTaskWrong(card, input);
      } else {
        feedback.innerHTML = `<div class="msg msg--err">Пока неверно. Попробуйте ещё или нажмите «Подсказка».</div>`;
        flashTaskWrong(card, input);
        toast("Попробуйте ещё раз");
      }

      persistDay(todayKey());
      updateNotebookButton(subject, tasks);
      syncLessonSteps(subject, tasks);
      updateDashboard();
    });

    card.querySelector("[data-hint]")?.addEventListener("click", () => {
      feedback.innerHTML = `<div class="msg">${escapeHtml(task.hint || "Подумайте и попробуйте снова.")}</div>`;
    });

    list.appendChild(card);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

$("#backToTodayBtn")?.addEventListener("click", closeLesson);

$("#markNotebookBtn")?.addEventListener("click", () => {
  if (!activeSubjectId) return;
  const subject = getSubject(activeSubjectId);
  const sub = getSubjectState(activeSubjectId);
  const wasDone = sub.notebookDone;
  sub.notebookDone = true;
  sub.status = "done";
  persistDay(todayKey());
  playNotebookStamp($("#markNotebookBtn"));
  toast("Отлично! Тетрадь отмечена.");
  const tasks = tasksForSubject(activeSubjectId);
  updateNotebookButton(subject, tasks);
  syncLessonSteps(subject, tasks);
  renderTodayGrid();
  if (!wasDone) {
    const card = document.querySelector(`.subject-card[data-subject-id="${activeSubjectId}"]`);
    popSubjectStamp(card);
  }
  updateDashboard();
  renderJournal();
});

$("#resetDayBtn")?.addEventListener("click", () => {
  if (!confirm("Сбросить прогресс за сегодня?")) return;
  const dk = todayKey();
  const all = loadProgress();
  delete all[dk];
  saveProgress(all);
  clearCelebration(dk);
  renderTodayGrid();
  updateDashboard();
  renderJournal();
  toast("День сброшен.");
});

$("#continueDayBtn")?.addEventListener("click", () => {
  const next = SUBJECTS.find((s) => subjectStatus(s) !== "done");
  if (next) openLesson(next.id);
  else $("#today")?.scrollIntoView({ behavior: "smooth" });
});

// ---------- Upload ----------
function mergeTasks(payload) {
  const incoming = Array.isArray(payload.tasks) ? payload.tasks : Array.isArray(payload) ? payload : [];
  if (!incoming.length) throw new Error("В файле нет массива tasks");

  for (const t of incoming) {
    if (!t.id || !t.subjectId || !t.prompt || t.answer === undefined) {
      throw new Error(`Задание ${t.id || "?"}: нужны id, subjectId, prompt, answer`);
    }
    if (!getSubject(t.subjectId)) {
      throw new Error(`Неизвестный предмет: ${t.subjectId}`);
    }
  }

  const current = loadJSON(KEYS.tasks, { tasks: [] });
  const map = new Map((current.tasks || []).map((t) => [t.id, t]));
  incoming.forEach((t) => map.set(t.id, t));
  saveJSON(KEYS.tasks, { tasks: [...map.values()] });
  return map.size;
}

function renderCatalog() {
  const list = $("#catalogList");
  if (!list) return;
  const catalog = loadJSON(KEYS.catalog, { books: [] });
  const custom = loadJSON(KEYS.tasks, { tasks: [] });
  const count = getAllTasks().length;

  if (!catalog.books?.length && !custom.tasks?.length) {
    list.innerHTML = `<div class="muted">Демо‑задания активны (${DEMO_TASKS.length} шт.). Загрузите свой JSON.</div>`;
    return;
  }

  list.innerHTML = "";
  const summary = document.createElement("div");
  summary.className = "list__item";
  summary.innerHTML = `<div class="list__title">Всего заданий в базе: ${count}</div>`;
  list.appendChild(summary);

  (catalog.books || []).forEach((b) => {
    const item = document.createElement("div");
    item.className = "list__item";
    item.innerHTML = `
      <div class="list__title">${escapeHtml(b.title || "Без названия")}</div>
      <div class="list__meta">${escapeHtml(b.subjectId || "")} · ${escapeHtml(b.type || "учебник")}</div>
    `;
    list.appendChild(item);
  });
}

$("#schemaPre") && ($("#schemaPre").textContent = TASKS_SCHEMA_HINT);

$("#pickTasksBtn")?.addEventListener("click", () => $("#tasksFileInput")?.click());

$("#tasksFileInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const msg = $("#uploadMsg");
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const total = mergeTasks(json);
    msg.innerHTML = `<div class="msg msg--ok">Загружено. В базе ${total} заданий.</div>`;
    renderCatalog();
    renderTodayGrid();
    if (activeSubjectId) openLesson(activeSubjectId);
    toast("Задания обновлены");
  } catch (err) {
    msg.innerHTML = `<div class="msg msg--err">${escapeHtml(err.message || "Ошибка файла")}</div>`;
  }
  e.target.value = "";
});

$("#loadSampleBtn")?.addEventListener("click", async () => {
  const msg = $("#uploadMsg");
  try {
    const res = await fetch("./content/tasks/example-tasks.json");
    if (!res.ok) throw new Error("Файл примера не найден");
    const json = await res.json();
    const total = mergeTasks(json);
    msg.innerHTML = `<div class="msg msg--ok">Пример загружен. В базе ${total} заданий.</div>`;
    renderCatalog();
    renderTodayGrid();
  } catch (err) {
    msg.innerHTML = `<div class="msg msg--err">${escapeHtml(err.message)}</div>`;
  }
});

// ---------- Journal ----------
function renderJournal() {
  const list = $("#journalList");
  if (!list) return;
  const all = loadProgress();
  const keys = Object.keys(all).sort().reverse().slice(0, 14);

  if (!keys.length) {
    list.innerHTML = "Пока нет записей.";
    return;
  }

  list.innerHTML = "";
  keys.forEach((dk) => {
    const day = all[dk];
    const done = SUBJECTS.filter((s) => {
      const fake = { ...day, subjects: day.subjects };
      return subjectStatus(s, dk) === "done";
    }).length;

    const item = document.createElement("div");
    item.className = "list__item";
    item.innerHTML = `
      <div class="list__title">${dk}</div>
      <div class="list__meta">Готово предметов: ${done} / ${SUBJECTS.length}</div>
    `;
    list.appendChild(item);
  });
}

$("#clearJournalBtn")?.addEventListener("click", () => {
  if (!confirm("Удалить весь дневник прогресса?")) return;
  saveProgress({});
  renderJournal();
  renderTodayGrid();
  updateDashboard();
  toast("Дневник очищен");
});

// ---------- Student settings ----------
const settingsDialog = $("#settingsDialog");

function saveStudent(name) {
  localStorage.setItem(KEYS.student, name.trim());
  renderStudentName();
}

$("#saveStudentBtn")?.addEventListener("click", () => {
  saveStudent($("#studentNameInput")?.value || "");
  toast("Имя сохранено");
});

$("#settingsBtn")?.addEventListener("click", () => {
  const input = $("#studentNameDialog");
  if (input) input.value = getStudentName();
  settingsDialog?.showModal();
});

$("#saveStudentDialogBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  saveStudent($("#studentNameDialog")?.value || "");
  settingsDialog?.close();
  toast("Имя сохранено");
});

// ---------- Init ----------
function boot() {
  renderStudentName();
  renderTodayGrid();
  renderCatalogGrid();
  updateDashboard();
  renderJournal();
  renderReviews();
  initHeroHeadline();
  initScrollReveal();
  initReviewsScrollStack();
  requestAnimationFrame(() => refreshScrollReveal());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
// Drag & drop on upload zone
const uploadZone = $("#uploadZone");
uploadZone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("is-drag");
});
uploadZone?.addEventListener("dragleave", () => uploadZone.classList.remove("is-drag"));
uploadZone?.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("is-drag");
  const file = e.dataTransfer?.files?.[0];
  if (file && $("#tasksFileInput")) {
    const dt = new DataTransfer();
    dt.items.add(file);
    $("#tasksFileInput").files = dt.files;
    $("#tasksFileInput").dispatchEvent(new Event("change"));
  }
});
