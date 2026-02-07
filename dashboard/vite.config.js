import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  theme: {
    extend: {
      colors: {
        primary: "#4e73df",
        success: "#1cc88a",
        warning: "#f6c23e",
        danger: "#e74a3b",
        info: "#36b9cc",
        slate700: "#374151",
      },
    },
  },
});
