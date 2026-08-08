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
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dae3ee',
          // ... beech ke shades
          900: '#0f1c30',
          950: '#0a1628',
        },
        gold: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },
      },
    },
  },
}

export default config