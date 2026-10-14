import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1210",
          elevated: "#14201B",
          hairline: "rgba(255,255,255,0.08)",
        },
        paper: {
          DEFAULT: "#E8F0EB",
          muted: "#AAB8AF",
        },
        brass: {
          DEFAULT: "#34D399",
          dim: "#006D39",
          bright: "#34D399",
        },
        gain: "#34D399",
        loss: "#FF5A66",
      },
      fontFamily: {
        display: ["'Inter Variable'", "sans-serif"],
        body: ["'Inter Variable'", "sans-serif"],
        mono: ["ui-monospace", "Consolas", "monospace"],
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
