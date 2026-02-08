import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from root so we can read CONVEX_SITE_URL for the proxy target
  const env = loadEnv(mode, path.resolve(__dirname, ".."), [
    "VITE_",
    "CONVEX_",
  ]);

  const convexSiteUrl =
    env.CONVEX_SITE_URL || "https://tame-crow-429.convex.site";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        // Auth routes → Convex site (must come BEFORE the generic /api proxy)
        "/api/auth": {
          target: convexSiteUrl,
          changeOrigin: true,
          secure: true,
          // Rewrite cookies so they work on localhost
          cookieDomainRewrite: {
            "*": "",
          },
        },
        // All other /api routes → Fastify backend
        "/api": {
          target: "http://localhost:3088",
          changeOrigin: true,
        },
      },
    },
    // Expose CONVEX_ env vars to the frontend (Vite defaults to VITE_ only)
    envPrefix: ["VITE_", "CONVEX_"],
    envDir: path.resolve(__dirname, ".."),
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@convex": path.resolve(__dirname, "../convex"),
      },
    },
  };
});
