import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ---------- brand palette & sizing ---------- */
      colors: {
        background: "#F5F5F5",
        primary:    "#36454F",
        secondary:  "#6C7A83",
        accent:     "#B87333",
        cta:        "#FF8A3D",
        white:      "#ffffff",
        header:     "#2D3A3F",
        headerDark: "#1F2B30",
      },
      fontFamily: {
        sans: ["Helvetica Neue", "Arial", "sans-serif"],
      },
      spacing: {
        15: "60px", // header height
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
