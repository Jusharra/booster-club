import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdaff',
          300: '#8ec2ff',
          400: '#59a1ff',
          500: '#2f7dff',
          600: '#185ef2',
          700: '#144bd6',
          800: '#173fac',
          900: '#183988',
          950: '#0f2354',
        },
      },
    },
  },
  plugins: [],
};

export default config;
