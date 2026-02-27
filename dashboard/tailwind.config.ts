import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#8b5cf6",
          hover: "#7c3aed",
          light: "#a78bfa",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
