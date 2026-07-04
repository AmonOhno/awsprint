/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 分野カラー（ui/specification.md の共通UI原則）
        domain: {
          secure: "#2563eb", // SECURE_ARCH 青
          resilient: "#16a34a", // RESILIENT 緑
          perf: "#ea580c", // HIGH_PERF 橙
          cost: "#9333ea", // COST_OPT 紫
        },
      },
      keyframes: {
        "node-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(37,99,235,0.5)" },
          "50%": { boxShadow: "0 0 0 6px rgba(37,99,235,0.15)" },
        },
      },
      animation: {
        "node-glow": "node-glow 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
