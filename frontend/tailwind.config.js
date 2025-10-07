/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f766e", // Deep teal
        secondary: "#14b8a6", // Light teal
        accent: "#f0fdfa", // Pale background
      },
    },
  },
  plugins: [],
};
