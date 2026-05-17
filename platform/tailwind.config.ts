import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        sky: {
          kid: "#7bd4ff",
          deep: "#2a6f97",
        },
        mint: { kid: "#5cffb1" },
        grape: { kid: "#9b7bff" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        kid: "1.25rem",
        "kid-lg": "1.75rem",
      },
      boxShadow: {
        kid: "0 8px 0 0 rgba(26, 47, 74, 0.12), 0 12px 24px rgba(26, 47, 74, 0.08)",
        "kid-press": "0 4px 0 0 rgba(26, 47, 74, 0.12)",
      },
      animation: {
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out",
      },
      keyframes: {
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
