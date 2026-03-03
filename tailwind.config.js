/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ed: {
          bg: {
            DEFAULT: 'var(--ed-bg)',
            secondary: 'var(--ed-bg-secondary)',
            tertiary: 'var(--ed-bg-tertiary)',
            surface: 'var(--ed-bg-surface)',
            hover: 'var(--ed-bg-hover)',
            canvas: 'var(--ed-canvas-bg)',
          },
          text: {
            DEFAULT: 'var(--ed-text)',
            secondary: 'var(--ed-text-secondary)',
            tertiary: 'var(--ed-text-tertiary)',
            inverse: 'var(--ed-text-inverse)',
          },
          border: {
            DEFAULT: 'var(--ed-border)',
            secondary: 'var(--ed-border-secondary)',
            focus: 'var(--ed-border-focus)',
          },
          accent: {
            DEFAULT: 'var(--ed-accent)',
            hover: 'var(--ed-accent-hover)',
            muted: 'var(--ed-accent-muted)',
            text: 'var(--ed-accent-text)',
          },
          success: {
            DEFAULT: 'var(--ed-success)',
            muted: 'var(--ed-success-muted)',
          },
          warning: {
            DEFAULT: 'var(--ed-warning)',
            muted: 'var(--ed-warning-muted)',
          },
          danger: {
            DEFAULT: 'var(--ed-danger)',
            muted: 'var(--ed-danger-muted)',
          },
          info: {
            DEFAULT: 'var(--ed-info)',
            muted: 'var(--ed-info-muted)',
          },
        },
      },
      borderRadius: {
        'ed-sm': 'var(--ed-radius-sm)',
        'ed': 'var(--ed-radius)',
        'ed-lg': 'var(--ed-radius-lg)',
      },
      boxShadow: {
        'ed-sm': 'var(--ed-shadow-sm)',
        'ed': 'var(--ed-shadow)',
        'ed-lg': 'var(--ed-shadow-lg)',
        'ed-xs': 'var(--ed-shadow-xs)',
        'ed-xl': 'var(--ed-shadow-xl)',
        'ed-header': 'var(--ed-shadow-header)',
        'ed-card': 'var(--ed-shadow-card)',
        'ed-card-hover': 'var(--ed-shadow-card-hover)',
        'ed-dropdown': 'var(--ed-shadow-dropdown)',
        'ed-modal': 'var(--ed-shadow-modal)',
      },
      transitionDuration: {
        'theme': '200ms',
      },
      keyframes: {
        'ed-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'ed-fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ed-fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ed-scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'ed-skeleton': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'ed-fade-in': 'ed-fade-in var(--ed-duration-normal) ease-out',
        'ed-fade-in-up': 'ed-fade-in-up var(--ed-duration-slow) ease-out',
        'ed-fade-in-down': 'ed-fade-in-down var(--ed-duration-slow) ease-out',
        'ed-scale-in': 'ed-scale-in var(--ed-duration-slow) ease-out',
        'ed-skeleton': 'ed-skeleton 1.5s ease-in-out infinite',
      },
      backdropBlur: {
        'ed': 'var(--ed-overlay-blur)',
      },
    },
  },
  plugins: [],
}
