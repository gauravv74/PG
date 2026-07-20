/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e5ff",
          200: "#bcd0ff",
          300: "#8eb1ff",
          400: "#5885ff",
          500: "#2f5cff",
          600: "#173ff5",
          700: "#122fe1",
          800: "#1629b6",
          900: "#182a8f",
        },
        accent: {
          500: "#ff5a5f",
          600: "#e14b50",
        },
      },
      boxShadow: {
        card: "0 6px 24px -8px rgba(17, 47, 225, 0.15)",
        soft: "0 2px 12px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
