/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dmrc: {
          red: "#c8102e",
          "red-dark": "#a60d26",
          ink: "#1f2937",
          sky: "#c9ecfc",
          blush: "#fde8ef",
          mint: "#eaf7e6",
          cream: "#fffbed",
          gold: "#f2c94c",
          teal: "#0e5a4c",
        },
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 6px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};
