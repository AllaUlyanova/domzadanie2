/** Отзывы + эффект стопки карточек при прокрутке (без React) */

export const REVIEWS = [
  {
    id: "r1",
    name: "Елена М.",
    role: "мама, 3 класс · Москва",
    rating: 5,
    text: "Сын наконец делает уроки без слёз. Сначала на сайте, потом в тетрадь — и я вижу, что именно он сделал сам.",
    initials: "ЕМ",
    hue: 12,
  },
  {
    id: "r2",
    name: "Дмитрий К.",
    role: "папа, 3 класс",
    rating: 5,
    text: "Удобно, что все предметы в одном месте. Загрузили задания из рабочих тетрадей — проверка совпадает с ответами.",
    initials: "ДК",
    hue: 205,
  },
  {
    id: "r3",
    name: "Анна С.",
    role: "мама ученицы",
    rating: 4.5,
    text: "Ребёнку нравится отмечать «переписал в тетрадь». Привычка появилась за две недели — меньше напоминаний с нашей стороны.",
    initials: "АС",
    hue: 145,
  },
  {
    id: "r4",
    name: "Миша",
    role: "ученик, 3 класс",
    rating: 5,
    text: "Мне нравится, когда звёздочки за правильный ответ. Математику делаю первой, потому что там быстро видно, верно или нет.",
    initials: "М",
    hue: 38,
  },
];

function starsHtml(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = "";
  for (let i = 0; i < 5; i++) {
    if (i < full) html += `<span class="review-stars__star is-full" aria-hidden="true">★</span>`;
    else if (i === full && half) html += `<span class="review-stars__star is-half" aria-hidden="true">★</span>`;
    else html += `<span class="review-stars__star" aria-hidden="true">★</span>`;
  }
  return html;
}

function renderReviewCard(review, index, total) {
  const article = document.createElement("article");
  article.className = "review-card";
  article.setAttribute("role", "listitem");
  article.dataset.index = String(index);
  article.style.setProperty("--review-hue", `${review.hue} 52% 46%`);
  article.style.zIndex = String(total - index);

  article.innerHTML = `
    <div class="review-stars" aria-label="Оценка ${review.rating} из 5">
      ${starsHtml(review.rating)}
    </div>
    <blockquote class="review-card__text">«${review.text}»</blockquote>
    <footer class="review-card__foot">
      <span class="review-avatar" aria-hidden="true">${review.initials}</span>
      <div>
        <cite class="review-card__name">${review.name}</cite>
        <span class="review-card__role muted">${review.role}</span>
      </div>
    </footer>
  `;

  return article;
}

export function renderReviews() {
  const stack = document.getElementById("reviewsStack");
  if (!stack) return;

  stack.innerHTML = "";
  REVIEWS.forEach((r, i) => stack.appendChild(renderReviewCard(r, i, REVIEWS.length)));

  const n = REVIEWS.length;
  [...stack.querySelectorAll(".review-card")].forEach((card, i) => {
    card.style.transform = `translateY(${i * 14}px) rotate(${(i - 1.5) * 2.5}deg)`;
    card.style.zIndex = String(n - i);
  });
}

function motionAllowed() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initReviewsScrollStack() {
  const scrollEl = document.getElementById("reviewsScroll");
  const stack = document.getElementById("reviewsStack");
  if (!scrollEl || !stack) return;

  const cards = () => [...stack.querySelectorAll(".review-card")];
  const n = REVIEWS.length;

  const layoutStatic = () => {
    cards().forEach((card, i) => {
      card.style.transform = `translateY(${i * 12}px) rotate(${(i - 1) * 2}deg)`;
      card.style.opacity = "1";
      card.style.zIndex = String(n - i);
    });
  };

  if (!motionAllowed() || window.matchMedia("(max-width: 960px)").matches) {
    scrollEl.classList.add("reviews-scroll--static");
    layoutStatic();
    return;
  }

  const update = () => {
    const rect = scrollEl.getBoundingClientRect();
    const total = scrollEl.offsetHeight - window.innerHeight;
    if (total <= 0) {
      layoutStatic();
      return;
    }

    let progress = -rect.top / total;
    progress = Math.max(0, Math.min(1, progress));

    const list = cards();
    list.forEach((card, i) => {
      const segment = 1 / n;
      const start = i * segment;
      const end = (i + 1) * segment;
      const local = Math.max(0, Math.min(1, (progress - start) / segment));

      const y = -220 * local;
      const rot = (8 - i * 2) * (1 - local);
      const scale = 1 - local * 0.04;

      card.style.transform = `translate3d(0, ${y}%, 0) rotate(${rot}deg) scale(${scale})`;
      card.style.opacity = String(1 - local * 0.35);
      card.style.zIndex = String(n - i + Math.round(local * 10));
    });
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}
