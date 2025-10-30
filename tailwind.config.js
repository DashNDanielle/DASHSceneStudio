/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // CRITICAL: Tells Tailwind where to find classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}