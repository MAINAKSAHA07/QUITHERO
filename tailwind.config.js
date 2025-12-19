/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F58634',
          accent: '#D45A1C',
          light: '#FFD08A',
        },
        text: {
          primary: '#2B2B2B',
        },
        bg: {
          soft: '#FFF7EE',
          card: '#EDE8E3',
        },
        success: '#4CAF50',
        info: '#2A72B5',
        error: '#E63946',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(245, 134, 52, 0.3)',
      },
    },
  },
  plugins: [],
}

