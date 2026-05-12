/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(0,-18px,0) scale(1.03)' },
        },
        drift: {
          '0%': { transform: 'translate3d(-10px, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(12px, -10px, 0) scale(1.04)' },
          '100%': { transform: 'translate3d(-10px, 0, 0) scale(1)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
      },
      animation: {
        floatSlow: 'floatSlow 10s ease-in-out infinite',
        drift: 'drift 16s ease-in-out infinite',
        breathe: 'breathe 4.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
