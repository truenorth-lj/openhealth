/**
 * Blog Screenshot Generator
 *
 * Usage:
 *   LOCALE=en pnpm exec playwright test e2e/screenshots.e2e.ts
 *   LOCALE=zh-TW pnpm exec playwright test e2e/screenshots.e2e.ts
 *
 * Prerequisites:
 *   - Dev server running on localhost:3001
 *   - Demo account exists (demo-en@openhealth.dev / demo-zh@openhealth.dev)
 *   - Demo data seeded (food diary, water, weight)
 *
 * Output:
 *   public/screenshots/{locale}/01-today.png, 02-food-search.png, ...
 */
import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// ── Config ──────────────────────────────────────────────────────────
const LOCALE = process.env.LOCALE ?? "en";

const ACCOUNTS: Record<string, { email: string; password: string }> = {
  en: { email: "demo-en@openhealth.dev", password: "demopass123" },
  "zh-TW": { email: "test2@openhealth.dev", password: "testpass123" },
};

// Viewport: iPhone 14 Pro-ish
const VIEWPORT = { width: 430, height: 932 };

const OUT_DIR = path.resolve(
  __dirname,
  `../public/screenshots/${LOCALE}`
);

// ── Helpers ─────────────────────────────────────────────────────────
async function login(page: Page) {
  const { email, password } = ACCOUNTS[LOCALE] ?? ACCOUNTS["en"];
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
}

/** Hide Next.js dev indicator and any other dev-only UI */
async function hideDevUI(page: Page) {
  await page.addStyleTag({
    content: `
      /* Next.js dev indicator */
      [data-nextjs-dialog-overlay],
      [data-nextjs-toast],
      nextjs-portal,
      #__next-build-indicator,
      [class*="nextjs-"] {
        display: none !important;
      }
      /* Generic: hide any fixed/absolute element at bottom-left that looks like a dev badge */
      body > div:last-child > a[href*="nextjs"],
      body > div[style*="fixed"][style*="bottom"] {
        display: none !important;
      }
    `,
  });
  // Also try removing the Next.js portal element directly
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    // Remove the __next-build-watcher too
    document.getElementById("__next-build-indicator")?.remove();
  });
}

async function snap(page: Page, name: string) {
  await page.waitForTimeout(800);
  await hideDevUI(page);
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage: false,
  });
}

async function snapFullPage(page: Page, name: string) {
  await page.waitForTimeout(800);
  await hideDevUI(page);
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage: true,
  });
}

// Wait for network to be idle (no pending requests for 500ms)
async function waitForStable(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}

// ── Setup ───────────────────────────────────────────────────────────
test.use({ viewport: VIEWPORT });

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

test.describe(`Blog screenshots [${LOCALE}]`, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // 01 — Today page (main dashboard)
  test("01-today", async ({ page }) => {
    await page.goto("/today");
    await waitForStable(page);
    // Wait for calorie data to load
    await expect(page.locator("text=CONSUMED").or(page.locator("text=已攝取"))).toBeVisible({ timeout: 10_000 });
    await snap(page, "01-today");
  });

  // 02 — Food search page
  test("02-food-search", async ({ page }) => {
    await page.goto("/hub/food/search");
    await waitForStable(page);
    // Type a search query
    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"], input[placeholder*="搜尋"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(LOCALE === "en" ? "chicken" : "雞");
      await page.waitForTimeout(1500); // wait for search results
    }
    await snap(page, "02-food-search");
  });

  // 03 — AI chat (just the page, no conversation needed)
  test("03-ai-chat", async ({ page }) => {
    await page.goto("/hub/chat");
    await waitForStable(page);
    await snap(page, "03-ai-chat");
  });

  // 04 — Progress / weight tracking
  test("04-progress", async ({ page }) => {
    await page.goto("/hub/weight");
    await waitForStable(page);
    await page.waitForTimeout(1000); // extra time for chart rendering
    await snap(page, "04-progress");
  });

  // 05 — Hub page (feature overview)
  test("05-hub", async ({ page }) => {
    await page.goto("/hub");
    await waitForStable(page);
    await snap(page, "05-hub");
  });

  // 06 — Food detail page (need a food ID)
  test("06-food-detail", async ({ page }) => {
    // Search for a food first to get its ID
    await page.goto("/hub/food/search");
    await waitForStable(page);
    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"], input[placeholder*="搜尋"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(LOCALE === "en" ? "Chicken" : "雞胸肉");
      await page.waitForTimeout(1500);
    }
    // Click first result
    const firstResult = page.locator('[data-testid="food-item"], a[href*="/hub/food/"]').first();
    if (await firstResult.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstResult.click();
      await waitForStable(page);
    }
    await snap(page, "06-food-detail");
  });

  // 07 — Create food page
  test("07-food-create", async ({ page }) => {
    await page.goto("/hub/food/create");
    await waitForStable(page);
    await snap(page, "07-food-create");
  });

  // 08 — AI estimate page
  test("08-ai-estimate", async ({ page }) => {
    await page.goto("/hub/food/estimate");
    await waitForStable(page);
    await snap(page, "08-ai-estimate");
  });

  // 09 — Diary page (food log for today)
  test("09-diary", async ({ page }) => {
    await page.goto("/hub/diary");
    await waitForStable(page);
    await snap(page, "09-diary");
  });

  // 10 — Water tracking
  test("10-water", async ({ page }) => {
    await page.goto("/hub/water");
    await waitForStable(page);
    await snap(page, "10-water");
  });

  // 11 — Exercise log
  test("11-exercise", async ({ page }) => {
    await page.goto("/hub/exercise");
    await waitForStable(page);
    await snap(page, "11-exercise");
  });

  // 12 — Intermittent fasting
  test("12-fasting", async ({ page }) => {
    await page.goto("/hub/fasting");
    await waitForStable(page);
    await snap(page, "12-fasting");
  });

  // 13 — Workout home
  test("13-workout-home", async ({ page }) => {
    await page.goto("/hub/workout");
    await waitForStable(page);
    await snap(page, "13-workout-home");
  });

});
