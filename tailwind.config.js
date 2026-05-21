/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // Çok koyu gri/siyah
        surface: 'rgba(255, 255, 255, 0.05)', // Glassmorphism arka planı
        surfaceHover: 'rgba(255, 255, 255, 0.1)',
        primary: '#4facfe',
        secondary: '#00f2fe',
        accent: '#8b5cf6', // Mor tonu
      },
      animation: {
        'blob': 'blob 10s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(79, 172, 254, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(79, 172, 254, 0.6)' }
        }
      }
    }
  },
  plugins: []
}
