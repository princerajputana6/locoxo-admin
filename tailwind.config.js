/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light surface scale (white + blue theme)
        ink:      '#F4F7FB',   // page background (light gray)
        surface:  '#FFFFFF',   // cards
        'surface-2': '#F8FAFC',// raised elements / inputs
        'surface-3': '#EEF3F9',// hover surfaces
        line:     '#E4E9F0',   // borders
        // Brand — blue primary
        accent:   '#2563EB',   // primary blue
        'accent-dark': '#1D4ED8',
        brand:    '#1D4ED8',   // deep blue
        'brand-deep': '#1E3A8A',
        glow:     '#3B82F6',   // lighter blue variant
        // Status (tuned for light)
        success:  '#16A34A',
        amber:    '#D97706',
        danger:   '#DC2626',
        info:     '#2563EB',
        violet:   '#7C3AED',
        // Text
        fg:       '#0F172A',   // primary text (slate-900)
        muted:    '#64748B',   // secondary text (slate-500)
        faint:    '#94A3B8',   // tertiary / labels (slate-400)
        // Kept for backward-compat with any existing locoxo-* refs
        locoxo: {
          header: '#1E3A8A',
          blue: '#2563EB',
          orange: '#2563EB',
          'orange-dark': '#1D4ED8',
          bg: '#F4F7FB',
          text: '#0F172A',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(37,99,235,0.25), 0 8px 30px -8px rgba(37,99,235,0.35)',
        card: '0 1px 2px rgba(16,24,40,0.05), 0 8px 24px -12px rgba(16,24,40,0.12)',
        'card-hover': '0 4px 12px rgba(16,24,40,0.08), 0 18px 40px -16px rgba(16,24,40,0.16)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
        'brand-gradient': 'linear-gradient(135deg, #1D4ED8 0%, #1E3A8A 100%)',
        'panel-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
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
