/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2b6cee",
        "primary-dark": "#1f3b61",
        "teal-accent": "#0891b2",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
        "navy-deep": "#0f172a",
      },
      fontFamily: {
        display: ["Jost", "sans-serif"],
        playfair: ['"Playfair Display"', "serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
