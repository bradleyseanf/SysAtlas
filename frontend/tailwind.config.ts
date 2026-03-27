import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          ink: "#0F0B0D",
          surface: "#171114",
          panel: "#21181D",
          glow: "#C73E59",
          gold: "#F0C8D0",
          mist: "#F6EDF0",
          sage: "#6B2735",
          line: "#34262C",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        display: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 28px 80px rgba(4, 6, 9, 0.42)",
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
