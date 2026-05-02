/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: '#06060A',
        brand: '#FF3B2E',
      },
      boxShadow: {
        'cta-lg': '0 18px 60px -10px rgba(255,59,46,.75), 0 0 0 1px rgba(255,255,255,.10) inset, 0 0 80px rgba(255,59,46,.25)',
        glow: '0 0 0 1px rgba(255,59,46,0.2), 0 0 20px rgba(255,59,46,0.3)',
        'glow-lg': '0 0 0 1px rgba(255,59,46,0.4), 0 0 30px rgba(255,59,46,0.5)',
      },
    },
  },
  plugins: [],
}