import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './lib/**/*.{ts}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0d0f1a',
          800: '#12141f',
          700: '#1c1f2e',
          600: '#252838',
          500: '#2e3148',
          400: '#3d4060'
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e8c76a',
          dark: '#a08535',
          muted: '#8a7240'
        },
        accent: '#5c8a91'
      },
      boxShadow: {
        panel: '0 4px 24px rgba(0,0,0,0.45)',
        soft: '0 2px 12px rgba(0,0,0,0.3)'
      }
    }
  },
  plugins: []
};

export default config;
