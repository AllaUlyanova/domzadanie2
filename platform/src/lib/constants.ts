/** Программа РФ, 3 класс, 2025/2026 */
export const APP_META = {
  grade: 3,
  schoolYear: "2025/2026",
  region: "RU",
  cityDefault: "Москва",
} as const;

export const SUBJECTS_UI = [
  { slug: "MATH", name: "Математика", icon: "🔢", color: "from-cyan-400 to-sky-500" },
  { slug: "RUSSIAN", name: "Русский", icon: "📝", color: "from-rose-400 to-orange-400" },
  { slug: "WORLD", name: "Окружающий мир", icon: "🌍", color: "from-emerald-400 to-teal-400" },
  { slug: "READING", name: "Чтение", icon: "📖", color: "from-blue-400 to-indigo-400" },
  { slug: "ENGLISH", name: "English", icon: "🇬🇧", color: "from-violet-400 to-purple-500" },
] as const;
