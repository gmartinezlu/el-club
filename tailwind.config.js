/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        club: {
          cream: "#eadac8",
          green: "#084739",
          sand: "#f4efe8",
          paper: "#fbf8f3",
          ink: "#1f2a26",
          muted: "#44504a",
          brass: "#b8863f",
          rose: "#c98577",
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
