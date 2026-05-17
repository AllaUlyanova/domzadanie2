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

const BUNDLED_TASK_URLS = ["./content/tasks/english-spotlight-3.json"];
let bundledTasks = [];
let serverCatalog = null;

async function loadBundledTasksFromServer() {
  bundledTasks = [];
  for (const url of BUNDLED_TASK_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data.tasks)) bundledTasks.push(...data.tasks);
    } catch {
      /* сервер не запущен */
    }
  }
}

async function loadServerCatalog() {
  try {
    const res = await fetch("./content/catalog.json");
    if (res.ok) serverCatalog = await res.json();
  } catch {
    /* offline */
  }
}

function getCatalogBooks() {
  const local = loadJSON(KEYS.catalog, { books: [] });
  if (serverCatalog?.books?.length) return serverCatalog.books;
  return local.books || [];
}

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
  const uploadedIds = new Set(uploaded.map((t) => t.id));
  const bundled = bundledTasks.filter((t) => !uploadedIds.has(t.id));
  const allIds = new Set([...uploaded, ...bundled].map((t) => t.id));
  const hasEnglishBundled = bundled.some((t) => t.subjectId === "english");
  const demo = DEMO_TASKS.filter((t) => {
    if (allIds.has(t.id)) return false;
    if (hasEnglishBundled && t.subjectId === "english") return false;
    return true;
  });
  return [...uploaded, ...bundled, ...demo];
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
  const list = dated.length
    ? dated
    : all.filter((t) => t.subjectId === subjectId && !t.date);
  return list.sort((a, b) => {
    const ua = a.unit ?? 999;
    const ub = b.unit ?? 999;
    if (ua !== ub) return ua - ub;
    return (Number(a.page) || 0) - (Number(b.page) || 0);
  });
}

function homeworkStats(subject, tasks) {
  const sub = getSubjectState(subject.id);
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

function renderLessonMaterials(subjectId) {
  const box = $("#lessonMaterials");
  if (!box) return;
  const books = getCatalogBooks().filter((b) => b.subjectId === subjectId);
  if (!books.length) {
    box.classList.add("is-hidden");
    box.innerHTML = "";
    return;
  }
  box.classList.remove("is-hidden");
  const subject = getSubject(subjectId);
  box.innerHTML = `
    <h3 class="lesson-materials__title">📚 Материалы${subject?.umk ? ` · ${escapeHtml(subject.umk)}` : ""}</h3>
    <p class="muted lesson-materials__lead">Откройте PDF, найдите страницу из задания, затем введите ответ ниже.</p>
    <ul class="lesson-materials__list">
      ${books
        .map(
          (b) => `
        <li>
          <a class="lesson-materials__link" href="./${escapeHtml(b.file || "")}" target="_blank" rel="noopener">
            ${escapeHtml(b.title || "PDF")}
          </a>
          <span class="muted lesson-materials__type">${escapeHtml(b.type || "")}</span>
        </li>`,
        )
        .join("")}
    </ul>
  `;
}

function renderHomeworkResult(subject, tasks) {
  const box = $("#homeworkResult");
  if (!box) return;
  if (!tasks.length) {
    box.classList.add("is-hidden");
    box.innerHTML = "";
    return;
  }
  const { correct, wrong, pending, total } = homeworkStats(subject, tasks);
  const checked = correct + wrong;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const allDone = pending === 0;
  const allCorrect = allDone && correct === total;

  let verdict = "Проверьте задания по одному или нажмите «Проверить всё».";
  let verdictClass = "";
  if (allCorrect) {
    verdict = "Отлично! Все ответы верны. Можно переписывать в тетрадь.";
    verdictClass = "msg--ok";
  } else if (allDone && wrong > 0) {
    verdict = "Есть ошибки — исправьте и нажмите «Проверить» ещё раз.";
    verdictClass = "msg--err";
  } else if (checked > 0) {
    verdict = `Проверено ${checked} из ${total}. Продолжайте!`;
    verdictClass = "";
  }

  box.classList.remove("is-hidden");
  box.innerHTML = `
    <div class="homework-result__inner card">
      <div class="homework-result__head">
        <strong>Результат домашней работы</strong>
        <span class="badge">${correct} / ${total} верно</span>
      </div>
      <div class="progress homework-result__bar" aria-hidden="true">
        <div class="progress__bar" style="width: ${pct}%"></div>
      </div>
      <ul class="homework-result__stats muted">
        <li>✓ Верно: <strong>${correct}</strong></li>
        <li>✗ Ошибок: <strong>${wrong}</strong></li>
        <li>○ Не проверено: <strong>${pending}</strong></li>
      </ul>
      <p class="msg ${verdictClass} homework-result__verdict">${escapeHtml(verdict)}</p>
      <button type="button" class="btn btn--primary" id="checkAllHomeworkBtn">Проверить всё</button>
    </div>
  `;

}

function checkAllHomework(subject, tasks) {
  const list = $("#taskList");
  if (!list) return;
  let any = false;
  tasks.forEach((task) => {
    const card = list.querySelector(`[data-task-id="${task.id}"]`);
    if (!card) return;
    const input = card.querySelector("[data-task-input]");
    const value = input?.value ?? "";
    if (!String(value).trim()) return;
    any = true;
    const result = checkAnswer(task, value);
    const subj = getSubjectState(subject.id);
    subj.tasks[task.id] = { last: value, correct: result.ok, checkedAt: Date.now() };
    const feedback = card.querySelector("[data-feedback]");
    if (result.ok) {
      feedback.innerHTML = '<div class="msg msg--ok">Верно!</div>';
      flashTaskCorrect(card);
    } else {
      feedback.innerHTML = '<div class="msg msg--err">Неверно. Попробуйте ещё.</div>';
      flashTaskWrong(card, input);
    }
  });
  if (!any) {
    toast("Сначала введите ответы в поля");
    return;
  }
  persistDay(todayKey());
  updateNotebookButton(subject, tasks);
  syncLessonSteps(subject, tasks);
  updateDashboard();
  renderHomeworkResult(subject, tasks);
  toast("Проверка завершена");
}

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

  renderLessonMaterials(subjectId);
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
    $("#homeworkResult")?.classList.add("is-hidden");
    $("#lessonMaterials")?.classList.add("is-hidden");
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
      ${task.unitTitle ? `<p class="task__unit muted">${escapeHtml(task.unitTitle)}</p>` : ""}
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
      renderHomeworkResult(subject, tasks);
    });

    card.querySelector("[data-hint]")?.addEventListener("click", () => {
      feedback.innerHTML = `<div class="msg">${escapeHtml(task.hint || "Подумайте и попробуйте снова.")}</div>`;
    });

    list.appendChild(card);
  });

  renderHomeworkResult(subject, tasks);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

