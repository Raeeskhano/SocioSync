/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#060e20",
        surface: "#060e20",
        "surface-container": "#0f1930",
        "surface-container-high": "#141f38",
        "surface-container-highest": "#192540",
        "surface-container-low": "#091328",
        "surface-container-lowest": "#000000",
        "surface-bright": "#1f2b49",
        "surface-variant": "#192540",
        primary: {
          DEFAULT: "#bd9dff",
          dim: "#8a4cfc",
          light: "#d4baff",
        },
        "on-primary-fixed": "#000000",
        "on-primary": "#1a0044",
        tertiary: "#ff97b2",
        secondary: {
          DEFAULT: "#c38bf5",
          container: "#612b8f",
        },
        error: "#ff6e84",
        "on-surface": "#dee5ff",
        "on-surface-variant": "#a3aac4",
        outline: {
          DEFAULT: "#6d758c",
          variant: "#40485d",
        },
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "1.5rem",
        md: "0.75rem",
      },
    },
  },
  plugins: [],
};
