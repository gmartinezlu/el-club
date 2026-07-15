/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        club: {
          cream: "rgb(var(--club-cream-rgb) / <alpha-value>)",
          green: "rgb(var(--club-green-rgb) / <alpha-value>)",
          sand: "rgb(var(--club-sand-rgb) / <alpha-value>)",
          paper: "rgb(var(--club-paper-rgb) / <alpha-value>)",
          ink: "rgb(var(--club-ink-rgb) / <alpha-value>)",
          muted: "rgb(var(--club-muted-rgb) / <alpha-value>)",
          brass: "rgb(var(--club-brass-rgb) / <alpha-value>)",
          rose: "rgb(var(--club-rose-rgb) / <alpha-value>)",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 18px 40px -28px rgba(15, 23, 42, 0.35)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        text: ["var(--font-text)"],
      },
    },
  },
  plugins: [],
};