$("#homeworkResult")?.addEventListener("click", (e) => {
  if (e.target.id !== "checkAllHomeworkBtn" || !activeSubjectId) return;
  const subject = getSubject(activeSubjectId);
  if (!subject) return;
  checkAllHomework(subject, tasksForSubject(activeSubjectId));
});

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
  const books = getCatalogBooks();
  const count = getAllTasks().length;
  const enCount = getAllTasks().filter((t) => t.subjectId === "english").length;

  if (!books.length && count <= DEMO_TASKS.length) {
    list.innerHTML = `<div class="muted">Демо‑задания активны (${DEMO_TASKS.length} шт.). Загрузите свой JSON.</div>`;
    return;
  }

  list.innerHTML = "";
  const summary = document.createElement("div");
  summary.className = "list__item";
  summary.innerHTML = `<div class="list__title">Всего заданий в базе: ${count}</div>
    <div class="list__meta">Английский (Spotlight 3): ${enCount} заданий с проверкой</div>`;
  list.appendChild(summary);

  books.forEach((b) => {
    const sub = getSubject(b.subjectId);
    const item = document.createElement("div");
    item.className = "list__item list__item--book";
    const href = b.file ? `./${b.file}` : "#";
    item.innerHTML = `
      <div class="list__title">${escapeHtml(b.title || "Без названия")}</div>
      <div class="list__meta">${escapeHtml(sub?.name || b.subjectId || "")} · ${escapeHtml(b.type || "учебник")}</div>
      ${b.file ? `<a class="btn btn--ghost btn--sm list__open" href="${escapeHtml(href)}" target="_blank" rel="noopener">Открыть PDF</a>` : ""}
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

$("#loadSpotlightBtn")?.addEventListener("click", async () => {
  const msg = $("#uploadMsg");
  try {
    await loadBundledTasksFromServer();
    const total = getAllTasks().length;
    msg.innerHTML = `<div class="msg msg--ok">Spotlight 3: ${bundledTasks.length} заданий. Всего в базе: ${total}.</div>`;
    renderCatalog();
    renderTodayGrid();
    if (activeSubjectId === "english") openLesson("english");
    toast("Задания Spotlight обновлены");
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
  renderCatalog();
  renderReviews();
  initHeroHeadline();
  initScrollReveal();
  initReviewsScrollStack();
  requestAnimationFrame(() => refreshScrollReveal());
}

async function initApp() {
  await Promise.all([loadBundledTasksFromServer(), loadServerCatalog()]);
  boot();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
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
