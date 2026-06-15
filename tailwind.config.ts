// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F2542D',
          'primary-hover': '#E04A25',
          'primary-light': '#FEF0EC',
          background: '#F5F1EB',
          'background-dark': '#EDE7DD',
          surface: '#FFFFFF',
          'surface-hover': '#FAF7F2',
          text: '#2D2B28',
          'text-secondary': '#78716C',
          'text-muted': '#A8A29E',
          border: '#E7E0D5',
          success: '#65A30D',
          warning: '#D97706',
          error: '#DC2626',
          coffee: {
            dark: '#3C2A21',
            medium: '#6F4E37',
            light: '#C4A882',
            cream: '#F5E6D3',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
export default config