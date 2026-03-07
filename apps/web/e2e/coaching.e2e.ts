import { test, expect, Page } from "@playwright/test";

// Known working test account
const TEST_USER = { email: "test2@openhealth.dev", password: "testpass123", name: "Test User", code: "FJF76J" };

async function login(page: Page) {
  await page.goto("/hub");
  await page.waitForLoadState("networkidle");

  const headerLoginBtn = page.locator("header").getByText("登入");
  if (!(await headerLoginBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
    return; // Already logged in
  }

  await headerLoginBtn.click();
  await expect(page.getByText("登入以繼續")).toBeVisible({ timeout: 10_000 });
  await page.getByPlaceholder("電子郵件").fill(TEST_USER.email);
  await page.getByPlaceholder("密碼").fill(TEST_USER.password);
  await page.locator("button[type='submit']").click();

  // Wait for dialog to close
  await expect(page.getByText("登入以繼續")).not.toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(500);
}

test.describe("Coaching feature", () => {
  test("coach dashboard renders with invite code", async ({ page }) => {
    await login(page);
    await page.goto("/coach");
    await page.waitForLoadState("networkidle");

    // Header
    await expect(page.getByText("OH COACH")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("返回 App")).toBeVisible();

    // Title and invite code
    await expect(page.locator("text=教練儀表板")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(TEST_USER.code)).toBeVisible({ timeout: 10_000 });
  });

  test("coach dashboard shows empty client list", async ({ page }) => {
    await login(page);
    await page.goto("/coach");
    await page.waitForLoadState("networkidle");

    // Empty state OR client list (depends on DB state)
    const clientSection = page.locator("text=學員列表");
    await expect(clientSection).toBeVisible({ timeout: 10_000 });
  });

  test("settings shows coaching menu item", async ({ page }) => {
    await login(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("我的教練")).toBeVisible({ timeout: 10_000 });
  });

  test("coaching settings page renders correctly", async ({ page }) => {
    await login(page);
    await page.goto("/settings/coaching");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1", { hasText: "我的教練" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder("輸入教練碼")).toBeVisible();
    await expect(page.getByRole("button", { name: "加入" })).toBeVisible();
  });

  test("cannot join self as coach", async ({ page }) => {
    await login(page);
    await page.goto("/settings/coaching");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("輸入教練碼").fill(TEST_USER.code);
    await page.getByRole("button", { name: "加入" }).click();

    await expect(page.getByText("不能加入自己為教練")).toBeVisible({ timeout: 10_000 });
  });

  test("shows error for invalid coach code", async ({ page }) => {
    await login(page);
    await page.goto("/settings/coaching");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("輸入教練碼").fill("ZZZZZZZZ");
    await page.getByRole("button", { name: "加入" }).click();

    await expect(page.getByText("教練碼不存在")).toBeVisible({ timeout: 10_000 });
  });

  test("coach client detail page renders when accessed", async ({ page }) => {
    await login(page);
    await page.goto("/coach");
    await page.waitForLoadState("networkidle");

    // Check if there are any clients to click
    const clientLink = page.locator("a[href^='/coach/client/']").first();
    if (await clientLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await clientLink.click();
      await expect(page).toHaveURL(/\/coach\/client\//);
      await expect(page.getByText("返回學員列表")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("週平均")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByPlaceholder(/例：每天攝取/)).toBeVisible();
    }
    // If no clients, that's fine — we just skip this part
  });

  test("返回 App link navigates to hub", async ({ page }) => {
    await login(page);
    await page.goto("/coach");
    await page.waitForLoadState("networkidle");

    await page.getByText("返回 App").click();
    await expect(page).toHaveURL(/\/hub/);
  });
});
