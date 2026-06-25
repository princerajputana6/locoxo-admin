/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark surface scale
        ink:      '#0B1120',   // page background
        surface:  '#151E2E',   // cards
        'surface-2': '#1C2738',// raised elements / inputs
        'surface-3': '#243149',// hover surfaces
        line:     '#283649',   // borders
        // Brand
        accent:   '#F59A23',   // primary highlight / logo orange
        'accent-dark': '#E57E00',
        brand:    '#0E4F86',   // navy blue
        'brand-deep': '#062B52',
        glow:     '#FFB84D',   // glowing accent variant
        // Status (tuned for dark)
        success:  '#34D399',
        amber:    '#FBBF24',
        danger:   '#F87171',
        info:     '#60A5FA',
        violet:   '#A78BFA',
        // Text
        fg:       '#E5EDF5',   // primary text
        muted:    '#8FA0B5',   // secondary text
        faint:    '#5F718A',   // tertiary / labels
        // Kept for backward-compat with any existing locoxo-* refs
        locoxo: {
          header: '#062B52',
          blue: '#0E4F86',
          orange: '#F59A23',
          'orange-dark': '#E57E00',
          bg: '#0B1120',
          text: '#E5EDF5',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(245,154,35,0.35), 0 8px 30px -8px rgba(245,154,35,0.45)',
        card: '0 10px 30px -12px rgba(0,0,0,0.6)',
        'card-hover': '0 18px 40px -16px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #F59A23 0%, #FFB84D 100%)',
        'brand-gradient': 'linear-gradient(135deg, #0E4F86 0%, #062B52 100%)',
        'panel-gradient': 'linear-gradient(180deg, rgba(28,39,56,0.6) 0%, rgba(21,30,46,0.9) 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,154,35,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245,154,35,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slide-down 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-glow': 'pulse-glow 2s infinite',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
