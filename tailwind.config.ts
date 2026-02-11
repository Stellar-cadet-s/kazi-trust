import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#10b981', // emerald-500
          foreground: '#ffffff',
        },
        background: '#f9fafb', // gray-50
        text: {
          DEFAULT: '#1f2937', // gray-900
          secondary: '#4b5563', // gray-600
        },
        card: {
          DEFAULT: '#f9fafb', // gray-50 - maps to background
          foreground: '#1f2937', // gray-900 - maps to text.DEFAULT
        },
        "muted-foreground": '#4b5563', // gray-600 - maps to text.secondary
        destructive: {
          DEFAULT: '#ef4444', // red-500
          foreground: '#ffffff', // white
        },
        input: '#4b5563', // gray-600 - maps to text.secondary for border
        ring: '#2563eb', // blue-600 - maps to primary.DEFAULT for focus ring
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
export default config