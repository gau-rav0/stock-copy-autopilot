import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#080808",
          elevated: "#121414",
          hairline: "rgba(255,255,255,0.08)",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          muted: "#9B9B9B",
        },
        brass: {
          DEFAULT: "#009D55",
          dim: "#006D39",
          bright: "#61DE8E",
        },
        gain: "#61DE8E",
        loss: "#FF5A66",
      },
      fontFamily: {
        display: ["'Hanken Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
