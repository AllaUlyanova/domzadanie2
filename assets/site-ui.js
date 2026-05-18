/**
 * UI: header, homework AI demo, assistant, scroll helpers
 */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);

  const ASSISTANT_LINES = [
    "Привет! Я помогу разобрать ошибки и не сдаваться 💜",
    "Сначала выбери предмет — там все уроки по учебнику.",
    "Не бойся ошибаться: каждая подсказка приближает к «Готово»!",
    "Spotlight 3 уже на сайте — открой английский и выбери урок.",
    "После проверки перепиши аккуратно в тетрадь ✏️",
  ];

  const SUBJECT_NAMES = {
    math: "Математика",
    russian: "Русский язык",
    reading: "Литературное чтение",
    english: "Английский язык",
    world: "Окружающий мир",
    music: "Музыка",
    tech: "Технология",
  };

  function motionOk() {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function typeText(el, html, done) {
    if (!el || !motionOk()) {
      el.innerHTML = html;
      if (done) done();
      return;
    }
    el.innerHTML = "";
    el.classList.add("typing-cursor");
    const plain = html.replace(/<[^>]+>/g, "");
    let i = 0;
    const tick = () => {
      if (i >= plain.length) {
        el.classList.remove("typing-cursor");
        el.innerHTML = html;
        if (done) done();
        return;
      }
      i += 1;
      el.textContent = plain.slice(0, i);
      setTimeout(tick, 12 + Math.random() * 18);
    };
    tick();
  }

  function buildAiResponse(data) {
    const ok = data.ok;
    return `
      <p><span class="tag-${ok ? "ok" : "hint"}">${ok ? "✅ Верно!" : "💡 Почти!"}</span></p>
      <p>${data.motivation}</p>
      <p><strong>AI объяснение</strong></p>
      <p>${data.explanation}</p>
      <ul>
        <li><strong>Подсказка:</strong> ${data.hint}</li>
        <li><strong>Похожая задача:</strong> ${data.similar}</li>
      </ul>
      <p class="muted">${data.footer}</p>
    `;
  }

  function evaluateAnswer(answer) {
    const a = String(answer || "").trim().toLowerCase();
    if (/^(75|42|53|о|о́)$/.test(a) || a === "53") {
      return {
        ok: true,
        motivation: "Молодец! Ответ совпадает с эталоном.",
        explanation: "Решение выполнено правильно. Можно переписать в тетрадь и отметить урок.",
        hint: "Проверь оформление: номер, дата, аккуратные цифры.",
        similar: "Попробуй для закрепления: 36 + 17 = ?",
        footer: "Открой карточку предмета выше — там задания из учебника.",
      };
    }
    return {
      ok: false,
      motivation: "Ты уже близко — давай разберём вместе.",
      explanation:
        "Перечитай условие и проверь каждый шаг. Частая ошибка — неверный перенос или знак при сложении.",
      hint: "Подумай: складываешь ли ты однозначные числа в нужном разряде?",
      similar: "36 + 17 = ? (посчитай десятки и единицы отдельно)",
      footer: "В разделе «Предметы» можно решать реальные задания с проверкой.",
    };
  }

  function initHeader() {
    const header = $("#siteHeader");
    const toggle = $("#navToggle");
    const nav = $("#siteNav");

    const onScroll = () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    toggle?.addEventListener("click", () => {
      const open = nav?.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle?.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initHomeworkForm() {
    const form = $("#homeworkForm");
    const loading = $("#aiLoading");
    const response = $("#aiResponse");
    const body = $("#aiResponseBody");
    const meta = $("#aiResponseMeta");
    const upload = $("#hwUpload");
    const photoInput = $("#hwPhotoInput");
    const photoName = $("#hwPhotoName");

    upload?.addEventListener("dragover", (e) => {
      e.preventDefault();
      upload.classList.add("is-drag");
    });
    upload?.addEventListener("dragleave", () => upload.classList.remove("is-drag"));
    upload?.addEventListener("drop", (e) => {
      e.preventDefault();
      upload.classList.remove("is-drag");
      const file = e.dataTransfer?.files?.[0];
      if (file && photoInput) {
        const dt = new DataTransfer();
        dt.items.add(file);
        photoInput.files = dt.files;
        if (photoName) photoName.textContent = file.name;
      }
    });

    photoInput?.addEventListener("change", () => {
      const f = photoInput.files?.[0];
      if (photoName) photoName.textContent = f ? f.name : "";
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const subject = $("#hwSubject")?.value || "math";
      const task = $("#hwTask")?.value?.trim() || "без номера";
      const answer = $("#hwAnswer")?.value?.trim() || "";
      const hasPhoto = photoInput?.files?.length > 0;

      if (!answer && !hasPhoto) {
        $("#hwAnswer")?.focus();
        return;
      }

      response?.classList.add("is-hidden");
      loading?.classList.remove("is-hidden");

      const result = evaluateAnswer(answer);
      const subjectLabel = SUBJECT_NAMES[subject] || subject;
      const delay = hasPhoto ? 2200 : 1400;

      setTimeout(() => {
        loading?.classList.add("is-hidden");
        response?.classList.remove("is-hidden");
        if (meta) meta.textContent = `${subjectLabel} · ${task}`;
        const html = buildAiResponse(
          hasPhoto && !answer
            ? {
                ...result,
                ok: false,
                explanation:
                  "Фото получено. Скоро AI сможет читать тетрадь автоматически — пока введите ответ текстом.",
              }
            : result,
        );
        typeText(body, html, () => {
          response?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }, delay);
    });
  }

  function initAssistant() {
    const textEl = $("#assistantText");
    if (!textEl) return;
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % ASSISTANT_LINES.length;
      textEl.style.opacity = "0";
      setTimeout(() => {
        textEl.textContent = ASSISTANT_LINES[idx];
        textEl.style.opacity = "1";
      }, 280);
    }, 5000);
    textEl.style.transition = "opacity 0.35s ease";
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: motionOk() ? "smooth" : "auto", block: "start" });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initHeader();
      initHomeworkForm();
      initAssistant();
      initSmoothAnchors();
    });
  } else {
    initHeader();
    initHomeworkForm();
    initAssistant();
    initSmoothAnchors();
  }
})();
