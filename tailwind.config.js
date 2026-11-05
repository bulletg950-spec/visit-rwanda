/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { 50: '#eef6f2', 100: '#d5e8de', 400: '#3f8a68', 500: '#2a6e50', 600: '#1d5a40', 700: '#154633', 800: '#0f3626', 900: '#0a261b', 950: '#06170f' },
        rwblue: { 300: '#6cc8ec', 400: '#33b3e6', 500: '#00a1de', 600: '#0082b5', 700: '#00668f' },
        gold: { 300: '#e6cd8a', 400: '#d8b765', 500: '#c9a24b', 600: '#a8832f' },
        charcoal: { 700: '#2c3033', 800: '#1f2326', 900: '#15181a' },
      },
      fontFamily: { display: ['"Playfair Display"', 'Georgia', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] },
      keyframes: { float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } }, shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } } },
      animation: { float: 'float 6s ease-in-out infinite', shimmer: 'shimmer 3s linear infinite' },
    },
  },
  plugins: [],
};
