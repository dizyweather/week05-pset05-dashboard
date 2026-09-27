import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The dev server prints http://localhost:5173 — that is the address the
// assignment brief tells you to open.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
