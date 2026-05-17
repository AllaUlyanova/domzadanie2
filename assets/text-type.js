/**
 * Эффект печати текста (адаптация React Bits TextType без React и GSAP).
 */

function motionAllowed() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isInViewport(el) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return r.top < vh && r.bottom > 0;
}

/**
 * @param {HTMLElement} root — контейнер .text-type
 * @param {object} opts
 */
export function initTextType(root, opts = {}) {
  if (!root) return () => {};

  const texts = (Array.isArray(opts.text) ? opts.text : [opts.text]).filter(Boolean);
  if (!texts.length) return () => {};

  const typingSpeed = opts.typingSpeed ?? 75;
  const deletingSpeed = opts.deletingSpeed ?? 50;
  const pauseDuration = opts.pauseDuration ?? 1500;
  const initialDelay = opts.initialDelay ?? 400;
  const loop = opts.loop !== false;
  const showCursor = opts.showCursor !== false;
  const hideCursorWhileTyping = opts.hideCursorWhileTyping ?? false;
  const cursorCharacter = opts.cursorCharacter ?? "_";
  const cursorBlinkDuration = opts.cursorBlinkDuration ?? 0.5;
  const startOnVisible = opts.startOnVisible ?? true;
  const variableSpeed = opts.variableSpeedEnabled
    ? { min: opts.variableSpeedMin ?? 60, max: opts.variableSpeedMax ?? 120 }
    : null;

  root.classList.add("text-type");
  root.style.setProperty("--cursor-blink", `${cursorBlinkDuration}s`);
  root.setAttribute("aria-live", "polite");
  root.setAttribute("aria-atomic", "true");

  const content = document.createElement("span");
  content.className = "text-type__content";
  const cursor = document.createElement("span");
  cursor.className = "text-type__cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.textContent = cursorCharacter;

  const fallback = (root.textContent || texts[0] || "").trim();

  root.replaceChildren(content);
  if (showCursor) root.appendChild(cursor);

  if (!motionAllowed()) {
    content.textContent = texts[0] || fallback;
    return () => {};
  }

  content.textContent = fallback;

  let textIndex = 0;
  let charIndex = 0;
  let displayed = "";
  let deleting = false;
  let visible = !startOnVisible;
  let timeoutId = null;
  let observer = null;

  const getSpeed = () => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  };

  const currentFull = () => texts[textIndex] ?? "";

  const updateCursor = () => {
    if (!showCursor) return;
    const typing =
      hideCursorWhileTyping &&
      (charIndex < currentFull().length || deleting);
    cursor.classList.toggle("text-type__cursor--hidden", typing);
  };

  const tick = () => {
    const full = currentFull();

    if (deleting) {
      if (!displayed) {
        deleting = false;
        if (opts.onSentenceComplete) opts.onSentenceComplete(texts[textIndex], textIndex);
        if (textIndex === texts.length - 1 && !loop) return;
        textIndex = (textIndex + 1) % texts.length;
        charIndex = 0;
        timeoutId = setTimeout(tick, pauseDuration);
      } else {
        displayed = displayed.slice(0, -1);
        content.textContent = displayed;
        updateCursor();
        timeoutId = setTimeout(tick, deletingSpeed);
      }
      return;
    }

    if (charIndex < full.length) {
      displayed += full[charIndex];
      charIndex += 1;
      content.textContent = displayed;
      updateCursor();
      timeoutId = setTimeout(tick, getSpeed());
      return;
    }

    if (!loop && textIndex === texts.length - 1) return;

    timeoutId = setTimeout(() => {
      deleting = true;
      updateCursor();
      tick();
    }, pauseDuration);
  };

  const start = () => {
    if (!visible) return;
    clearTimeout(timeoutId);
    displayed = "";
    charIndex = 0;
    deleting = false;
    content.textContent = "";
    updateCursor();
    timeoutId = setTimeout(tick, initialDelay);
  };

  const stop = () => {
    clearTimeout(timeoutId);
    observer?.disconnect();
  };

  if (startOnVisible) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          visible = true;
          observer?.disconnect();
          start();
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(root);
  } else {
    visible = true;
    start();
  }

  return stop;
}

/** Заголовок на главной */
export function initHeroHeadline() {
  const el = document.getElementById("heroType");
  if (!el) return;

  return initTextType(el, {
    text: [
      "на сайте → в тетрадь",
      "с проверкой ответов",
      "по всем предметам",
      "каждый день понемногу",
    ],
    typingSpeed: 75,
    pauseDuration: 1500,
    deletingSpeed: 50,
    showCursor: true,
    cursorCharacter: "_",
    cursorBlinkDuration: 0.5,
    startOnVisible: false,
    loop: true,
    initialDelay: 900,
  });
}
