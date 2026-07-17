import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves under /PraveenTak_Portfolio/; Vercel (VERCEL=1 at
  // build time) and local dev serve at the domain root.
  base: process.env.VERCEL ? "/" : mode === "production" ? "/PraveenTak_Portfolio/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
