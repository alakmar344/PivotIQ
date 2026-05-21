/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        surface: "#12121a",
        card: "#1a1a28",
        border: "#2a2a40",
        primary: "#6366f1",
        primaryHover: "#4f46e5",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        textPrimary: "#f1f5f9",
        textSecondary: "#94a3b8"
      }
    }
  },
  plugins: []
};
