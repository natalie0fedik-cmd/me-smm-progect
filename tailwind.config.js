/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#14342B',
          green: '#60935D',
          lime: '#C8D96F',
          cream: '#F5F0E8',
        },
      },
      fontFamily: {
        head: ['var(--font-head)', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
