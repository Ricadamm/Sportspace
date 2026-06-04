/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A0F1E',
          card: '#111827',
          mid: '#1A2235',
          border: '#1E2D45',
        },
        blue: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
        },
        lime: {
          DEFAULT: '#A3E635',
          dark: '#84CC16',
        },
        white: '#F8FAFC',
        muted: '#94A3B8',
        text: '#E2E8F0',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#22C55E',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
