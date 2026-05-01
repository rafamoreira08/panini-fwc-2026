import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(22 163 74 / <alpha-value>)',
        secondary: 'rgb(59 130 246 / <alpha-value>)',
        accent: 'rgb(184 134 11 / <alpha-value>)',
      },
      borderRadius: {
        xs: 'var(--radius-sm)',
        sm: 'var(--radius-md)',
        md: 'var(--radius-lg)',
        lg: 'var(--radius-xl)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
      },
      boxShadow: {
        xs: 'var(--shadow-sm)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#111827',
            a: {
              color: '#16a34a',
              '&:hover': {
                color: '#15803d',
              },
            },
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
