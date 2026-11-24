/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        indigo: { midnight: '#1B1F4B', deep: '#252A66' },
        saffron: { DEFAULT: '#F4A300', soft: '#FFC857' },
        ivory: '#FFF8E7',
        slateInk: '#2B2D42',
        lavender: '#F4F3FB',
      },
      borderRadius: { '2xl': '1.25rem' },
      fontFamily: {
        tamilSerif: ['Mukta Malar', 'Noto Serif Tamil', 'serif'],
        tamil: ['Noto Sans Tamil', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
