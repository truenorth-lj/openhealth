import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/shared/vitest.config.ts",
  "apps/web/vitest.config.ts",
  // mobile excluded: Expo/RN modules need isolated execution via `turbo test`
]);
