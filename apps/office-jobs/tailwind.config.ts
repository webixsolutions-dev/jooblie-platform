import type { Config } from 'tailwindcss'
import preset from '../jooblie/tailwind.config'

const config: Config = {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#0a1628',
          50: '#f0f4f9',
          100: '#dae3ee',
          200: '#b5c7dd',
          300: '#8ba9c9',
          400: '#5c85ab',
          500: '#3d668c',
          600: '#2a4d6e',
          700: '#1c3854',
          800: '#132840',
          900: '#0f1c30',
          950: '#0a1628',
        },
        gold: {
          DEFAULT: '#eab308',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        },
      },
    },
  },
}

export default config