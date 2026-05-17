"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  name: string;
  icon: string;
  gradient: string;
  meta?: string;
};

export function SubjectCard({ href, name, icon, gradient, meta }: Props) {
  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        className={cn(
          "kid-card flex min-h-[140px] flex-col justify-between bg-gradient-to-br p-6",
          gradient,
        )}
      >
        <span className="text-4xl" aria-hidden>
          {icon}
        </span>
        <div>
          <h3 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">{name}</h3>
          {meta && <p className="mt-1 text-sm font-semibold text-slate-700/80 dark:text-slate-200">{meta}</p>}
        </div>
      </Link>
    </motion.div>
  );
}
