/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Glaido Official Design System Color Tokens (extracted from live glaido.com)
        glaido: {
          bg: '#0D0D0D', // Obsidian black base
          card: '#1A1A1A', // Dark charcoal card
          'card-hover': '#242424',
          panel: '#262626',
          surface: '#333333',
          input: 'rgba(0, 0, 0, 0.35)',
          modal: 'rgba(255, 255, 255, 0.05)',
          // Signature Accents
          lime: '#BFF549', // Glaido core signature electric lime
          'lime-hover': '#8CC21F',
          'lime-active': '#6FA014',
          'lime-subtle': 'rgba(191, 245, 73, 0.12)',
          'lime-border': 'rgba(191, 245, 73, 0.35)',
          terracotta: '#D97757', // Glaido warm terracotta coral
          blue: '#2B6CFF', // Glaido electric info blue
          violet: '#4B3FC4', // Glaido deep violet
          orange: '#FF8A1F', // Glaido alert orange
          red: '#FF2B3A', // Glaido critical danger red
          // Typography Tiers
          text: '#FFFFFF',
          'text-subdued': 'rgba(255, 255, 255, 0.70)',
          'text-muted': 'rgba(255, 255, 255, 0.35)',
          'text-dark': '#000000',
          // Borders
          border: 'rgba(255, 255, 255, 0.10)',
          'border-subtle': 'rgba(255, 255, 255, 0.06)',
          'border-active': '#BFF549',
        },
        // Mapped campus and slate to seamlessly blend with Glaido theme
        slate: {
          700: '#333333',
          750: '#262626',
          800: '#222222',
          850: '#1A1A1A',
          900: '#141414',
          950: '#0D0D0D',
        },
      },
      fontFamily: {
        sans: [
          'Aspekta',
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'Geist Mono Variable',
          'Geist Mono',
          'JetBrains Mono',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        // Glaido Exact Typography Scale
        'g-micro': ['9px', { lineHeight: '12px', letterSpacing: '0.04em' }],
        'g-caption': ['11px', { lineHeight: '15px', letterSpacing: '0.015em' }],
        'g-sm': ['13px', { lineHeight: '18px', letterSpacing: '-0.01em' }],
        'g-base': ['15px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        'g-sub': ['17px', { lineHeight: '24px', letterSpacing: '-0.015em' }],
        'g-title': ['22px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
        'g-section': ['28px', { lineHeight: '34px', letterSpacing: '-0.025em' }],
        'g-display': ['36px', { lineHeight: '42px', letterSpacing: '-0.03em' }],
        'g-hero': ['52px', { lineHeight: '58px', letterSpacing: '-0.035em' }],
      },
      boxShadow: {
        'glaido-card': 'inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 4px 24px rgba(0, 0, 0, 0.60)',
        'glaido-card-hover': 'inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 8px 32px rgba(0, 0, 0, 0.75)',
        'glaido-sheen': 'inset 0 1px 0 rgba(255, 255, 255, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'glaido-glow': '0 0 24px rgba(191, 245, 73, 0.28)',
        'glaido-glow-sm': '0 0 12px rgba(191, 245, 73, 0.20)',
        'glaido-button': '0 2px 10px rgba(191, 245, 73, 0.35)',
      },
      borderRadius: {
        'glaido-sm': '4px',
        'glaido-md': '8px',
        'glaido-lg': '12px',
        'glaido-xl': '16px',
        'glaido-2xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.165, 0.84, 0.44, 1)',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glaido-glow': 'glaidoGlow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        glaidoGlow: {
          '0%': { boxShadow: '0 0 12px rgba(191, 245, 73, 0.15)' },
          '100%': { boxShadow: '0 0 28px rgba(191, 245, 73, 0.35)' },
        },
      },
    },
  },
  plugins: [],
};
