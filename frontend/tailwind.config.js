/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4F8A',
          50: '#EBF2FC',
          100: '#C8DCF7',
          800: '#1B4F8A',
          900: '#123566',
        },
      },
    },
  },
  plugins: [],
}
