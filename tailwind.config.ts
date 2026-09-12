import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#080c09",
          panel: "#0e1510",
          card: "#121b15",
          border: "#1d2e23",
          hover: "#18241c",
          muted: "#7d9485",
          dim: "#4e6154",
          green: "#22c55e",
          "green-bright": "#4ade80",
          "green-dark": "#14532d",
          red: "#ef4444",
          "red-bright": "#f87171",
          "red-dark": "#7f1d1d",
          amber: "#f59e0b",
          cyan: "#06b6d4",
          purple: "#a855f7",
          text: "#e5ece7",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
