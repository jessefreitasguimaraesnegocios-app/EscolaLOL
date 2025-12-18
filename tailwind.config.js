/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hextech: {
          blue: '#1F4E8C',
          dark: '#0A1428',
          gold: '#C3A758',
          lightGold: '#E6D39A',
          gray: '#C7C7C7',
          border: '#3A3A3A',
          black: '#010A13',
          buttonBlue: '#3A6EA5'
        }
      },
      fontFamily: {
        beaufort: ['Cinzel', 'serif'],
        spiegel: ['Inter', 'sans-serif']
      },
      letterSpacing: {
        hextech: '0.08em'
      },
      boxShadow: {
        hextech: '0 0 12px rgba(31,78,140,0.45)',
        hextechInset: 'inset 0 0 10px rgba(195,167,88,0.25)',
      },
    },
  },
  plugins: [],
}

