import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          ink: "#07111F",
          surface: "#0D1B2A",
          panel: "#11243A",
          glow: "#2DD4BF",
          gold: "#F4D35E",
          mist: "#D8E8F4",
        },
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Manrope", "sans-serif"],
      },
      boxShadow: {
        panel: "0 25px 80px rgba(7, 17, 31, 0.35)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(24px, -20px, 0) scale(1.04)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.8" },
        },
        gridPan: {
          "0%": { backgroundPosition: "0 0, 0 0" },
          "100%": { backgroundPosition: "120px 120px, 0 0" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        drift: "drift 18s ease-in-out infinite",
        pulseGlow: "pulseGlow 5s ease-in-out infinite",
        gridPan: "gridPan 16s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

