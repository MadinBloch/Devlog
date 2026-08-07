/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  // Keep existing DevLog CSS intact — only use utilities in Notes/shadcn
  corePlugins: {
    preflight: false,
  },
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--shad-border))',
        input: 'hsl(var(--shad-input))',
        ring: 'hsl(var(--shad-ring))',
        background: 'hsl(var(--shad-background))',
        foreground: 'hsl(var(--shad-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--shad-primary))',
          foreground: 'hsl(var(--shad-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--shad-secondary))',
          foreground: 'hsl(var(--shad-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--shad-destructive))',
          foreground: 'hsl(var(--shad-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--shad-muted))',
          foreground: 'hsl(var(--shad-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--shad-accent))',
          foreground: 'hsl(var(--shad-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--shad-popover))',
          foreground: 'hsl(var(--shad-popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--shad-card))',
          foreground: 'hsl(var(--shad-card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--shad-radius)',
        md: 'calc(var(--shad-radius) - 2px)',
        sm: 'calc(var(--shad-radius) - 4px)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'keep-in': {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'keep-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.96)' },
        },
        'composer-expand': {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'note-rise': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.15s ease-in',
        'keep-in': 'keep-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'keep-out': 'keep-out 0.15s ease-in',
        'composer-expand': 'composer-expand 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'note-rise': 'note-rise 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
