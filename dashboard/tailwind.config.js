/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#4A90D9", dark: "#357ABD", light: "#7DB4E6" },
        secondary: "#6C63FF",
        accent: "#FF6B6B",
        success: "#4CAF50",
        warning: "#FFC107",
        danger: "#F44336",
        surface: "#FFFFFF",
        muted: "#F5F7FA",
        text: { DEFAULT: "#1A1A2E", secondary: "#6B7280", light: "#9CA3AF" },
        border: "#E5E7EB",
      },
    },
  },
  plugins: [],
}
