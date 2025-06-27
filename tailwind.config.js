/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'head-move': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(80%)' },
        },
      },
      animation: {
        'head-move': 'head-move 2s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Otros plugins si los hay
  ],
};