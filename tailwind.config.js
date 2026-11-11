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
          darkest: 'rgb(var(--dojo-darkest) / <alpha-value>)',
          bg: 'rgb(var(--dojo-bg) / <alpha-value>)',
          card: 'rgb(var(--dojo-card) / <alpha-value>)',
          cardHover: 'rgb(var(--dojo-card-hover) / <alpha-value>)',
          surface: 'rgb(var(--dojo-surface) / <alpha-value>)',
          border: 'rgb(var(--dojo-border) / <alpha-value>)',
          muted: 'rgb(var(--dojo-muted) / <alpha-value>)',
          red: '#E50914',
          redHover: '#f4121d',
          redLight: 'rgba(229, 9, 20, 0.15)',
          gold: '#f59e0b',
          green: '#10b981',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
