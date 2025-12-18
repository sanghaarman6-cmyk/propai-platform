import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
  "./app/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
  "./lib/**/*.{ts,tsx}",
],

  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#000000",
          secondary: "#0A0A0A",
          panel: "#0F0F0F",
        },
        border: "#1F1F1F",
        text: {
          primary: "#E5E5E5",
          muted: "#9A9A9A",
        },
        accent: {
          green: "#2AFF9C",
          amber: "#F59E0B",
          red: "#EF4444",
          cyan: "#22D3EE",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(42,255,156,0.3)",
      },
    },
  },
  plugins: [],
}

export default config
