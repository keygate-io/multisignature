/** @type {import('tailwindcss').Config} */

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  darkMode: false,
  plugins: [],
  corePlugins: {
    preflight: false, // fix antd & tailwind conflicts
  },
};
