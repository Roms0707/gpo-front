/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50, #fff7ed)',
          100: 'var(--color-primary-100, #ffedd5)',
          200: 'var(--color-primary-200, #fed7aa)',
          300: 'var(--color-primary-300, #fdba74)',
          400: 'var(--color-primary-400, #fb923c)',
          500: 'var(--color-primary-500, #ff7900)',
          600: 'var(--color-primary-600, #ea580c)',
          700: 'var(--color-primary-700, #c2410c)',
          800: 'var(--color-primary-800, #9a3412)',
          900: 'var(--color-primary-900, #7c2d12)',
          950: 'var(--color-primary-950, #431407)',
          DEFAULT: 'var(--color-primary, #ff7900)',
        },
        secondary: {
          50: 'var(--color-secondary-50, #f8fafc)',
          100: 'var(--color-secondary-100, #f1f5f9)',
          200: 'var(--color-secondary-200, #e2e8f0)',
          300: 'var(--color-secondary-300, #cbd5e1)',
          400: 'var(--color-secondary-400, #94a3b8)',
          500: 'var(--color-secondary-500, #64748b)',
          600: 'var(--color-secondary-600, #475569)',
          700: 'var(--color-secondary-700, #334155)',
          800: 'var(--color-secondary-800, #1e293b)',
          900: 'var(--color-secondary-900, #000000)',
          950: 'var(--color-secondary-950, #000000)',
          DEFAULT: 'var(--color-secondary, #000000)',
        },
        accent: {
          50: 'var(--color-accent-50, #fffbeb)',
          100: 'var(--color-accent-100, #fef3c7)',
          200: 'var(--color-accent-200, #fde68a)',
          300: 'var(--color-accent-300, #fcd34d)',
          400: 'var(--color-accent-400, #fbbf24)',
          500: 'var(--color-accent-500, #f59e0b)',
          600: 'var(--color-accent-600, #d97706)',
          700: 'var(--color-accent-700, #b45309)',
          800: 'var(--color-accent-800, #92400e)',
          900: 'var(--color-accent-900, #78350f)',
          950: 'var(--color-accent-950, #451a03)',
          DEFAULT: 'var(--color-accent, #f59e0b)',
        },
        success: {
          50: 'var(--color-success-50, #f0fdf4)',
          100: 'var(--color-success-100, #dcfce7)',
          200: 'var(--color-success-200, #bbf7d0)',
          300: 'var(--color-success-300, #86efac)',
          400: 'var(--color-success-400, #4ade80)',
          500: 'var(--color-success-500, #22c55e)',
          600: 'var(--color-success-600, #16a34a)',
          700: 'var(--color-success-700, #15803d)',
          800: 'var(--color-success-800, #166534)',
          900: 'var(--color-success-900, #14532d)',
          950: 'var(--color-success-950, #052e16)',
          DEFAULT: 'var(--color-success, #22c55e)',
        },
        info: {
          50: 'var(--color-info-50, #eff6ff)',
          100: 'var(--color-info-100, #dbeafe)',
          200: 'var(--color-info-200, #bfdbfe)',
          300: 'var(--color-info-300, #93c5fd)',
          400: 'var(--color-info-400, #60a5fa)',
          500: 'var(--color-info-500, #3b82f6)',
          600: 'var(--color-info-600, #2563eb)',
          700: 'var(--color-info-700, #1d4ed8)',
          800: 'var(--color-info-800, #1e40af)',
          900: 'var(--color-info-900, #1e3a8a)',
          950: 'var(--color-info-950, #172554)',
          DEFAULT: 'var(--color-info, #3b82f6)',
        },
        warning: {
          50: 'var(--color-warning-50, #fff7ed)',
          100: 'var(--color-warning-100, #ffedd5)',
          200: 'var(--color-warning-200, #fed7aa)',
          300: 'var(--color-warning-300, #fdba74)',
          400: 'var(--color-warning-400, #fb923c)',
          500: 'var(--color-warning-500, #ff7900)',
          600: 'var(--color-warning-600, #ea580c)',
          700: 'var(--color-warning-700, #c2410c)',
          800: 'var(--color-warning-800, #9a3412)',
          900: 'var(--color-warning-900, #7c2d12)',
          950: 'var(--color-warning-950, #431407)',
          DEFAULT: 'var(--color-warning, #ff7900)',
        },
        error: {
          50: 'var(--color-error-50, #fef2f2)',
          100: 'var(--color-error-100, #fee2e2)',
          200: 'var(--color-error-200, #fecaca)',
          300: 'var(--color-error-300, #fca5a5)',
          400: 'var(--color-error-400, #f87171)',
          500: 'var(--color-error-500, #ef4444)',
          600: 'var(--color-error-600, #dc2626)',
          700: 'var(--color-error-700, #b91c1c)',
          800: 'var(--color-error-800, #991b1b)',
          900: 'var(--color-error-900, #7f1d1d)',
          950: 'var(--color-error-950, #450a0a)',
          DEFAULT: 'var(--color-error, #ef4444)',
        },
        dark: {
          100: '#1E1E1E',
          200: '#181818',
          300: '#111111',
        },
        orange: {
          50: 'var(--color-primary-50, #fff7ed)',
          100: 'var(--color-primary-100, #ffedd5)',
          200: 'var(--color-primary-200, #fed7aa)',
          300: 'var(--color-primary-300, #fdba74)',
          400: 'var(--color-primary-400, #fb923c)',
          500: 'var(--color-primary-500, #ff7900)',
          600: 'var(--color-primary-600, #ea580c)',
          700: 'var(--color-primary-700, #c2410c)',
          800: 'var(--color-primary-800, #9a3412)',
          900: 'var(--color-primary-900, #7c2d12)',
          950: 'var(--color-primary-950, #431407)',
        },
        black: {
          50: 'var(--color-secondary-50, #f8fafc)',
          100: 'var(--color-secondary-100, #f1f5f9)',
          200: 'var(--color-secondary-200, #e2e8f0)',
          300: 'var(--color-secondary-300, #cbd5e1)',
          400: 'var(--color-secondary-400, #94a3b8)',
          500: 'var(--color-secondary-500, #64748b)',
          600: 'var(--color-secondary-600, #475569)',
          700: 'var(--color-secondary-700, #334155)',
          800: 'var(--color-secondary-800, #1e293b)',
          900: 'var(--color-secondary-900, #000000)',
          950: 'var(--color-secondary-950, #000000)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'border-beam': 'border-beam var(--duration, 4s) linear infinite',
        'border-beam-fast': 'border-beam 1.5s linear infinite',
        'border-beam-slow': 'border-beam 5s linear infinite',
        'border-glow-pulse': 'border-glow-pulse 2s ease-in-out infinite',
        'border-shimmer': 'border-shimmer 3s linear infinite',
        'hextech-pulse': 'hextech-pulse 2.5s ease-in-out infinite',
        'radianite-flow': 'radianite-flow 3s linear infinite',
        'ember-dance': 'ember-dance 1.5s ease-in-out infinite',
        'frost-shimmer': 'frost-shimmer 4s ease-in-out infinite',
        'void-swirl': 'void-swirl 6s linear infinite',
        'electric-arc': 'electric-arc 0.8s ease-in-out infinite',
        'holographic-shift': 'holographic-shift 5s linear infinite',
        'ancient-glow': 'ancient-glow 3s ease-in-out infinite',
        'neon-breathe': 'neon-breathe 2s ease-in-out infinite',
        'blood-drip': 'blood-drip 2.5s ease-in-out infinite',
        'golden-sweep': 'golden-sweep 3s ease-in-out infinite',
        'particle-orbit': 'particle-orbit 4s linear infinite',
        'frame-shimmer': 'frame-shimmer 2s ease-in-out infinite',
        'frame-flame': 'frame-flame 1.5s ease-in-out infinite',
        'frame-void': 'frame-void 4s ease-in-out infinite',
        'frame-cosmic': 'frame-cosmic 5s linear infinite',
        'ruination-mist': 'ruination-mist 3s ease-in-out infinite',
        'dragon-breathe': 'dragon-breathe 2s ease-in-out infinite',
        'singularity-warp': 'singularity-warp 4s ease-in-out infinite',
        'damascus-shimmer': 'damascus-shimmer 3s linear infinite',
        'boost-trail': 'boost-trail 1s ease-out infinite',
        'solar-corona': 'solar-corona 4s ease-in-out infinite',
        'diamond-sparkle': 'diamond-sparkle 2s ease-in-out infinite',
      },
      keyframes: {
        'border-beam': {
          '0%': { 'offset-distance': '0%' },
          '100%': { 'offset-distance': '100%' }
        },
        'border-glow-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' }
        },
        'border-shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        },
        'hextech-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 15px #00d4ff, 0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 10px rgba(0, 212, 255, 0.1)',
            borderColor: '#00d4ff'
          },
          '50%': {
            boxShadow: '0 0 25px #00d4ff, 0 0 50px rgba(0, 212, 255, 0.5), inset 0 0 20px rgba(0, 212, 255, 0.2)',
            borderColor: '#33dfff'
          }
        },
        'radianite-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        'ember-dance': {
          '0%, 100%': {
            boxShadow: '0 0 20px #ff4500, 0 0 40px rgba(255, 69, 0, 0.4)',
            filter: 'brightness(1)'
          },
          '25%': {
            boxShadow: '0 0 25px #ff6b35, 0 0 50px rgba(255, 107, 53, 0.5)',
            filter: 'brightness(1.1)'
          },
          '75%': {
            boxShadow: '0 0 30px #ff4500, 0 0 60px rgba(255, 69, 0, 0.6)',
            filter: 'brightness(1.15)'
          }
        },
        'frost-shimmer': {
          '0%, 100%': {
            boxShadow: '0 0 20px #b9f2ff, 0 0 40px rgba(185, 242, 255, 0.3)',
            filter: 'brightness(1) hue-rotate(0deg)'
          },
          '50%': {
            boxShadow: '0 0 30px #e0f7ff, 0 0 60px rgba(224, 247, 255, 0.5)',
            filter: 'brightness(1.1) hue-rotate(10deg)'
          }
        },
        'void-swirl': {
          '0%': {
            boxShadow: '0 0 20px #8b5cf6, 0 0 40px rgba(139, 92, 246, 0.4)',
            filter: 'hue-rotate(0deg)'
          },
          '100%': {
            boxShadow: '0 0 25px #a78bfa, 0 0 50px rgba(167, 139, 250, 0.5)',
            filter: 'hue-rotate(360deg)'
          }
        },
        'electric-arc': {
          '0%, 100%': {
            boxShadow: '0 0 15px #00ffff, 0 0 30px rgba(0, 255, 255, 0.4)',
            opacity: 1
          },
          '50%': {
            boxShadow: '0 0 25px #00ffff, 0 0 50px rgba(0, 255, 255, 0.6)',
            opacity: 0.9
          },
          '25%, 75%': { opacity: 1 }
        },
        'holographic-shift': {
          '0%': { filter: 'hue-rotate(0deg) brightness(1.1)' },
          '100%': { filter: 'hue-rotate(360deg) brightness(1.1)' }
        },
        'ancient-glow': {
          '0%, 100%': {
            boxShadow: '0 0 15px #c9a227, 0 0 30px rgba(201, 162, 39, 0.3)',
            filter: 'brightness(1)'
          },
          '50%': {
            boxShadow: '0 0 25px #ffd700, 0 0 50px rgba(255, 215, 0, 0.5)',
            filter: 'brightness(1.15)'
          }
        },
        'neon-breathe': {
          '0%, 100%': { opacity: 0.8, filter: 'brightness(1)' },
          '50%': { opacity: 1, filter: 'brightness(1.2)' }
        },
        'blood-drip': {
          '0%, 100%': {
            boxShadow: '0 0 15px #dc2626, 0 0 30px rgba(220, 38, 38, 0.3)',
            borderColor: '#dc2626'
          },
          '50%': {
            boxShadow: '0 0 20px #ef4444, 0 0 40px rgba(239, 68, 68, 0.5), 0 5px 15px rgba(220, 38, 38, 0.4)',
            borderColor: '#ef4444'
          }
        },
        'golden-sweep': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' }
        },
        'particle-orbit': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'frame-shimmer': {
          '0%, 100%': { filter: 'brightness(1)', boxShadow: '0 0 15px currentColor' },
          '50%': { filter: 'brightness(1.2)', boxShadow: '0 0 25px currentColor' }
        },
        'frame-flame': {
          '0%, 100%': {
            boxShadow: '0 0 20px #ff6b35, 0 0 40px rgba(255, 107, 53, 0.5), 0 -5px 20px rgba(255, 69, 0, 0.3)',
            filter: 'brightness(1)'
          },
          '50%': {
            boxShadow: '0 0 30px #ff8c00, 0 0 60px rgba(255, 140, 0, 0.6), 0 -10px 30px rgba(255, 69, 0, 0.4)',
            filter: 'brightness(1.1)'
          }
        },
        'frame-void': {
          '0%, 100%': {
            boxShadow: '0 0 20px #8b5cf6, 0 0 40px rgba(139, 92, 246, 0.4), inset 0 0 15px rgba(75, 0, 130, 0.2)',
            borderColor: '#8b5cf6'
          },
          '50%': {
            boxShadow: '0 0 30px #a78bfa, 0 0 60px rgba(167, 139, 250, 0.5), inset 0 0 25px rgba(75, 0, 130, 0.3)',
            borderColor: '#a78bfa'
          }
        },
        'frame-cosmic': {
          '0%': {
            boxShadow: '0 0 20px #06b6d4, 0 0 40px rgba(6, 182, 212, 0.4)',
            filter: 'hue-rotate(0deg)'
          },
          '33%': {
            boxShadow: '0 0 25px #8b5cf6, 0 0 50px rgba(139, 92, 246, 0.5)',
            filter: 'hue-rotate(120deg)'
          },
          '66%': {
            boxShadow: '0 0 25px #ec4899, 0 0 50px rgba(236, 72, 153, 0.5)',
            filter: 'hue-rotate(240deg)'
          },
          '100%': {
            boxShadow: '0 0 20px #06b6d4, 0 0 40px rgba(6, 182, 212, 0.4)',
            filter: 'hue-rotate(360deg)'
          }
        },
        'ruination-mist': {
          '0%, 100%': {
            boxShadow: '0 0 20px #22c55e, 0 0 40px rgba(34, 197, 94, 0.3), 0 0 60px rgba(0, 0, 0, 0.5)',
            borderColor: '#1a1a2e'
          },
          '50%': {
            boxShadow: '0 0 30px #4ade80, 0 0 60px rgba(74, 222, 128, 0.4), 0 0 80px rgba(0, 0, 0, 0.6)',
            borderColor: '#0f0f1a'
          }
        },
        'dragon-breathe': {
          '0%, 100%': {
            boxShadow: '0 0 25px #ff6b35, 0 0 50px rgba(255, 107, 53, 0.5)',
            transform: 'scale(1)'
          },
          '50%': {
            boxShadow: '0 0 35px #ff8c00, 0 0 70px rgba(255, 140, 0, 0.6)',
            transform: 'scale(1.01)'
          }
        },
        'singularity-warp': {
          '0%, 100%': {
            boxShadow: '0 0 20px #581c87, 0 0 40px rgba(88, 28, 135, 0.5), inset 0 0 30px rgba(0, 0, 0, 0.8)',
            filter: 'brightness(1)'
          },
          '50%': {
            boxShadow: '0 0 30px #7c3aed, 0 0 60px rgba(124, 58, 237, 0.6), inset 0 0 40px rgba(0, 0, 0, 0.9)',
            filter: 'brightness(1.1)'
          }
        },
        'damascus-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        'boost-trail': {
          '0%': {
            boxShadow: '0 0 15px #3b82f6, -10px 0 20px rgba(59, 130, 246, 0.5)',
            transform: 'translateX(0)'
          },
          '50%': {
            boxShadow: '0 0 25px #60a5fa, -15px 0 30px rgba(96, 165, 250, 0.6)',
            transform: 'translateX(2px)'
          },
          '100%': {
            boxShadow: '0 0 15px #3b82f6, -10px 0 20px rgba(59, 130, 246, 0.5)',
            transform: 'translateX(0)'
          }
        },
        'solar-corona': {
          '0%, 100%': {
            boxShadow: '0 0 30px #fbbf24, 0 0 60px rgba(251, 191, 36, 0.5), 0 0 90px rgba(251, 191, 36, 0.3)',
            filter: 'brightness(1)'
          },
          '50%': {
            boxShadow: '0 0 40px #fcd34d, 0 0 80px rgba(252, 211, 77, 0.6), 0 0 120px rgba(252, 211, 77, 0.4)',
            filter: 'brightness(1.15)'
          }
        },
        'diamond-sparkle': {
          '0%, 100%': {
            boxShadow: '0 0 20px #b9f2ff, 0 0 40px rgba(185, 242, 255, 0.4)',
            filter: 'brightness(1)'
          },
          '25%': {
            boxShadow: '0 0 25px #e0f7ff, 0 0 50px rgba(224, 247, 255, 0.5)',
            filter: 'brightness(1.2)'
          },
          '50%': {
            boxShadow: '0 0 30px #ffffff, 0 0 60px rgba(255, 255, 255, 0.6)',
            filter: 'brightness(1.3)'
          },
          '75%': {
            boxShadow: '0 0 25px #e0f7ff, 0 0 50px rgba(224, 247, 255, 0.5)',
            filter: 'brightness(1.2)'
          }
        }
      },
      backgroundImage: {
        'hero-pattern': 'linear-gradient(to right, rgba(139, 92, 246, 0.9), rgba(6, 182, 212, 0.8))',
        'card-gradient': 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
      },
    },
  },
  plugins: [],
};
