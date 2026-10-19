import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(239, 68, 68, 0.15), 0 20px 45px rgba(239, 68, 68, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
