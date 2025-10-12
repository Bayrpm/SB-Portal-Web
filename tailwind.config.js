/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          661: "#003C96", // Pantone 661 C
          process: "#0085CA", // Pantone Process Blue C
          3115: "#00A7CE", // Pantone 3115 C
        },
      },
    },
  },
  plugins: [],
};
