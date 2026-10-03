/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",

  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        // DermPaw App purple palette
        primary: "#8A2BE2",
        primaryHover: "#710b9d",
        primaryDark: "#4B0082",
        primaryDeep: "#3A0070",

        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#8A2BE2",

        bg: "#FAF8FF",
        card: "#FAF8FF",
        border: "#E8DDF5",
        text: "#6B5B8A",
        heading: "#1A0033",

        // Dark Theme — deep purple backgrounds matching the app
        darkBg: "#0D0618",
        darkCard: "#160D2B",
        darkCard2: "#1E1040",
        darkBorder: "#2E1A4E",
        darkText: "#B39DCC",
        darkHeading: "#F0E8FF",
      },
      boxShadow: {
        card: "0 2px 8px -1px rgba(0, 0, 0, 0.06), 0 1px 3px -1px rgba(0, 0, 0, 0.04)",
        cardHover:
          "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },

  plugins: [],
};
