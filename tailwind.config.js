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
          // Primario — ámbar dorado (premium, cannabis, moderno)
          neon:       '#f59e0b',   // amber-400 — acento principal
          neonDim:    '#d97706',   // amber-600 — variante oscura
          light:      '#fcd34d',   // amber-300 — highlight
          // Secundario — violeta (muy 2025)
          violet:     '#8b5cf6',   // violet-500
          violetDim:  '#7c3aed',   // violet-600
          // Surfaces — zinc cálido sin tinte verde
          dark:       '#111113',
          surface:    '#1c1c1f',
          card:       '#28282d',
          border:     '#3f3f46',
          muted:      '#52525b',
        },
        accent: {
          purple: '#a78bfa',
          pink:   '#f472b6',
          amber:  '#f59e0b',
          blue:   '#60a5fa',
          red:    '#f87171',
          teal:   '#2dd4bf',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        punk: ['Rajdhani', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-dark':    'linear-gradient(180deg, #111113 0%, #1c1c1f 100%)',
        'gradient-neon':    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-violet':  'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        'gradient-card':    'linear-gradient(145deg, #28282d 0%, #1c1c1f 100%)',
        'gradient-amber':   'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        // Aurora mesh — ámbar + violeta, sin verde
        'gradient-mesh':    'radial-gradient(ellipse 100% 80% at 10% 0%, rgba(245,158,11,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 10%, rgba(139,92,246,0.06) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 50% 100%, rgba(245,158,11,0.04) 0%, transparent 60%)',
        'gradient-bento':   'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        'gradient-shimmer': 'linear-gradient(90deg, #28282d 25%, #3f3f46 50%, #28282d 75%)',
      },
      boxShadow: {
        'soft':     '0 1px 3px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
        'elevated': '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
        'deep':     '0 16px 64px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
        'colored':  '0 4px 20px rgba(245,158,11,0.12), 0 1px 3px rgba(0,0,0,0.5)',
        'violet':   '0 4px 20px rgba(139,92,246,0.12), 0 1px 3px rgba(0,0,0,0.5)',
        'amber':    '0 4px 20px rgba(245,158,11,0.15), 0 1px 3px rgba(0,0,0,0.5)',
        'card':     '0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-lg':  '0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
        'inner-sm': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'float':    'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-in': 'slide-in 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':  'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':  'shimmer 2s infinite linear',
        'enter':    'enter 0.4s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        'float':    { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        'slide-up': { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'slide-in': { from: { transform: 'translateX(-20px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { transform: 'scale(0.92)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'shimmer':  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'enter':    { from: { transform: 'translateY(12px) scale(0.98)', opacity: '0' }, to: { transform: 'translateY(0) scale(1)', opacity: '1' } },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: { xs: '4px' },
    },
  },
  plugins: [],
}
