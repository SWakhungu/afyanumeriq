/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0d9488", // teal-600
          light: "#14b8a6", // teal-500
          dark: "#0f766e", // teal-700
        },
        accent: {
          DEFAULT: "#facc15", // yellow-400
        },
        neutral: {
          light: "#f9fafb", // gray-50
          DEFAULT: "#6b7280", // gray-500
          dark: "#1f2937", // gray-800
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
