import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // 📦 Configuration du serveur de développement
  server: {
    port: 5173,
    open: true,
    // 🔁 Proxy pour éviter les erreurs CORS pendant le développement
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // ⚙️ Build optimisé pour la production
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020",
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
  },

  // 🧭 Alias pour des imports plus propres
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ⚡ Optionnel : tu peux garder ton exclusion si lucide-react cause un bug
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
});
