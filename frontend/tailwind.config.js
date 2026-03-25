/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#FF0000",
          dark: "#0F0F0F",
          card: "#1E1E1E",
          border: "#2E2E2E",
          accent: "#3B82F6",
        }
      }
    },
  },
  plugins: [],
}
