import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    // Lifted to es2022 so PlatformDataContext.tsx can use top-level await
    // around the gated `import("@/data/mockData")` call without a runtime
    // shim. Browsers that hit this build (chrome ≥89 / firefox ≥89 /
    // safari ≥15) all support top-level await natively.
    target: "es2022",
  },
}));
