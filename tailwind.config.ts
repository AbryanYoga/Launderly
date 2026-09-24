import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: "#2A3042",
        dark: "#2A3042",
        dashboard: "#F8F9FA",
        primary: "#0284C7",
        success: "#34C38F",
        warning: "#F1B44C",
        danger: "#F46A6A",
      },
    },
  },
  plugins: [],
};

export default config;
