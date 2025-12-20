/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F58634',
        secondary: '#2A72B5',
        success: '#4CAF50',
        warning: '#FFD08A',
        danger: '#E63946',
        neutral: {
          dark: '#2B2B2B',
          light: '#F5F5F5',
        },
        bg: {
          default: '#FAFAFA',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}





