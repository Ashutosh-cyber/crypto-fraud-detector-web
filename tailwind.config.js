/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0d1117',       // near-black navy page background
        panel: '#161b22',      // card / panel background
        'panel-2': '#1c2330',  // nested panel background
        edge: '#30363d',       // subtle borders
        cyan: {
          DEFAULT: '#00e5ff',  // accent / terminal cyan
          dim: '#0a7a8c',
        },
        illicit: '#ff4444',
        licit: '#00c853',
        muted: '#8b949e',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 18px rgba(0, 229, 255, 0.45)',
        'cyan-soft': '0 0 0 1px rgba(0, 229, 255, 0.25)',
      },
      keyframes: {
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bar-grow': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-slide-up': 'fade-slide-up 0.45s ease-out',
      },
    },
  },
  plugins: [],
}
