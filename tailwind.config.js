/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0a7ea4",
          light: "#99D5E0",
          dark: "#0C4C8A",
          deeper: "#1F375D",
          muted: "#AEDEDE",
          navy: "#142D54",
        },
      },
    },
  },
  plugins: [],
};
