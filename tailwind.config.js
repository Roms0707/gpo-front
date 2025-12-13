/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', 'class'],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': 'var(--color-primary-50, #fff7ed)',
  				'100': 'var(--color-primary-100, #ffedd5)',
  				'200': 'var(--color-primary-200, #fed7aa)',
  				'300': 'var(--color-primary-300, #fdba74)',
  				'400': 'var(--color-primary-400, #fb923c)',
  				'500': 'var(--color-primary-500, #ff7900)',
  				'600': 'var(--color-primary-600, #ea580c)',
  				'700': 'var(--color-primary-700, #c2410c)',
  				'800': 'var(--color-primary-800, #9a3412)',
  				'900': 'var(--color-primary-900, #7c2d12)',
  				'950': 'var(--color-primary-950, #431407)',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': 'var(--color-secondary-50, #f8fafc)',
  				'100': 'var(--color-secondary-100, #f1f5f9)',
  				'200': 'var(--color-secondary-200, #e2e8f0)',
  				'300': 'var(--color-secondary-300, #cbd5e1)',
  				'400': 'var(--color-secondary-400, #94a3b8)',
  				'500': 'var(--color-secondary-500, #64748b)',
  				'600': 'var(--color-secondary-600, #475569)',
  				'700': 'var(--color-secondary-700, #334155)',
  				'800': 'var(--color-secondary-800, #1e293b)',
  				'900': 'var(--color-secondary-900, #000000)',
  				'950': 'var(--color-secondary-950, #000000)',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				'50': 'var(--color-accent-50, #fffbeb)',
  				'100': 'var(--color-accent-100, #fef3c7)',
  				'200': 'var(--color-accent-200, #fde68a)',
  				'300': 'var(--color-accent-300, #fcd34d)',
  				'400': 'var(--color-accent-400, #fbbf24)',
  				'500': 'var(--color-accent-500, #f59e0b)',
  				'600': 'var(--color-accent-600, #d97706)',
  				'700': 'var(--color-accent-700, #b45309)',
  				'800': 'var(--color-accent-800, #92400e)',
  				'900': 'var(--color-accent-900, #78350f)',
  				'950': 'var(--color-accent-950, #451a03)',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			success: {
  				'50': 'var(--color-success-50, #f0fdf4)',
  				'100': 'var(--color-success-100, #dcfce7)',
  				'200': 'var(--color-success-200, #bbf7d0)',
  				'300': 'var(--color-success-300, #86efac)',
  				'400': 'var(--color-success-400, #4ade80)',
  				'500': 'var(--color-success-500, #22c55e)',
  				'600': 'var(--color-success-600, #16a34a)',
  				'700': 'var(--color-success-700, #15803d)',
  				'800': 'var(--color-success-800, #166534)',
  				'900': 'var(--color-success-900, #14532d)',
  				'950': 'var(--color-success-950, #052e16)',
  				DEFAULT: 'var(--color-success, #22c55e)'
  			},
  			info: {
  				'50': 'var(--color-info-50, #eff6ff)',
  				'100': 'var(--color-info-100, #dbeafe)',
  				'200': 'var(--color-info-200, #bfdbfe)',
  				'300': 'var(--color-info-300, #93c5fd)',
  				'400': 'var(--color-info-400, #60a5fa)',
  				'500': 'var(--color-info-500, #3b82f6)',
  				'600': 'var(--color-info-600, #2563eb)',
  				'700': 'var(--color-info-700, #1d4ed8)',
  				'800': 'var(--color-info-800, #1e40af)',
  				'900': 'var(--color-info-900, #1e3a8a)',
  				'950': 'var(--color-info-950, #172554)',
  				DEFAULT: 'var(--color-info, #3b82f6)'
  			},
  			warning: {
  				'50': 'var(--color-warning-50, #fff7ed)',
  				'100': 'var(--color-warning-100, #ffedd5)',
  				'200': 'var(--color-warning-200, #fed7aa)',
  				'300': 'var(--color-warning-300, #fdba74)',
  				'400': 'var(--color-warning-400, #fb923c)',
  				'500': 'var(--color-warning-500, #ff7900)',
  				'600': 'var(--color-warning-600, #ea580c)',
  				'700': 'var(--color-warning-700, #c2410c)',
  				'800': 'var(--color-warning-800, #9a3412)',
  				'900': 'var(--color-warning-900, #7c2d12)',
  				'950': 'var(--color-warning-950, #431407)',
  				DEFAULT: 'var(--color-warning, #ff7900)'
  			},
  			error: {
  				'50': 'var(--color-error-50, #fef2f2)',
  				'100': 'var(--color-error-100, #fee2e2)',
  				'200': 'var(--color-error-200, #fecaca)',
  				'300': 'var(--color-error-300, #fca5a5)',
  				'400': 'var(--color-error-400, #f87171)',
  				'500': 'var(--color-error-500, #ef4444)',
  				'600': 'var(--color-error-600, #dc2626)',
  				'700': 'var(--color-error-700, #b91c1c)',
  				'800': 'var(--color-error-800, #991b1b)',
  				'900': 'var(--color-error-900, #7f1d1d)',
  				'950': 'var(--color-error-950, #450a0a)',
  				DEFAULT: 'var(--color-error, #ef4444)'
  			},
  			dark: {
  				'100': '#1E1E1E',
  				'200': '#181818',
  				'300': '#111111'
  			},
  			orange: {
  				'50': 'var(--color-primary-50, #fff7ed)',
  				'100': 'var(--color-primary-100, #ffedd5)',
  				'200': 'var(--color-primary-200, #fed7aa)',
  				'300': 'var(--color-primary-300, #fdba74)',
  				'400': 'var(--color-primary-400, #fb923c)',
  				'500': 'var(--color-primary-500, #ff7900)',
  				'600': 'var(--color-primary-600, #ea580c)',
  				'700': 'var(--color-primary-700, #c2410c)',
  				'800': 'var(--color-primary-800, #9a3412)',
  				'900': 'var(--color-primary-900, #7c2d12)',
  				'950': 'var(--color-primary-950, #431407)'
  			},
  			black: {
  				'50': 'var(--color-secondary-50, #f8fafc)',
  				'100': 'var(--color-secondary-100, #f1f5f9)',
  				'200': 'var(--color-secondary-200, #e2e8f0)',
  				'300': 'var(--color-secondary-300, #cbd5e1)',
  				'400': 'var(--color-secondary-400, #94a3b8)',
  				'500': 'var(--color-secondary-500, #64748b)',
  				'600': 'var(--color-secondary-600, #475569)',
  				'700': 'var(--color-secondary-700, #334155)',
  				'800': 'var(--color-secondary-800, #1e293b)',
  				'900': 'var(--color-secondary-900, #000000)',
  				'950': 'var(--color-secondary-950, #000000)'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'sans-serif'
  			],
  			heading: [
  				'Montserrat',
  				'sans-serif'
  			]
  		},
  		animation: {
  			'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'bounce-slow': 'bounce 2s infinite'
  		},
  		backgroundImage: {
  			'hero-pattern': 'linear-gradient(to right, rgba(139, 92, 246, 0.9), rgba(6, 182, 212, 0.8))',
  			'card-gradient': 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
