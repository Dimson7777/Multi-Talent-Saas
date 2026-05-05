/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.35s ease-out',
        'fade-in-down': 'fadeInDown 0.2s ease-out',
        'modal-in': 'modalIn 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'toast-in': 'toastIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient': 'gradientShift 4s ease infinite',
        'border-glow': 'borderGlow 2s ease-in-out infinite',
        'dot-pulse': 'dotPulse 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'dragon-1': 'dragonFly1 25s ease-in-out infinite',
        'dragon-2': 'dragonFly2 30s ease-in-out infinite',
        'dragon-3': 'dragonFly3 35s ease-in-out infinite',
        'data-flow': 'dataFlow 4s ease-in-out infinite',
        'smoke': 'smokeDrift 6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
