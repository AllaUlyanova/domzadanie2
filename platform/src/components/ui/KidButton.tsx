"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "success";
  size?: "md" | "lg";
};

export function KidButton({
  className,
  variant = "primary",
  size = "lg",
  children,
  ...props
}: Props) {
  const variants = {
    primary: "bg-brand-500 text-white border-slate-900/20 hover:bg-brand-400",
    ghost: "bg-white/80 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-white",
    success: "bg-emerald-500 text-white border-emerald-700/30",
  };
  const sizes = {
    md: "min-h-[48px] px-5 text-base",
    lg: "min-h-[56px] px-8 text-lg",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97, y: 2 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-kid border-2 font-bold shadow-kid transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        "disabled:opacity-50 disabled:shadow-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
