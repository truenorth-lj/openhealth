import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    name: "web-integration",
    root: path.resolve(__dirname),
    include: ["src/**/*.itest.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
