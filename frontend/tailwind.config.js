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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7ccbfa',
          400: '#38b0f8',
          500: '#0e96e9',
          600: '#0277c7',
          700: '#035fa3',
          800: '#075185',
          900: '#0c436e',
          950: '#082b49',
        }
      }
    },
  },
  plugins: [],
}
