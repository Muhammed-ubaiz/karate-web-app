/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dojo: {
          darkest: '#0d0d0e',
          bg: '#121214',
          card: '#1a1a1e',
          cardHover: '#222228',
          surface: '#26262e',
          border: '#2e2e38',
          muted: '#8e8ea0',
          red: '#E50914',
          redHover: '#f4121d',
          redLight: 'rgba(229, 9, 20, 0.15)',
          gold: '#f59e0b',
          green: '#10b981',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
