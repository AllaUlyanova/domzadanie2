"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Mascot «Пушок» — короткие подсказки, без перегруза */
export function MascotHelper() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("Привет! Выбери предмет и сделай домашку 🌟");

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className="max-w-[260px] rounded-kid-lg border-2 border-slate-800/15 bg-white p-4 text-sm font-semibold shadow-kid dark:bg-slate-800"
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        aria-label="Помощник Пушок"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setOpen((o) => !o);
          setMsg(
            open
              ? "Я рядом, если что!"
              : "Сначала предмет → учебник → урок. Потом пиши ответ и жми «Проверить»!",
          );
        }}
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-800/20 bg-gradient-to-br from-amber-300 to-orange-400 text-3xl shadow-kid"
      >
        🦊
      </motion.button>
    </div>
  );
}
