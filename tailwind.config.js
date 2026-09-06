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
        neutral: {
          900: "#142230",
          700: "#445468",
          500: "#7C8DA1",
          300: "#C3CDD6",
          150: "#E4E9ED",
          100: "#EEF2F5",
        },
        semantic: {
          success: "#2F9E6E",
          "success-bg": "#E5F6EE",
          attention: "#E5A139",
          "attention-bg": "#FBF1DF",
          critical: "#D9484B",
          "critical-bg": "#FBE7E7",
          info: "#2E77B8",
          "info-bg": "#E7F1FA",
          disabled: "#B8C0C8",
          "disabled-bg": "#F1F3F5",
        },
      },
      fontFamily: {
        display: ["Manrope"],
        body: ["Inter"],
        data: ["IBM Plex Mono"],
      },
    },
  },
  plugins: [],
};
