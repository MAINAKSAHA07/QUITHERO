/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Align with landing / app brand
        primary: '#3F8DD2',
        secondary: '#F6B884',
        sage: '#6EA48F',
        sky: '#8BCDE8',
        success: '#6EA48F',
        warning: '#F6B884',
        danger: '#E63946',
        neutral: {
          dark: '#0E2538',
          light: '#F4FBFF',
        },
        bg: {
          default: '#F4FBFF',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 16px rgba(90, 130, 150, 0.08)',
        'card-lg': '0 8px 32px rgba(90, 130, 150, 0.12)',
      },
    },
  },
  plugins: [],
}
