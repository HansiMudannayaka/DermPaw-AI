/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: "#6C5CE7",
        primaryHover: "#5A4BDA",

        success: "#2ECC71",
        danger: "#E74C3C",
        warning: "#F39C12",
        info: "#3498DB",

        bg: "#F7F8FC",
        card: "#FFFFFF",
        border: "#E6E8F0",
        text: "#7A7F9A",
        heading: "#1F2937",
      },
    },
  },

  plugins: [],
};