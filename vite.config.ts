import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // SPA pura: não existe `process` no browser. O client Supabase usa
    // `import.meta.env.VITE_*` e só cai em process.env como fallback de SSR.
    "process.env.SUPABASE_URL": "undefined",
    "process.env.SUPABASE_PUBLISHABLE_KEY": "undefined",
  },
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
  },
});
