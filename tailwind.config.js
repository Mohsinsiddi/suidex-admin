/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
        },
        dark: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      backgroundImage: {
        'starfield': 'radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.1), transparent), radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.05), transparent), radial-gradient(1px 2px at 90px 40px, rgba(255,255,255,0.1), transparent)',
      }
    },
  },
  plugins: [],
}