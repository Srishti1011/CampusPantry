/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8ED",
        pantry: "#F59E0B",
        charcoal: "#24211D",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        editorial: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};
