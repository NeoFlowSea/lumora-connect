import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // relative asset paths so the build works on GitHub Pages or any subfolder
  base: "./",
  server: { port: 5173 },
});
