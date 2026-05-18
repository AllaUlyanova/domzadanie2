/** Анимации с учётом prefers-reduced-motion */

export function motionAllowed() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isInViewport(el, margin = 80) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return r.top < vh - margin && r.bottom > margin;
}

export function initScrollReveal() {
  const nodes = document.querySelectorAll(".scroll-reveal");
  if (!nodes.length) return;

  document.documentElement.classList.add("motion-ready");

  if (!motionAllowed()) {
    nodes.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px 0px 0px" },
  );

  nodes.forEach((el) => {
    if (isInViewport(el)) {
      el.classList.add("is-visible");
      return;
    }
    io.observe(el);
  });
}

/** Повторно проверить видимость (после отрисовки сеток предметов) */
export function refreshScrollReveal() {
  document.querySelectorAll(".scroll-reveal:not(.is-visible)").forEach((el) => {
    if (isInViewport(el)) el.classList.add("is-visible");
  });
}

export function bumpEl(el) {
  if (!el || !motionAllowed()) return;
  el.classList.remove("anim-bump");
  void el.offsetWidth;
  el.classList.add("anim-bump");
  el.addEventListener("animationend", () => el.classList.remove("anim-bump"), { once: true });
}

export function animateProgressBar(bar, pct) {
  if (!bar) return;
  bar.style.width = `${pct}%`;
  bar.classList.toggle("progress__bar--pulse", pct > 0 && pct < 100);
  bar.classList.toggle("progress__bar--full", pct >= 100);
  if (motionAllowed() && pct > 0) {
    bar.classList.remove("progress__bar--tick");
    void bar.offsetWidth;
    bar.classList.add("progress__bar--tick");
  }
}

export function flashTaskCorrect(card) {
  if (!card) return;
  card.classList.remove("task--wrong");
  card.classList.add("task--correct");
  if (motionAllowed()) spawnSparkles(card, 6);
}

export function flashTaskWrong(card, input) {
  if (!card) return;
  card.classList.remove("task--correct");
  card.classList.add("task--wrong");
  if (input && motionAllowed()) {
    input.classList.remove("anim-shake");
    void input.offsetWidth;
    input.classList.add("anim-shake");
    input.addEventListener("animationend", () => input.classList.remove("anim-shake"), { once: true });
  }
}

export function playNotebookStamp(btn) {
  if (!btn || !motionAllowed()) return;
  btn.classList.add("anim-stamp-btn");
  btn.addEventListener("animationend", () => btn.classList.remove("anim-stamp-btn"), { once: true });
}

export function popSubjectStamp(card) {
  if (!card || !motionAllowed()) return;
  const stamp = card.querySelector(".dz-subject-card__stamp, .subject-card__stamp");
  if (!stamp) return;
  stamp.classList.add("dz-subject-card__stamp--pop", "subject-card__stamp--pop");
}

export function openLessonMotion(section) {
  if (!section || !motionAllowed()) return;
  section.classList.remove("lesson-section--enter");
  void section.offsetWidth;
  section.classList.add("lesson-section--enter");
}

const CELEBRATE_KEY = "school3_celebrated";

export function clearCelebration(dateKey) {
  sessionStorage.removeItem(`${CELEBRATE_KEY}_${dateKey}`);
}

export function maybeCelebrateDay(done, total, dateKey) {
  if (done < total) return;
  const key = `${CELEBRATE_KEY}_${dateKey}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  celebrateDayComplete();
}

export function celebrateDayComplete() {
  const overlay = document.getElementById("celebrateOverlay");
  if (!overlay) return;

  overlay.classList.add("is-on");
  overlay.setAttribute("aria-hidden", "false");

  if (motionAllowed()) spawnConfetti(48);

  const close = () => {
    overlay.classList.remove("is-on");
    overlay.setAttribute("aria-hidden", "true");
  };

  overlay.querySelector("[data-celebrate-close]")?.addEventListener("click", close, { once: true });
  setTimeout(close, motionAllowed() ? 4200 : 1200);
}

function spawnSparkles(root, count = 5) {
  if (!motionAllowed()) return;
  const box = root.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "fx-layer";
  root.style.position = "relative";
  root.appendChild(layer);

  const symbols = ["✓", "★", "✦"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "fx-sparkle";
    p.textContent = symbols[i % symbols.length];
    p.style.left = `${20 + Math.random() * 60}%`;
    p.style.top = `${15 + Math.random() * 40}%`;
    p.style.setProperty("--fx-rot", `${-30 + Math.random() * 60}deg`);
    p.style.animationDelay = `${i * 0.04}s`;
    layer.appendChild(p);
  }

  setTimeout(() => layer.remove(), 900);
}

function spawnConfetti(count) {
  const layer = document.getElementById("confettiLayer");
  if (!layer) return;
  layer.innerHTML = "";

  const colors = ["#e4573a", "#2a6f97", "#2d8a5e", "#d4a017", "#ff9bd4"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "fx-confetti";
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty("--fx-dur", `${1.8 + Math.random() * 1.4}s`);
    p.style.setProperty("--fx-delay", `${Math.random() * 0.35}s`);
    p.style.setProperty("--fx-drift", `${-40 + Math.random() * 80}px`);
    layer.appendChild(p);
  }

  setTimeout(() => {
    layer.innerHTML = "";
  }, 3500);
}
