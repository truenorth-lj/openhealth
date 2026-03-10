import { defineConfig } from "@playwright/test";

/**
 * Minimal Playwright config for screenshot generation.
 * Assumes dev server is already running on localhost:3001.
 */
export default defineConfig({
  testDir: ".",
  testMatch: "e2e/screenshots.e2e.ts",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://localhost:3001",
    trace: "off",
  },
});
