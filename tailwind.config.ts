/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand - Enterprise Blue
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        accent: {
          DEFAULT: '#0D9488',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          light: 'var(--gold-light)',
        },
        // Semantic Status
        'status-moving': {
          DEFAULT: '#059669',
          light: 'rgba(5,150,105,0.08)',
        },
        'status-stopped': {
          DEFAULT: '#D97706',
          light: 'rgba(217,119,6,0.08)',
        },
        'status-idle': {
          DEFAULT: '#7C3AED',
          light: 'rgba(124,58,237,0.08)',
        },
        'status-offline': {
          DEFAULT: '#DC2626',
          light: 'rgba(220,38,38,0.08)',
        },
        'status-maintenance': {
          DEFAULT: '#EA580C',
          light: 'rgba(234,88,12,0.08)',
        },
        // Semantic
        success: {
          DEFAULT: '#059669',
          light: 'rgba(5,150,105,0.08)',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#D97706',
          light: 'rgba(217,119,6,0.08)',
          dark: '#B45309',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: 'rgba(220,38,38,0.08)',
          dark: '#B91C1C',
        },
        info: {
          DEFAULT: '#2563EB',
          light: 'rgba(37,99,235,0.08)',
          dark: '#1D4ED8',
        },
        // Surfaces - Theme-aware via CSS variables
        'surface-dark': 'var(--surface-bg)',
        'surface-card': 'var(--surface-card)',
        'surface-elevated': 'var(--surface-elevated)',
        'surface-hover': 'var(--surface-hover)',
        'surface-border': 'var(--surface-border)',
        'surface-glass': 'var(--surface-glass)',
        'surface-subtle': 'var(--surface-subtle)',
        'surface-input': 'var(--surface-input)',
        // Text - Theme-aware via CSS variables
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-muted': 'var(--text-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['1.875rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.025em' }],
        'display': ['1.375rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline': ['1.125rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.015em' }],
        'title-lg': ['1.0625rem', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.01em' }],
        'title': ['0.9375rem', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.01em' }],
        'body-lg': ['0.9375rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['0.875rem', { lineHeight: '1.45', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.45', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        'caption-sm': ['0.6875rem', { lineHeight: '1.35', fontWeight: '400' }],
        'micro': ['0.625rem', { lineHeight: '1.3', fontWeight: '500', letterSpacing: '0.01em' }],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 47px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 34px)',
        'nav-height': '68px',
        '2xs': '2px',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'base': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      borderRadius: {
        'micro': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'elevated': 'var(--shadow-elevated)',
        'bottom-nav': 'var(--shadow-bottom-nav)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
