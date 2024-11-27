// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        customBlue: '#1E40AF',
        customGray: {
          light: '#F3F4F6',
          default: '#9CA3AF',
          dark: '#374151',
        },
        customWhite: {
          light: '#F3F4F6',
          default: '#9CA3AF',
          dark: '#374151',
        }
      },
    },
  },
  plugins: [],
};
